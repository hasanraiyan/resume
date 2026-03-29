import { computeAnalysis } from '@/lib/finance-analysis';
import {
  canUseIndexedDb,
  clearStore,
  clearStores,
  deleteRecord,
  enqueueSyncOperation,
  getAllRecords,
  getMeta,
  getRecord,
  getSyncQueue,
  putRecord,
  removeSyncOperation,
  setMeta,
} from '@/lib/finance-db';

const channelName = 'finance-data-sync';
const localIdPrefix = 'local_';

function nowIso() {
  return new Date().toISOString();
}

function createLocalId(type) {
  return `${localIdPrefix}${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function isLocalId(id) {
  return typeof id === 'string' && id.startsWith(localIdPrefix);
}

function isOnline() {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

function getChannel() {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null;
  }
  return new BroadcastChannel(channelName);
}

function notifyChange(reason) {
  const channel = getChannel();
  channel?.postMessage({ type: 'finance-data-changed', reason, timestamp: nowIso() });
  channel?.close();
}

function createResetConflict(syncState) {
  const error = new Error(
    'Finance data was reset on another device while this device still has offline changes.'
  );
  error.code = 'FINANCE_RESET_CONFLICT';
  error.syncState = syncState;
  return error;
}

async function requestBackgroundSync() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if ('sync' in registration) {
      await registration.sync.register('finance-sync');
    }
  } catch (error) {
    console.error('Finance background sync registration failed:', error);
  }
}

async function readStoreSnapshot() {
  const [accounts, categories, transactions, budgets] = await Promise.all([
    getAllRecords('accounts'),
    getAllRecords('categories'),
    getAllRecords('transactions'),
    getAllRecords('budgets'),
  ]);

  return {
    accounts,
    categories,
    transactions: transactions.sort((a, b) => new Date(b.date) - new Date(a.date)),
    budgets,
  };
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request failed for ${url}`);
  }
  return data;
}

async function applyRemoteRecords(storeName, records) {
  for (const record of records) {
    if (record.deletedAt) {
      await deleteRecord(storeName, record.id);
    } else {
      await putRecord(storeName, record);
    }
  }
}

async function wipeLocalFinanceData() {
  await clearStores(['accounts', 'categories', 'transactions', 'budgets', 'syncQueue']);
  await setMeta('financeIdMap', {});
}

async function pullRemoteChanges() {
  const since = await getMeta('lastRemoteSyncAt', null);
  const localResetVersion = await getMeta('financeResetVersion', 0);
  const query = since ? `?since=${encodeURIComponent(since)}` : '';
  const data = await fetchJson(`/api/money/sync/pull${query}`);
  const changes = data.changes || {};
  const syncState = data.syncState || { resetVersion: 0, resetAt: null };
  const pendingQueue = await getSyncQueue();

  if ((syncState.resetVersion || 0) > localResetVersion) {
    if (pendingQueue.length > 0) {
      await setMeta('financeSyncConflict', {
        type: 'remote_reset_with_pending_changes',
        resetVersion: syncState.resetVersion,
        resetAt: syncState.resetAt,
      });
      throw createResetConflict(syncState);
    }

    await wipeLocalFinanceData();
    await setMeta('financeResetVersion', syncState.resetVersion || 0);
    await setMeta('financeSyncConflict', null);
  }

  await Promise.all([
    applyRemoteRecords('accounts', changes.accounts || []),
    applyRemoteRecords('categories', changes.categories || []),
    applyRemoteRecords('transactions', changes.transactions || []),
    applyRemoteRecords('budgets', changes.budgets || []),
  ]);

  await setMeta('lastRemoteSyncAt', data.serverTime || nowIso());
  await setMeta('financeResetVersion', syncState.resetVersion || 0);
  await setMeta('financeSyncConflict', null);
  notifyChange('remote-pull');
}

async function getIdMap() {
  return (await getMeta('financeIdMap', {})) || {};
}

async function setIdMap(idMap) {
  await setMeta('financeIdMap', idMap);
}

async function resolveServerId(id) {
  if (!id) return id;
  const idMap = await getIdMap();
  return idMap[id] || id;
}

async function normalizePayloadReferences(payload) {
  if (!payload) return payload;
  const next = structuredClone(payload);
  if (next.account) next.account = await resolveServerId(next.account);
  if (next.toAccount) next.toAccount = await resolveServerId(next.toAccount);
  if (next.category) next.category = await resolveServerId(next.category);
  return next;
}

function attachLocalMeta(record, status) {
  return {
    ...record,
    _local: {
      status,
      updatedAt: nowIso(),
    },
  };
}

async function enqueueOperation(operation) {
  await enqueueSyncOperation({
    id: createLocalId('queue'),
    ...operation,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  await setMeta('lastPendingChangeAt', nowIso());
  await requestBackgroundSync();
  notifyChange('queue-updated');
}

export async function getFinanceSnapshot({ periodStart, periodEnd }) {
  const snapshot = await readStoreSnapshot();
  const analysis = computeAnalysis({
    ...snapshot,
    startDate: periodStart,
    endDate: periodEnd,
  });

  return {
    ...snapshot,
    analysis,
    lastRemoteSyncAt: await getMeta('lastRemoteSyncAt', null),
    pendingSyncCount: (await getSyncQueue()).length,
    syncConflict: await getMeta('financeSyncConflict', null),
    financeResetVersion: await getMeta('financeResetVersion', 0),
  };
}

export async function hydrateFinanceData({ periodStart, periodEnd }) {
  if (!canUseIndexedDb()) {
    throw new Error('IndexedDB is required for finance local storage.');
  }

  let snapshot = await getFinanceSnapshot({ periodStart, periodEnd });
  if (
    snapshot.accounts.length === 0 &&
    snapshot.categories.length === 0 &&
    snapshot.transactions.length === 0 &&
    isOnline()
  ) {
    await refreshFinanceData({ periodStart, periodEnd });
    snapshot = await getFinanceSnapshot({ periodStart, periodEnd });
  }

  return snapshot;
}

export async function refreshFinanceData({ periodStart, periodEnd }) {
  await flushSyncQueue();
  const remainingQueue = await getSyncQueue();
  if (isOnline() && remainingQueue.length === 0) {
    await pullRemoteChanges();
  }
  return getFinanceSnapshot({ periodStart, periodEnd });
}

async function rewriteReferences(oldId, newId) {
  const [transactions, budgets, queue] = await Promise.all([
    getAllRecords('transactions'),
    getAllRecords('budgets'),
    getSyncQueue(),
  ]);

  const updatedTransactions = transactions
    .map((transaction) => {
      let changed = false;
      const next = { ...transaction };

      if (next.account?.id === oldId) {
        next.account = { ...next.account, id: newId, _id: newId };
        changed = true;
      } else if (next.account === oldId) {
        next.account = newId;
        changed = true;
      }

      if (next.toAccount?.id === oldId) {
        next.toAccount = { ...next.toAccount, id: newId, _id: newId };
        changed = true;
      } else if (next.toAccount === oldId) {
        next.toAccount = newId;
        changed = true;
      }

      if (next.category?.id === oldId) {
        next.category = { ...next.category, id: newId, _id: newId };
        changed = true;
      } else if (next.category === oldId) {
        next.category = newId;
        changed = true;
      }

      return changed ? next : null;
    })
    .filter(Boolean);

  const updatedBudgets = budgets
    .map((budget) => {
      if (budget.category?.id === oldId) {
        return { ...budget, category: { ...budget.category, id: newId, _id: newId } };
      }
      if (budget.category === oldId) {
        return { ...budget, category: newId };
      }
      return null;
    })
    .filter(Boolean);

  const updatedQueue = queue
    .map((item) => {
      const payloadText = JSON.stringify(item.payload);
      const nextText = payloadText.replaceAll(oldId, newId);
      if (payloadText === nextText) {
        return null;
      }
      return { ...item, payload: JSON.parse(nextText) };
    })
    .filter(Boolean);

  await Promise.all([
    ...updatedTransactions.map((record) => putRecord('transactions', record)),
    ...updatedBudgets.map((record) => putRecord('budgets', record)),
    ...updatedQueue.map((record) => putRecord('syncQueue', record)),
  ]);
}

export async function flushSyncQueue() {
  if (!canUseIndexedDb() || !isOnline()) {
    return false;
  }

  const queue = await getSyncQueue();
  if (queue.length === 0) {
    return true;
  }

  try {
    const data = await fetchJson('/api/money/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operations: queue }),
    });

    const idMap = await getIdMap();
    for (const [oldId, newId] of Object.entries(data.idMap || {})) {
      idMap[oldId] = newId;
      await rewriteReferences(oldId, newId);
    }
    await setIdMap(idMap);

    for (const item of data.applied || []) {
      await removeSyncOperation(item.queueId);
      if (item.record) {
        await putRecord(item.storeName, item.record);
      } else if (item.deleted && item.serverId) {
        await deleteRecord(item.storeName, item.serverId);
      }
    }
  } catch (error) {
    console.error('Finance sync operation failed:', error);
    return false;
  }

  notifyChange('queue-flushed');
  return true;
}

async function createOrQueue({ storeName, endpoint, responseKey, record, label }) {
  if (isOnline()) {
    const data = await fetchJson(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    await putRecord(storeName, data[responseKey]);
    notifyChange(`${label}-created`);
    return data[responseKey];
  }

  const offlineRecord = attachLocalMeta({ ...record, id: createLocalId(label) }, 'pending_create');
  await putRecord(storeName, offlineRecord);
  await enqueueOperation({
    type: 'create',
    storeName,
    endpoint,
    responseKey,
    recordId: offlineRecord.id,
    payload: record,
  });
  return offlineRecord;
}

async function updateOrQueue({ storeName, endpoint, responseKey, id, record, label }) {
  const localRecord = await getRecord(storeName, id);
  const merged = attachLocalMeta({ ...localRecord, ...record, id }, 'pending_update');
  await putRecord(storeName, merged);

  const targetId = await resolveServerId(id);
  if (isOnline() && !isLocalId(targetId)) {
    const data = await fetchJson(`${endpoint}/${targetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    await putRecord(storeName, data[responseKey]);
    notifyChange(`${label}-updated`);
    return data[responseKey];
  }

  await enqueueOperation({
    type: 'update',
    storeName,
    endpoint,
    responseKey,
    recordId: id,
    payload: record,
  });
  return merged;
}

async function deleteOrQueue({ storeName, endpoint, id, label }) {
  await deleteRecord(storeName, id);
  const targetId = await resolveServerId(id);
  if (!isLocalId(targetId) && isOnline()) {
    await fetchJson(`${endpoint}/${targetId}`, { method: 'DELETE' });
  } else if (!isLocalId(targetId)) {
    await enqueueOperation({
      type: 'delete',
      storeName,
      endpoint,
      recordId: id,
      payload: null,
    });
  }
  notifyChange(`${label}-deleted`);
}

export async function createTransaction(transaction) {
  if (isOnline()) {
    const data = await fetchJson('/api/money/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    });
    await putRecord('transactions', data.transaction);
    notifyChange('transaction-created');
    return data.transaction;
  }

  const [categoryRecord, accountRecord, toAccountRecord] = await Promise.all([
    transaction.category ? getRecord('categories', transaction.category) : null,
    transaction.account ? getRecord('accounts', transaction.account) : null,
    transaction.toAccount ? getRecord('accounts', transaction.toAccount) : null,
  ]);

  const offlineRecord = attachLocalMeta(
    {
      ...transaction,
      id: createLocalId('transaction'),
      category: categoryRecord || transaction.category || null,
      account: accountRecord || transaction.account,
      toAccount: toAccountRecord || transaction.toAccount || null,
    },
    'pending_create'
  );
  await putRecord('transactions', offlineRecord);
  await enqueueOperation({
    type: 'create',
    storeName: 'transactions',
    endpoint: '/api/money/transactions',
    responseKey: 'transaction',
    recordId: offlineRecord.id,
    payload: transaction,
  });
  return offlineRecord;
}

export function deleteTransactionRecord(id) {
  return deleteOrQueue({
    storeName: 'transactions',
    endpoint: '/api/money/transactions',
    id,
    label: 'transaction',
  });
}

export function createAccount(record) {
  return createOrQueue({
    storeName: 'accounts',
    endpoint: '/api/money/accounts',
    responseKey: 'account',
    record,
    label: 'account',
  });
}

export function updateAccountRecord(id, record) {
  return updateOrQueue({
    storeName: 'accounts',
    endpoint: '/api/money/accounts',
    responseKey: 'account',
    id,
    record,
    label: 'account',
  });
}

export function deleteAccountRecord(id) {
  return deleteOrQueue({
    storeName: 'accounts',
    endpoint: '/api/money/accounts',
    id,
    label: 'account',
  });
}

export function createCategory(record) {
  return createOrQueue({
    storeName: 'categories',
    endpoint: '/api/money/categories',
    responseKey: 'category',
    record,
    label: 'category',
  });
}

export function updateCategoryRecord(id, record) {
  return updateOrQueue({
    storeName: 'categories',
    endpoint: '/api/money/categories',
    responseKey: 'category',
    id,
    record,
    label: 'category',
  });
}

export function deleteCategoryRecord(id) {
  return deleteOrQueue({
    storeName: 'categories',
    endpoint: '/api/money/categories',
    id,
    label: 'category',
  });
}

export async function upsertBudget(record) {
  const categoryRecord =
    typeof record.category === 'string'
      ? await getRecord('categories', record.category)
      : record.category;
  const localRecord = attachLocalMeta(
    {
      ...record,
      id: record.id || record._id || createLocalId('budget'),
      category: categoryRecord || record.category,
    },
    'pending_update'
  );
  await putRecord('budgets', localRecord);

  if (isOnline()) {
    const payload = await normalizePayloadReferences(record);
    const data = await fetchJson('/api/money/budgets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await putRecord('budgets', data.budget);
    notifyChange('budget-upserted');
    return data.budget;
  }

  await enqueueOperation({
    type: 'budget-upsert',
    storeName: 'budgets',
    endpoint: '/api/money/budgets',
    responseKey: 'budget',
    recordId: localRecord.id,
    payload: record,
  });
  return localRecord;
}

export function subscribeToFinanceChanges(callback) {
  const channel = getChannel();
  if (!channel) return () => {};

  channel.onmessage = (event) => {
    if (event.data?.type === 'finance-data-changed') {
      callback(event.data);
    }
  };

  return () => channel.close();
}

export async function discardLocalChangesAndAcceptRemoteReset() {
  const conflict = await getMeta('financeSyncConflict', null);
  const resetVersion = conflict?.resetVersion || (await getMeta('financeResetVersion', 0));
  await wipeLocalFinanceData();
  await setMeta('financeIdMap', {});
  await setMeta('financeSyncConflict', null);
  await setMeta('financeResetVersion', resetVersion);
  await setMeta('lastRemoteSyncAt', null);
  notifyChange('remote-reset-accepted');
}

export async function clearAllFinanceData() {
  const data = await fetchJson('/api/money/reset', { method: 'POST' });
  const syncState = data.syncState || { resetVersion: 0, resetAt: null };
  await wipeLocalFinanceData();
  await setMeta('financeIdMap', {});
  await setMeta('financeSyncConflict', null);
  await setMeta('financeResetVersion', syncState.resetVersion || 0);
  await setMeta('lastRemoteSyncAt', syncState.resetAt || nowIso());
  notifyChange('all-finance-data-cleared');
  return syncState;
}

export async function clearLocalFinanceCache() {
  await wipeLocalFinanceData();
  await setMeta('financeIdMap', {});
  await setMeta('financeSyncConflict', null);
  await setMeta('lastRemoteSyncAt', null);
  notifyChange('local-finance-cache-cleared');
}

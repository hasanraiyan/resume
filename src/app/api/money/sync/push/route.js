import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Account from '@/models/Account';
import Category from '@/models/Category';
import Transaction from '@/models/Transaction';
import Budget from '@/models/Budget';
import {
  serializeAccount,
  serializeBudget,
  serializeCategory,
  serializeTransaction,
} from '@/lib/money-serializers';

const serializers = {
  accounts: serializeAccount,
  categories: serializeCategory,
  transactions: serializeTransaction,
  budgets: serializeBudget,
};

const modelMap = {
  accounts: Account,
  categories: Category,
  transactions: Transaction,
  budgets: Budget,
};

function remapValue(value, tempIdMap) {
  if (typeof value === 'string' && tempIdMap[value]) {
    return tempIdMap[value];
  }
  return value;
}

function remapPayload(payload, tempIdMap) {
  if (!payload) return payload;
  const next = structuredClone(payload);
  if (next.account) next.account = remapValue(next.account, tempIdMap);
  if (next.toAccount) next.toAccount = remapValue(next.toAccount, tempIdMap);
  if (next.category) next.category = remapValue(next.category, tempIdMap);
  return next;
}

async function populateForStore(storeName, id) {
  if (storeName === 'transactions') {
    return modelMap[storeName]
      .findById(id)
      .populate('category', 'name icon type color')
      .populate('account', 'name icon')
      .populate('toAccount', 'name icon')
      .lean();
  }

  if (storeName === 'budgets') {
    return modelMap[storeName].findById(id).populate('category', 'name icon type color').lean();
  }

  return modelMap[storeName].findById(id).lean();
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const operations = Array.isArray(body.operations) ? body.operations : [];
    const tempIdMap = {};
    const applied = [];

    for (const operation of operations) {
      const storeName = operation.storeName;
      const Model = modelMap[storeName];
      if (!Model) continue;

      const payload = remapPayload(operation.payload, tempIdMap);

      if (operation.type === 'create') {
        const created = new Model(payload);
        await created.save();
        const serverId = created._id.toString();
        tempIdMap[operation.recordId] = serverId;
        const populated = await populateForStore(storeName, serverId);
        applied.push({
          queueId: operation.id,
          storeName,
          recordId: operation.recordId,
          serverId,
          record: serializers[storeName](populated),
        });
        continue;
      }

      if (operation.type === 'update') {
        const targetId = tempIdMap[operation.recordId] || operation.recordId;
        const updated = await Model.findByIdAndUpdate(
          targetId,
          { $set: payload, $inc: { syncVersion: 1 } },
          { new: true }
        );
        if (updated) {
          const populated = await populateForStore(storeName, updated._id);
          applied.push({
            queueId: operation.id,
            storeName,
            recordId: targetId,
            serverId: targetId,
            record: serializers[storeName](populated),
          });
        }
        continue;
      }

      if (operation.type === 'delete') {
        const targetId = tempIdMap[operation.recordId] || operation.recordId;
        await Model.findByIdAndUpdate(targetId, {
          $set: { deletedAt: new Date() },
          $inc: { syncVersion: 1 },
        });
        applied.push({
          queueId: operation.id,
          storeName,
          recordId: targetId,
          serverId: targetId,
          deleted: true,
        });
        continue;
      }

      if (operation.type === 'budget-upsert' && storeName === 'budgets') {
        const targetId = payload._id || payload.id;
        const filter =
          targetId && !String(targetId).startsWith('local_')
            ? { _id: targetId }
            : { category: payload.category, month: payload.month, year: payload.year };
        const updated = await Budget.findOneAndUpdate(
          filter,
          { $set: { ...payload, deletedAt: null }, $inc: { syncVersion: 1 } },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        const populated = await populateForStore(storeName, updated._id);
        applied.push({
          queueId: operation.id,
          storeName,
          recordId: operation.recordId,
          serverId: updated._id.toString(),
          record: serializers[storeName](populated),
        });
      }
    }

    return NextResponse.json({
      success: true,
      applied,
      idMap: tempIdMap,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Finance sync push failed:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to push finance changes' },
      { status: 500 }
    );
  }
}

import dbConnect from '@/lib/dbConnect';
import McpServerConfig from '@/models/McpServerConfig';

export function getDefaultMcpServerConfig(serverKey) {
  return {
    serverKey,
    isEnabled: true,
    disabledTools: [],
    allowedScopes: [],
    notes: '',
  };
}

export function normalizeMcpServerConfig(serverKey, config = null) {
  const defaults = getDefaultMcpServerConfig(serverKey);

  if (!config) {
    return defaults;
  }

  return {
    ...defaults,
    ...config,
    serverKey,
    isEnabled: config.isEnabled !== false,
    disabledTools: Array.isArray(config.disabledTools)
      ? [...new Set(config.disabledTools.map(String).filter(Boolean))]
      : [],
    allowedScopes: Array.isArray(config.allowedScopes)
      ? [...new Set(config.allowedScopes.map(String).filter(Boolean))]
      : [],
    notes: config.notes || '',
  };
}

export async function getMcpServerConfig(serverKey) {
  await dbConnect();
  const config = await McpServerConfig.findOne({ serverKey }).lean();
  return normalizeMcpServerConfig(serverKey, config);
}

export async function updateMcpServerConfig(serverKey, updates = {}) {
  await dbConnect();

  const normalizedUpdates = {};
  if (updates.isEnabled !== undefined) {
    normalizedUpdates.isEnabled = Boolean(updates.isEnabled);
  }
  if (updates.disabledTools !== undefined) {
    normalizedUpdates.disabledTools = [
      ...new Set((updates.disabledTools || []).map(String).filter(Boolean)),
    ];
  }
  if (updates.allowedScopes !== undefined) {
    normalizedUpdates.allowedScopes = [
      ...new Set((updates.allowedScopes || []).map(String).filter(Boolean)),
    ];
  }
  if (updates.notes !== undefined) {
    normalizedUpdates.notes = String(updates.notes || '');
  }

  const config = await McpServerConfig.findOneAndUpdate(
    { serverKey },
    {
      $set: normalizedUpdates,
      $setOnInsert: { serverKey },
    },
    { upsert: true, new: true }
  ).lean();

  return normalizeMcpServerConfig(serverKey, config);
}

export async function setMcpToolEnabled(serverKey, toolName, isEnabled) {
  const config = await getMcpServerConfig(serverKey);
  const disabledTools = new Set(config.disabledTools);

  if (isEnabled) {
    disabledTools.delete(toolName);
  } else {
    disabledTools.add(toolName);
  }

  return updateMcpServerConfig(serverKey, {
    disabledTools: [...disabledTools],
  });
}

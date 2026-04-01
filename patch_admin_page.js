const fs = require('fs');
const filePath = 'src/app/(admin)/admin/agents/page.js';
let content = fs.readFileSync(filePath, 'utf8');

// Add sms option
content = content.replace(
  '<option value="twilio">WhatsApp (Twilio)</option>',
  '<option value="twilio">WhatsApp (Twilio)</option>\n                        <option value="sms">SMS (Twilio)</option>'
);

// Add sms configuration UI
const smsUi = `
                  {editingIntegration.platform === 'sms' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-neutral-600">Account SID</label>
                        <input
                          className="w-full p-2 border rounded-lg mt-1"
                          value={editingIntegration.credentials?.accountSid || ''}
                          onChange={(e) =>
                            setEditingIntegration({
                              ...editingIntegration,
                              credentials: {
                                ...editingIntegration.credentials,
                                accountSid: e.target.value,
                              },
                            })
                          }
                          placeholder="AC..."
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-neutral-600">Auth Token</label>
                        <input
                          className="w-full p-2 border rounded-lg mt-1"
                          type="password"
                          value={editingIntegration.credentials?.authToken || ''}
                          onChange={(e) =>
                            setEditingIntegration({
                              ...editingIntegration,
                              credentials: {
                                ...editingIntegration.credentials,
                                authToken: e.target.value,
                              },
                            })
                          }
                          placeholder="xxxxxxxx..."
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-neutral-600">
                          Twilio SMS Number
                        </label>
                        <input
                          className="w-full p-2 border rounded-lg mt-1"
                          value={editingIntegration.credentials?.fromNumber || ''}
                          onChange={(e) =>
                            setEditingIntegration({
                              ...editingIntegration,
                              credentials: {
                                ...editingIntegration.credentials,
                                fromNumber: e.target.value,
                              },
                            })
                          }
                          placeholder="+14155238886"
                        />
                      </div>

                      <div className="pt-4 border-t border-neutral-100">
                        <label className="text-sm font-bold block mb-2">Selective Response</label>
                        <select
                          className="w-full p-2 border rounded-lg bg-white text-sm"
                          value={editingIntegration.credentials?.responseMode || 'all'}
                          onChange={(e) =>
                            setEditingIntegration({
                              ...editingIntegration,
                              credentials: {
                                ...editingIntegration.credentials,
                                responseMode: e.target.value,
                              },
                            })
                          }
                        >
                          <option value="all">Respond to Everyone</option>
                          <option value="whitelisted">Only Allowed Numbers</option>
                        </select>

                        {editingIntegration.credentials?.responseMode === 'whitelisted' && (
                          <div className="mt-3">
                            <label className="text-xs font-medium text-neutral-600">
                              Whitelisted Numbers (comma separated)
                            </label>
                            <textarea
                              className="w-full p-2 border rounded-lg mt-1 text-sm h-20"
                              value={editingIntegration.credentials?.allowedNumbers || ''}
                              onChange={(e) =>
                                setEditingIntegration({
                                  ...editingIntegration,
                                  credentials: {
                                    ...editingIntegration.credentials,
                                    allowedNumbers: e.target.value,
                                  },
                                })
                              }
                              placeholder="+19876543210, 11234567890"
                            />
                            <p className="text-[10px] text-neutral-400 mt-1">
                              Include country code (e.g., +1 or 1).
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
`;

content = content.replace(
  "{editingIntegration.platform === 'twilio' && (",
  `${smsUi}\n                  {editingIntegration.platform === 'twilio' && (`
);

fs.writeFileSync(filePath, content);

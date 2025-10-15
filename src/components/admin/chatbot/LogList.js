import LogEntry from './LogEntry';

export default function LogList({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-semibold text-neutral-800">No Logs Found</h3>
        <p className="text-neutral-500 mt-2">
          There are no chat logs matching your current filters.
        </p>
      </div>
    );
  }

  // Debug: Check if conversationContext exists in logs
  console.log(`[LogList] 📋 Rendering ${logs.length} logs`);
  console.log(
    `[LogList] 🔍 First log has conversationContext: ${logs[0]?.conversationContext ? 'YES' : 'NO'}`
  );
  if (logs[0]?.conversationContext) {
    console.log(`[LogList] 📊 First log context messages: ${logs[0].conversationContext.length}`);
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <LogEntry key={log._id} log={log} />
      ))}
    </div>
  );
}

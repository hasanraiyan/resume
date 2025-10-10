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

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <LogEntry key={log._id} log={log} />
      ))}
    </div>
  );
}

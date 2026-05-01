import { Card } from '@/components/custom-ui';

export default function TopPathsTable({ journeys }) {
  if (!journeys || journeys.length === 0) return null;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 font-['Playfair_Display']">Top 10 User Journeys</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-neutral-600 uppercase bg-neutral-50">
            <tr>
              <th scope="col" className="px-6 py-3">
                #
              </th>
              <th scope="col" className="px-6 py-3">
                Path
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                Sessions
              </th>
            </tr>
          </thead>
          <tbody>
            {journeys.map((journey, index) => (
              <tr key={index} className="bg-white border-b hover:bg-neutral-50">
                <td className="px-6 py-4 font-medium text-neutral-500">{index + 1}</td>
                <td className="px-6 py-4 font-mono text-xs text-neutral-800 whitespace-nowrap">
                  {journey.path}
                </td>
                <td className="px-6 py-4 font-semibold text-right">{journey.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

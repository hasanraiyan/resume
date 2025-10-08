'use client';

import { Button } from '@/components/ui';

export default function ResultsManager({ results, setResults }) {
  const addResult = () => {
    setResults([...results, '']);
  };

  const removeResult = (index) => {
    setResults(results.filter((_, i) => i !== index));
  };

  const updateResult = (index, value) => {
    const newResults = [...results];
    newResults[index] = value;
    setResults(newResults);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {results.map((result, index) => (
          <div key={index} className="flex items-center space-x-2">
            <input
              type="text"
              value={result}
              onChange={(e) => updateResult(index, e.target.value)}
              placeholder={`Result #${index + 1}`}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
            />
            <button
              type="button"
              onClick={() => removeResult(index)}
              className="text-red-600 hover:text-red-800 p-2"
              title="Remove Result"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        ))}
        {results.length === 0 && (
          <p className="text-sm text-neutral-500 text-center py-4">No results added yet.</p>
        )}
      </div>
      <Button type="button" onClick={addResult} variant="secondary" size="small">
        <i className="fas fa-plus mr-2"></i> Add Result
      </Button>
    </div>
  );
}

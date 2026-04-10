import { useState } from 'react';

export default function MCQ({ id, prompt, options = [], onSubmit, validation, mode = 'single' }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [manualEntry, setManualEntry] = useState('');
  const [error, setError] = useState(null);

  const handleOptionClick = (optionValue) => {
    if (mode === 'single') {
      setSelectedOption(optionValue);
      if (optionValue !== 'manual') {
        onSubmit({ id, value: optionValue });
      }
    }
  };

  const handleManualSubmit = () => {
    if (validation) {
      if (validation === 'numeric' && isNaN(Number(manualEntry))) {
        setError('Please enter a valid number.');
        return;
      }
      // Add other validation logic as needed
    }

    if (!manualEntry.trim()) {
      setError('Please enter a value.');
      return;
    }

    setError(null);
    onSubmit({ id, value: manualEntry });
  };

  return (
    <div
      className="mcq-container bg-white/90 backdrop-blur-sm text-neutral-900 shadow-neutral-200/50 border border-neutral-200/50 rounded-tl-sm rounded-2xl shadow-sm p-4 w-full mt-3"
      role="group"
      aria-labelledby={`mcq-prompt-${id}`}
    >
      {prompt && (
        <p id={`mcq-prompt-${id}`} className="text-sm font-semibold mb-3">
          {prompt}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className="text-left px-3 py-2 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1f644e] focus:border-transparent"
            onClick={() => handleOptionClick(option.value)}
          >
            {option.label}
          </button>
        ))}

        <button
          type="button"
          className={`text-left px-3 py-2 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#1f644e] focus:border-transparent ${
            selectedOption === 'manual'
              ? 'border-[#1f644e] bg-[#f0f5f2]'
              : 'border-neutral-200 hover:bg-neutral-50'
          }`}
          onClick={() => handleOptionClick('manual')}
        >
          Manual entry
        </button>

        {selectedOption === 'manual' && (
          <div className="mt-2 flex flex-col gap-2 animate-in slide-in-from-top-1">
            <input
              type={validation === 'numeric' ? 'number' : 'text'}
              className="px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f644e]"
              placeholder="Enter your choice..."
              value={manualEntry}
              onChange={(e) => {
                setManualEntry(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleManualSubmit();
              }}
              autoFocus
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="button"
              className="px-3 py-2 text-sm bg-[#1f644e] text-white rounded-lg hover:bg-[#17503e] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#1f644e]"
              onClick={handleManualSubmit}
            >
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

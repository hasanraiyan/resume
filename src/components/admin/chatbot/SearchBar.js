'use client';

import { useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import debounce from 'lodash.debounce';

export default function SearchBar({
  onSearch,
  initialQuery = '',
  placeholder = 'Search by keyword, session ID...',
}) {
  const [searchTerm, setSearchTerm] = useState(initialQuery);

  // Debounce the search function to avoid excessive API calls
  const debouncedSearch = useCallback(debounce(onSearch, 400), [onSearch]);

  const handleChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    debouncedSearch(newSearchTerm);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
      <input
        type="text"
        value={searchTerm}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full p-3 pl-10 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-shadow"
      />
    </div>
  );
}

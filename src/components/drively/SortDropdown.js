'use client';

import { ArrowUpDown, ChevronDown } from 'lucide-react';
import { useDrively } from '@/context/DrivelyContext';
import { useState, useRef, useEffect } from 'react';

export default function SortDropdown() {
  const { sortConfig, setSortConfig } = useDrively();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = [
    { label: 'Name (A-Z)', key: 'name', direction: 'asc' },
    { label: 'Name (Z-A)', key: 'name', direction: 'desc' },
    { label: 'Date modified', key: 'updatedAt', direction: 'desc' },
    { label: 'Date created', key: 'createdAt', direction: 'desc' },
    { label: 'Size', key: 'size', direction: 'desc' },
  ];

  const currentOption = options.find(
    (opt) => opt.key === (sortConfig.key === 'filename' ? 'name' : sortConfig.key) && opt.direction === sortConfig.direction
  ) || options[2];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-[#e5e3d8] rounded-xl text-xs font-bold text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors"
      >
        <ArrowUpDown className="w-3.5 h-3.5 text-[#7c8e88]" />
        <span>{currentOption.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#7c8e88] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-[#e5e3d8] rounded-xl shadow-xl z-50 overflow-hidden py-1">
          {options.map((option) => (
            <button
              key={`${option.key}-${option.direction}`}
              onClick={() => {
                setSortConfig({ key: option.key, direction: option.direction });
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${
                currentOption.key === option.key && currentOption.direction === option.direction
                  ? 'bg-[#f0f5f2] text-[#1f644e]'
                  : 'text-[#1e3a34] hover:bg-[#fcfbf5]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

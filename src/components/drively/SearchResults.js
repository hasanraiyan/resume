'use client';

import { useDrively } from '@/context/DrivelyContext';
import { Search as SearchIcon, X } from 'lucide-react';
import FileCard from './FileCard';
import FolderCard from './FolderCard';

export default function SearchResults({ results, query, onClear }) {
  const { isLoading } = useDrively();

  const hasResults = results.files.length > 0 || results.folders.length > 0;

  if (isLoading && !hasResults) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-64 bg-[#e5e3d8] rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-square bg-[#e5e3d8] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1e3a34]">Search Results</h2>
          <p className="text-sm text-[#7c8e88]">
            Found {results.folders.length + results.files.length} items for "{query}"
          </p>
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-2 px-4 py-2 bg-[#e5e3d8] hover:bg-[#d8d6cc] rounded-xl text-sm font-bold transition-colors"
        >
          <X className="w-4 h-4" />
          Clear Search
        </button>
      </div>

      {!hasResults ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 bg-[#f0f5f2] rounded-full flex items-center justify-center mb-6 text-[#7c8e88]">
            <SearchIcon className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-bold text-[#1e3a34]">No results found</h3>
          <p className="text-[#7c8e88] max-w-xs mt-2">
            We couldn't find any files or folders matching your search.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {results.folders.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-4">
                Folders
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {results.folders.map((folder) => (
                  <FolderCard key={folder._id} folder={folder} viewMode="grid" />
                ))}
              </div>
            </section>
          )}

          {results.files.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-4">
                Files
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {results.files.map((file) => (
                  <FileCard key={file._id} file={file} viewMode="grid" />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useDrively } from '@/context/DrivelyContext';
import { Search as SearchIcon, X, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';
import FileCard from './FileCard';
import FolderCard from './FolderCard';

export default function SearchResults({ results, query, onClear }) {
  const { isLoading, folders } = useDrively();
  const [filter, setFilter] = useState('All');

  const getMimeTypeCategory = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'Images';
    if (mimeType.startsWith('video/')) return 'Videos';
    if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('text') ||
      mimeType.includes('msword') ||
      mimeType.includes('officedocument')
    )
      return 'Documents';
    return 'Other';
  };

  const filteredFiles = useMemo(() => {
    if (filter === 'All') return results.files;
    return results.files.filter((file) => getMimeTypeCategory(file.mimeType) === filter);
  }, [results.files, filter]);

  const filteredFolders = useMemo(() => {
    // Folders are only shown when filter is 'All'
    return filter === 'All' ? results.folders : [];
  }, [results.folders, filter]);

  const hasResults = filteredFiles.length > 0 || filteredFolders.length > 0;
  const totalFound = results.files.length + results.folders.length;

  const categories = ['All', 'Images', 'Documents', 'Videos', 'Other'];

  const getFolderPath = (folderId) => {
    if (!folderId) return 'Root';
    const folder = folders.find((f) => f._id === folderId);
    if (!folder) return 'Unknown';

    const pathParts = [];
    if (folder.path) {
      folder.path
        .split('/')
        .filter(Boolean)
        .forEach((id) => {
          const pFolder = folders.find((f) => f._id === id);
          if (pFolder) pathParts.push(pFolder.name);
        });
    }
    pathParts.push(folder.name);
    return pathParts.join(' / ');
  };

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
            Found {totalFound} items for "{query}"
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

    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <div className="flex-shrink-0 flex items-center gap-2 text-[#7c8e88] mr-2">
        <Filter className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
      </div>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setFilter(cat)}
          className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
            filter === cat
              ? 'bg-[#1f644e] text-white shadow-sm'
              : 'bg-white border border-[#e5e3d8] text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e]'
          }`}
        >
          {cat}
        </button>
      ))}
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
          {filteredFolders.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-4">
                Folders
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredFolders.map((folder) => (
                  <div key={folder._id} className="space-y-2">
                    <FolderCard folder={folder} viewMode="grid" />
                    <p className="text-[10px] text-[#7c8e88] px-2 truncate">
                      {getFolderPath(folder.parentId)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {filteredFiles.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-4">
                Files
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredFiles.map((file) => (
                  <div key={file._id} className="space-y-2">
                    <FileCard file={file} viewMode="grid" />
                    <p className="text-[10px] text-[#7c8e88] px-2 truncate">
                      {getFolderPath(file.folderId)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

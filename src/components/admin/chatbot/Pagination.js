'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) {
        return null;
    }

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    // Determine the range of pages to display
    const pages = [];
    const range = 2; // Number of pages to show around the current page
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - range && i <= currentPage + range)) {
            pages.push(i);
        }
    }

    // Add ellipsis where there are gaps
    const pagesWithEllipsis = [];
    let lastPage = 0;
    for (const page of pages) {
        if (lastPage !== 0 && page > lastPage + 1) {
            pagesWithEllipsis.push('...');
        }
        pagesWithEllipsis.push(page);
        lastPage = page;
    }

    return (
        <nav className="flex items-center justify-center space-x-2 mt-8" aria-label="Pagination">
            <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="flex items-center px-3 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ChevronLeft size={16} className="mr-1" />
                Previous
            </button>

            <div className="hidden md:flex items-center space-x-2">
                {pagesWithEllipsis.map((page, index) =>
                    page === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-4 py-2 text-sm text-neutral-500">
                            ...
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg ${
                                currentPage === page
                                    ? 'bg-black text-white'
                                    : 'text-neutral-600 bg-white border border-neutral-300 hover:bg-neutral-100'
                            }`}
                        >
                            {page}
                        </button>
                    )
                )}
            </div>

            <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="flex items-center px-3 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Next
                <ChevronRight size={16} className="ml-1" />
            </button>
        </nav>
    );
}
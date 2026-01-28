'use client';

import React from 'react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems = 0,
  itemsPerPage = 10,
  itemLabel = 'items',
  showInfo = true 
}) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Always show pagination if there are items, even if only one page
  if (totalItems === 0) return null;

  const isPreviousDisabled = currentPage <= 1 || totalPages <= 1;
  const isNextDisabled = currentPage >= totalPages || totalPages <= 1;

  return (
    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => !isPreviousDisabled && onPageChange(Math.max(1, currentPage - 1))}
          disabled={isPreviousDisabled}
          className={`px-4 py-2 rounded border transition ${
            isPreviousDisabled
              ? "text-gray-400 cursor-not-allowed border-gray-600 bg-gray-800"
              : "text-white hover:bg-gray-700 border-gray-600 bg-gray-800 cursor-pointer"
          }`}
        >
          Previous
        </button>
        <button
          onClick={() => !isNextDisabled && onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={isNextDisabled}
          className={`px-4 py-2 rounded border transition ${
            isNextDisabled
              ? "text-gray-400 cursor-not-allowed border-gray-600 bg-gray-800"
              : "text-white hover:bg-gray-700 border-gray-600 bg-gray-800 cursor-pointer"
          }`}
        >
          Next
        </button>
      </div>
      {showInfo && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center gap-2 text-sm text-gray-400">
          <span>
            Showing {startIndex + 1} to {endIndex} of {totalItems} {itemLabel}
          </span>
          <span className="hidden sm:inline">•</span>
          <span>
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}
    </div>
  );
};

export default Pagination;

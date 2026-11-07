import React from 'react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }
  return (
    <div className="flex justify-center space-x-2 mt-4">
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 rounded ${page === currentPage ? 'bg-primary text-white' : 'bg-gray-200'} `}
        >
          {page}
        </button>
      ))}
    </div>
  );
}


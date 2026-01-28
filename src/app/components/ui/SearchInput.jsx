'use client';

import React from 'react';
import { FiSearch } from 'react-icons/fi';

const SearchInput = ({ 
  value, 
  onChange, 
  placeholder = "Search...", 
  className = "",
  showIcon = true 
}) => {
  return (
    <div className={`relative ${className}`}>
      {showIcon && (
        <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
      )}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`${showIcon ? 'pl-10' : 'pl-3'} pr-3 py-2 rounded-md bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      />
    </div>
  );
};

export default SearchInput;

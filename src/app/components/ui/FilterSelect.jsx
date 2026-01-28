'use client';

import React from 'react';

const FilterSelect = ({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "All",
  className = "" 
}) => {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`bg-gray-800 text-white border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      <option value="">All {placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default FilterSelect;

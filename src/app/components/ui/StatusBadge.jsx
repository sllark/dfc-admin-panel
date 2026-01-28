'use client';

import React from 'react';

const StatusBadge = ({ status, className = "" }) => {
  const getStatusStyles = (status) => {
    const statusUpper = String(status).toUpperCase();
    
    if (statusUpper === 'COMPLETED' || statusUpper === 'CONFIRMED' || statusUpper === 'ACTIVE' || statusUpper === 'PAID') {
      return 'bg-green-600 text-green-100';
    }
    if (statusUpper === 'FAILED' || statusUpper === 'REJECTED' || statusUpper === 'INACTIVE') {
      return 'bg-red-600 text-red-100';
    }
    if (statusUpper === 'PENDING' || statusUpper === 'RESUBMITTED') {
      return 'bg-yellow-600 text-yellow-100';
    }
    return 'bg-gray-600 text-gray-200';
  };

  return (
    <span
      className={`px-2 py-1 rounded text-xs ${getStatusStyles(status)} ${className}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;

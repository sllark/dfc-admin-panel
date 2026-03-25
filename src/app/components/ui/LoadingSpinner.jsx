'use client';

import React from 'react';

import CircularProgressIndicator from './CircularProgressIndicator';

const LoadingSpinner = ({
  message = "Loading...",
  className = "",
  size = 22,
  showMessage = true,
  spinnerColor = "#38bdf8",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-10 ${className}`}>
      <CircularProgressIndicator size={size} color={spinnerColor} />
      {showMessage && message ? <p className="text-gray-400">{message}</p> : null}
    </div>
  );
};

export default LoadingSpinner;

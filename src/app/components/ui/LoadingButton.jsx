"use client";

import React from "react";
import CircularProgressIndicator from "./CircularProgressIndicator";

/**
 * Button loader: shows only a centered circular spinner while preserving button styling.
 */
export default function LoadingButton({
  loading = false,
  spinnerColor = "#38bdf8",
  spinnerSize = 18,
  spinnerThickness = 2,
  disabled = false,
  className = "",
  loadingAriaLabel = "Loading",
  children,
  ...buttonProps
}) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <button
      {...buttonProps}
      disabled={isDisabled}
      aria-busy={loading}
      className={`relative ${className}`}
    >
      <span className={loading ? "opacity-0" : "opacity-100 transition-opacity"}>
        {children}
      </span>

      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <CircularProgressIndicator
            aria-label={loadingAriaLabel}
            size={spinnerSize}
            thickness={spinnerThickness}
            color={spinnerColor}
          />
        </span>
      )}
    </button>
  );
}


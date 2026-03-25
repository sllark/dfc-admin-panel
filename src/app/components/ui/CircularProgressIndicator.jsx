/* eslint-disable react/prop-types */
"use client";

import React from "react";

/**
 * Minimal circular progress indicator (no extra background).
 */
export default function CircularProgressIndicator({
  size = 20,
  thickness = 2,
  color = "#38bdf8", // cyan-400
  trackColor = "rgba(56, 189, 248, 0.18)",
  className = "",
  "aria-label": ariaLabel = "Loading",
}) {
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={`animate-spin rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        border: `${thickness}px solid ${trackColor}`,
        borderTopColor: color,
      }}
    />
  );
}


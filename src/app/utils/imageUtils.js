/**
 * Get the full URL for an image path
 * Handles both local storage images and server paths
 * @param {string} path - Image path
 * @param {object} options - Options for image URL generation
 * @returns {string} Full image URL
 */
export const getImageUrl = (path, options = {}) => {
  if (!path) return options.default || "/default-avatar.png";

  // Check localStorage for uploaded images first (if in browser)
  if (typeof window !== "undefined" && options.checkLocalStorage !== false) {
    const uploads = localStorage.getItem("uploads");
    if (uploads) {
      try {
        const uploadsData = JSON.parse(uploads);
        // Check if path exists as a key in localStorage
        if (uploadsData[path]) {
          return uploadsData[path];
        }
        // Also check all keys to find matching image
        const keys = Object.keys(uploadsData);
        for (const key of keys) {
          if (key.includes(path) || path.includes(key)) {
            return uploadsData[key];
          }
        }
      } catch (e) {
        console.error("Error parsing localStorage uploads:", e);
      }
    }
  }

  // Fallback to server path
  if (path?.startsWith("/uploads")) {
    return `${process.env.NEXT_PUBLIC_BASE_URL || ""}${path}`;
  }

  // If it's already a full URL, return as is
  if (path?.startsWith("http://") || path?.startsWith("https://")) {
    return path;
  }

  return path || options.default || "/default-avatar.png";
};

/**
 * Get image URL from file object (for preview)
 * @param {File} file - File object
 * @returns {string} Object URL for the file
 */
export const getImageUrlFromFile = (file) => {
  if (!file) return null;
  return URL.createObjectURL(file);
};

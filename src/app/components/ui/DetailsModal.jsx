'use client';

import React, { useEffect, useMemo } from 'react';
import { FiX } from 'react-icons/fi';

const DetailsModal = ({ isOpen, onClose, title, data, fields }) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Sort fields to show images first
  const sortedFields = useMemo(() => {
    if (!fields) return [];
    const imageFields = fields.filter(field => field.component && field.key?.toLowerCase().includes('image'));
    const otherFields = fields.filter(field => !(field.component && field.key?.toLowerCase().includes('image')));
    return [...imageFields, ...otherFields];
  }, [fields]);

  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 text-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] border border-gray-700 shadow-xl flex flex-col">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-semibold text-cyan-300">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-1"
            title="Close"
          >
            <FiX size={24} />
          </button>
        </div>

        <div 
          className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto flex-1 pr-2 hide-scrollbar" 
          style={{ 
            maxHeight: 'calc(90vh - 180px)',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {sortedFields.map((field) => {
            const value = field.value || data[field.key];
            const displayValue = field.format ? field.format(value, data) : (value ?? '—');
            const isImageField = field.component && field.key?.toLowerCase().includes('image');

            return (
              <div 
                key={field.key} 
                className={isImageField ? "md:col-span-2 flex justify-center mb-4" : "border-b border-gray-700 pb-3"}
              >
                {isImageField ? (
                  <div className="w-full flex flex-col items-center">
                    <div className="text-sm text-gray-400 mb-2">{field.label}</div>
                    <div className="text-white break-words flex justify-center">
                      {field.component ? (
                        <div className="[&>img]:rounded-full [&>img]:object-cover">
                          {field.component(value, data)}
                        </div>
                      ) : displayValue}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-gray-400 mb-1">{field.label}</div>
                    <div className="text-white break-words">
                      {field.component ? field.component(value, data) : displayValue}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailsModal;

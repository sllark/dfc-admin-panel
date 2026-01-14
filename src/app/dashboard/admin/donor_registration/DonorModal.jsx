// app/(your-path)/DonorModal.jsx
"use client";

import DonorForm from "./DonorForm";

export default function DonorModal({ isOpen, onClose, donor, onSaved }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {donor ? "Edit Donor" : "Add New Donor"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 dark:hover:text-white text-xl font-bold"
          >
            ×
          </button>
        </div>

        <DonorForm
          initialData={donor}
          onSuccess={() => {
            onSaved?.();
            onClose();
          }}
        />
      </div>
    </div>
  );
}

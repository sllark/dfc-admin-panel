"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/app/lib/authGuard";
import Layout from "@/app/components/common/layout";

export default function AppointmentLookupPage() {
  const router = useRouter();
  const [confirmationNumber, setConfirmationNumber] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = confirmationNumber.trim();
    if (!trimmed) return;
    router.push(`/dashboard/admin/appointments/${encodeURIComponent(trimmed)}`);
  };

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold text-white">
            Appointment Lookup
          </h1>
          <p className="text-sm text-gray-400">
            Enter a Labcorp confirmation number to view full appointment
            details and cancel on behalf of a patient if needed.
          </p>

          <form
            onSubmit={handleSubmit}
            className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3"
          >
            <label className="block text-xs font-semibold text-gray-300">
              Confirmation Number
            </label>
            <input
              type="text"
              value={confirmationNumber}
              onChange={(e) => setConfirmationNumber(e.target.value)}
              className="w-full rounded-md bg-gray-950 border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="e.g. LBG-12345678"
            />
            <button
              type="submit"
              className="mt-2 inline-flex justify-center items-center rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-cyan-400"
            >
              Look up appointment
            </button>
          </form>
        </div>
      </Layout>
    </AuthGuard>
  );
}


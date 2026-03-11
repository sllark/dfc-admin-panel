"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/app/lib/authGuard";
import Layout from "@/app/components/common/layout";
import axios from "@/app/lib/axios";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/admin/subscriptions");
      setSubscriptions(res.data.items || res.data || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to load Labcorp webhook subscriptions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const handleDelete = async (id) => {
    if (!id) return;
    const confirm = window.confirm(
      "Stop receiving webhook updates for this subscription?"
    );
    if (!confirm) return;

    try {
      setDeletingId(id);
      await axios.delete(`/api/admin/subscriptions/${encodeURIComponent(id)}`);
      await loadSubscriptions();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to delete subscription. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold text-white">
            Labcorp Subscriptions
          </h1>
          <p className="text-sm text-gray-400">
            View and manage webhook subscriptions created for Labcorp
            appointments.
          </p>

          {loading && <LoadingSpinner message="Loading subscriptions…" />}

          {error && (
            <div className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">
              <p className="font-medium text-red-300">Error</p>
              <p className="text-red-200 mt-1">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto rounded-lg border border-gray-800 bg-gray-900">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 font-semibold text-gray-300">
                      Subscription ID
                    </th>
                    <th className="px-3 py-2 font-semibold text-gray-300">
                      Appointment ID
                    </th>
                    <th className="px-3 py-2 font-semibold text-gray-300">
                      Created
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-4 text-center text-gray-400"
                      >
                        No subscriptions found.
                      </td>
                    </tr>
                  )}
                  {subscriptions.map((sub) => {
                    const id =
                      sub.id || sub.subscriptionId || sub.subscription_id;
                    const appointmentId =
                      sub.appointmentId ||
                      sub.appointment_id ||
                      sub.confirmationNumber;
                    const created =
                      sub.createdAt || sub.created_at || sub.created;

                    return (
                      <tr
                        key={id}
                        className="border-t border-gray-800 hover:bg-gray-800/70"
                      >
                        <td className="px-3 py-2 text-gray-200">{id}</td>
                        <td className="px-3 py-2 text-gray-300">
                          {appointmentId || "-"}
                        </td>
                        <td className="px-3 py-2 text-gray-300">
                          {created
                            ? new Date(created).toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => handleDelete(id)}
                            disabled={deletingId === id}
                            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingId === id ? "Deleting…" : "Delete"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
}


"use client";

import { useEffect, useState } from "react";
import axios from "@/app/lib/axios";
import AuthGuard from "@/app/lib/authGuard";
import Layout from "@/app/components/common/layout";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

export default function AdminHealthPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchHealth() {
      try {
        const res = await axios.get("/api/admin/health");
        if (!cancelled) {
          setStatus(res.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              "Failed to load Labcorp health status."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold mb-2">Labcorp API Health</h1>

          {loading && <LoadingSpinner message="Checking Labcorp API status…" />}

          {error && (
            <div className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">
              <p className="font-medium text-red-300">Error</p>
              <p className="text-red-200 mt-1">{error}</p>
            </div>
          )}

          {!loading && !error && status && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-300 font-semibold">
                    Labcorp API Status
                  </p>
                  <p className="mt-1 text-lg font-medium text-emerald-100">
                    ● ONLINE {status.version ? `v${status.version}` : ""}
                  </p>
                </div>
                <p className="text-sm text-emerald-200">
                  {status.message || "healthy"}
                </p>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
}


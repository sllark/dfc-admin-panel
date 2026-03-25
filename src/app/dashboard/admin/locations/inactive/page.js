"use client";

import { useEffect, useState } from "react";
import axios from "@/app/lib/axios";
import Link from "next/link";
import AuthGuard from "@/app/lib/authGuard";
import Layout from "@/app/components/common/layout";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import { ensureMinDuration } from "@/app/lib/loadingUtils";

export default function InactiveLocationsPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noOfDays, setNoOfDays] = useState(7);

  useEffect(() => {
    let cancelled = false;

    async function fetchInactive() {
      const startedAt = Date.now();
      try {
        const res = await axios.get("/api/admin/locations/inactive", {
          params: { noOfDays },
        });
        if (!cancelled) {
          setLocations(res.data.items || res.data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              "Failed to load inactive locations from Labcorp."
          );
        }
      } finally {
        if (!cancelled) {
          await ensureMinDuration(startedAt, 600);
          setLoading(false);
        }
      }
    }

    fetchInactive();

    return () => {
      cancelled = true;
    };
  }, [noOfDays]);

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Inactive Locations
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Locations deactivated in the last {noOfDays} day
                {noOfDays === 1 ? "" : "s"}.
              </p>
            </div>
            <Link
              href="/dashboard/admin/locations"
              className="text-sm text-cyan-300 hover:underline"
            >
              Back to all locations
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-gray-300">
              Look back (days)
            </label>
            <input
              type="number"
              min={1}
              max={90}
              value={noOfDays}
              onChange={(e) => setNoOfDays(Number(e.target.value) || 1)}
              className="w-24 rounded-md bg-gray-950 border border-gray-700 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {loading && (
            <LoadingSpinner message="Loading inactive locations…" />
          )}

          {error && (
            <div className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">
              <p className="font-medium text-red-300">Error</p>
              <p className="text-red-200 mt-1">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto rounded-lg border border-gray-800 bg-gray-900">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-300">
                      ID
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-300">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-300">
                      City
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-300">
                      State
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-300">
                      Deactivated Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {locations.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-4 text-center text-gray-400"
                      >
                        No inactive locations found in this window.
                      </td>
                    </tr>
                  )}
                  {locations.map((loc) => (
                    <tr
                      key={loc.id}
                      className="border-t border-gray-800 hover:bg-gray-800/70"
                    >
                      <td className="px-3 py-2 text-gray-200">{loc.id}</td>
                      <td className="px-3 py-2 text-gray-100">{loc.name}</td>
                      <td className="px-3 py-2 text-gray-300">
                        {loc.address?.city}
                      </td>
                      <td className="px-3 py-2 text-gray-300">
                        {loc.address?.state}
                      </td>
                      <td className="px-3 py-2 text-gray-300">
                        {loc.deactivatedDate
                          ? new Date(loc.deactivatedDate).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
}


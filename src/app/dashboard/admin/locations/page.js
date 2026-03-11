"use client";

import { useEffect, useState } from "react";
import axios from "@/app/lib/axios";
import Link from "next/link";
import AuthGuard from "@/app/lib/authGuard";
import Layout from "@/app/components/common/layout";

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState({
    address: "",
    radius: "25",
    serviceId: "",
  });

  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchInitial() {
      try {
        const res = await axios.get("/api/admin/locations", {
          params: { page: 1, pageSize: 25 },
        });
        if (!cancelled) {
          setLocations(res.data.items || res.data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              "Failed to load locations from Labcorp."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchInitial();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    setError(null);

    try {
      const res = await axios.get("/api/admin/locations/search", {
        params: {
          address: search.address,
          radius: search.radius,
          serviceId: search.serviceId || undefined,
        },
      });
      setLocations(res.data.items || res.data || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to search locations. Please adjust your filters."
      );
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-white">Locations</h1>
            <Link
              href="/dashboard/admin/locations/inactive"
              className="text-sm text-cyan-300 hover:underline"
            >
              View inactive locations
            </Link>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end bg-gray-900 border border-gray-800 rounded-lg p-4"
          >
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Address
              </label>
              <input
                type="text"
                className="w-full rounded-md bg-gray-950 border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={search.address}
                onChange={(e) =>
                  setSearch((s) => ({ ...s, address: e.target.value }))
                }
                placeholder="City, state or full address"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Radius (miles)
              </label>
              <input
                type="number"
                className="w-full rounded-md bg-gray-950 border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={search.radius}
                onChange={(e) =>
                  setSearch((s) => ({ ...s, radius: e.target.value }))
                }
                min="1"
                max="200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Service ID (optional)
              </label>
              <input
                type="number"
                className="w-full rounded-md bg-gray-950 border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={search.serviceId}
                onChange={(e) =>
                  setSearch((s) => ({ ...s, serviceId: e.target.value }))
                }
                placeholder="e.g. 5 for Labwork"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={isSearching}
                className="w-full inline-flex justify-center items-center rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? "Searching…" : "Search"}
              </button>
            </div>
          </form>

          {loading && <p className="text-gray-300">Loading locations…</p>}

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
                      ID
                    </th>
                    <th className="px-3 py-2 font-semibold text-gray-300">
                      Name
                    </th>
                    <th className="px-3 py-2 font-semibold text-gray-300">
                      City
                    </th>
                    <th className="px-3 py-2 font-semibold text-gray-300">
                      State
                    </th>
                    <th className="px-3 py-2 font-semibold text-gray-300">
                      Services
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {locations.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-4 text-center text-gray-400"
                      >
                        No locations found.
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
                        {Array.isArray(loc.services)
                          ? loc.services.map((s) => s.serviceId).join(", ")
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Link
                          href={`/dashboard/admin/locations/${encodeURIComponent(
                            loc.id
                          )}`}
                          className="text-cyan-300 hover:underline text-xs"
                        >
                          View details
                        </Link>
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


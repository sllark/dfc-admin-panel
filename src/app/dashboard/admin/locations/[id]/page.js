"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "@/app/lib/axios";
import Link from "next/link";
import AuthGuard from "@/app/lib/authGuard";
import Layout from "@/app/components/common/layout";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

export default function LocationDetailPage() {
  const params = useParams();
  const id = params?.id;

  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function fetchLocation() {
      try {
        const res = await axios.get(`/api/admin/locations/${id}`);
        if (!cancelled) {
          setLocation(res.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              "Failed to load location details from Labcorp."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchLocation();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-white">
              Location Details
            </h1>
            <Link
              href="/dashboard/admin/locations"
              className="text-sm text-cyan-300 hover:underline"
            >
              Back to locations
            </Link>
          </div>

          {loading && <LoadingSpinner message="Loading location…" />}

          {error && (
            <div className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">
              <p className="font-medium text-red-300">Error</p>
              <p className="text-red-200 mt-1">{error}</p>
            </div>
          )}

          {!loading && !error && location && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
                <h2 className="text-lg font-semibold text-gray-100">
                  {location.name} (ID: {location.id})
                </h2>
                <p className="mt-2 text-sm text-gray-300">
                  {location.address?.line1}
                  {location.address?.line2 ? `, ${location.address.line2}` : ""}
                  {", "}
                  {location.address?.city}, {location.address?.state}{" "}
                  {location.address?.postalCode}
                </p>
                {location.phone && (
                  <p className="mt-1 text-sm text-gray-300">
                    Phone: {location.phone}
                  </p>
                )}
                {location.timezone && (
                  <p className="mt-1 text-sm text-gray-300">
                    Timezone: {location.timezone}
                  </p>
                )}
              </div>

              {Array.isArray(location.services) &&
                location.services.length > 0 && (
                  <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
                    <h3 className="text-md font-semibold text-gray-100 mb-2">
                      Services
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead className="bg-gray-950/80">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-300">
                              Service ID
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-300">
                              Name
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-300">
                              Days/Hours
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {location.services.map((svc, idx) => (
                            <tr
                              key={idx}
                              className="border-t border-gray-800 hover:bg-gray-950/60"
                            >
                              <td className="px-3 py-2 text-gray-200">
                                {svc.serviceId}
                              </td>
                              <td className="px-3 py-2 text-gray-100">
                                {svc.serviceName || "-"}
                              </td>
                              <td className="px-3 py-2 text-gray-300">
                                {svc.hoursDescription || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
}


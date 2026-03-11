"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/app/lib/authGuard";
import Layout from "@/app/components/common/layout";
import axios from "@/app/lib/axios";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

export default function LabcorpServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchServices() {
      try {
        const res = await axios.get("/api/admin/services");
        if (!cancelled) {
          setServices(res.data.items || res.data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              "Failed to load Labcorp services reference."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchServices();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold text-white">
            Labcorp Services Reference
          </h1>
          <p className="text-sm text-gray-400">
            Read-only list of Labcorp scheduling service IDs and names, used
            across the system when configuring panels and appointments.
          </p>

          {loading && <LoadingSpinner message="Loading Labcorp services…" />}

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
                      Service ID
                    </th>
                    <th className="px-3 py-2 font-semibold text-gray-300">
                      Name
                    </th>
                    <th className="px-3 py-2 font-semibold text-gray-300">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {services.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-4 text-center text-gray-400"
                      >
                        No services found.
                      </td>
                    </tr>
                  )}
                  {services.map((svc) => (
                    <tr
                      key={svc.id || svc.serviceId}
                      className="border-t border-gray-800 hover:bg-gray-800/70"
                    >
                      <td className="px-3 py-2 text-gray-200">
                        {svc.id ?? svc.serviceId}
                      </td>
                      <td className="px-3 py-2 text-gray-100">
                        {svc.name || svc.serviceName}
                      </td>
                      <td className="px-3 py-2 text-gray-300">
                        {svc.description || "-"}
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


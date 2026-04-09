"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Layout from "@/app/components/common/layout";
import AuthGuard from "@/app/lib/authGuard";
import axios from "@/app/lib/axios";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import Pagination from "@/app/components/ui/Pagination";
import StatusBadge from "@/app/components/ui/StatusBadge";
import { formatDate } from "@/app/utils/dateUtils";
import { handleApiError } from "@/app/lib/apiError";
import { ensureMinDuration } from "@/app/lib/loadingUtils";
import { extractReportsList, extractReportsMeta } from "@/app/lib/veriportReports";

const PAGE_SIZE = 10;

const ReportStatusBadge = ({ value }) => {
  if (value === null || value === undefined || value === "") {
    return <span className="text-gray-400 text-xs">N/A</span>;
  }
  return <StatusBadge status={value} />;
};

const ReportBoolBadge = ({ value }) => {
  return <StatusBadge status={value ? "AVAILABLE" : "UNAVAILABLE"} />;
};

const AdminReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    const startedAt = Date.now();
    setLoading(true);
    try {
      console.info("[AdminReports] GET /veriport/reports", {
        page,
        perPage: PAGE_SIZE,
      });
      const res = await axios.get("/veriport/reports", {
        params: { page, perPage: PAGE_SIZE },
        skipGlobalErrorToast: true,
      });
      const list = extractReportsList(res.data);
      const meta = extractReportsMeta(res.data);

      console.info("[AdminReports] /veriport/reports response parsed", {
        rawKeys: Object.keys(res.data || {}),
        listCount: list.length,
        totalPages: meta.totalPages,
        totalItems: meta.totalItems,
        sample: list[0] || null,
      });

      setReports(list);
      setTotalPages(meta.totalPages || 1);
      setTotalItems(meta.totalItems || list.length);
    } catch (error) {
      console.error("[AdminReports] Failed to load list", {
        endpoint: "/veriport/reports",
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
        responseData: error?.response?.data || null,
      });
      handleApiError(error, {
        defaultMessage: "Failed to load reports. Please retry.",
      });
      setReports([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      await ensureMinDuration(startedAt, 600);
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const itemCount = useMemo(
    () => (totalItems > 0 ? totalItems : reports.length),
    [reports.length, totalItems]
  );

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Veriport Reports</h1>
            <p className="mt-1 text-gray-400">
              Monitor report revisions and PDF/email processing status.
            </p>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading reports..." />
          ) : (
            <>
              <div className="overflow-x-auto rounded shadow bg-gray-800 border border-gray-700">
                <table className="w-full border-collapse text-sm text-left text-gray-200 table-auto">
                  <thead className="bg-gray-700 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 border-b border-gray-600">Report ID</th>
                      <th className="px-4 py-3 border-b border-gray-600">Revision</th>
                      <th className="px-4 py-3 border-b border-gray-600">Received At</th>
                      <th className="px-4 py-3 border-b border-gray-600">Email Status</th>
                      <th className="px-4 py-3 border-b border-gray-600">PDF Status</th>
                      <th className="px-4 py-3 border-b border-gray-600">PDF Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-6 text-gray-400">
                          No reports found
                        </td>
                      </tr>
                    ) : (
                      reports.map((report) => (
                        <tr key={`${report.veriportReportId}-${report.reportRevisionNumber}`} className="border-b border-gray-700 hover:bg-gray-700/60">
                          <td className="px-4 py-3">
                            <Link
                              href={`/dashboard/admin/reports/${report.veriportReportId}?revision=${report.reportRevisionNumber ?? ""}`}
                              className="text-cyan-400 hover:text-cyan-300 underline"
                            >
                              {report.veriportReportId}
                            </Link>
                          </td>
                          <td className="px-4 py-3">{report.reportRevisionNumber ?? "—"}</td>
                          <td className="px-4 py-3">{formatDate(report.receivedAt)}</td>
                          <td className="px-4 py-3">
                            <ReportStatusBadge value={report.emailStatus} />
                          </td>
                          <td className="px-4 py-3">
                            <ReportStatusBadge value={report.pdfStatus} />
                          </td>
                          <td className="px-4 py-3">
                            <ReportBoolBadge value={Boolean(report.pdfAvailable)} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={itemCount}
                itemsPerPage={PAGE_SIZE}
                itemLabel="reports"
              />
            </>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default AdminReportsPage;

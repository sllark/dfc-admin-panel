"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Layout from "@/app/components/common/layout";
import AuthGuard from "@/app/lib/authGuard";
import axios from "@/app/lib/axios";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import StatusBadge from "@/app/components/ui/StatusBadge";
import LoadingButton from "@/app/components/ui/LoadingButton";
import { formatDate } from "@/app/utils/dateUtils";
import { handleApiError } from "@/app/lib/apiError";
import { ensureMinDuration } from "@/app/lib/loadingUtils";
import toast from "react-hot-toast";
import PrintableMroReport from "@/app/components/reports/PrintableMroReport";
import { extractReportDetail } from "@/app/lib/veriportReports";

const ReportStatusBadge = ({ value }) => {
  if (value === null || value === undefined || value === "") {
    return <span className="text-gray-400 text-xs">N/A</span>;
  }
  return <StatusBadge status={value} />;
};

const AdminReportDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const veriportReportId = params?.veriportReportId;
  const revisionParam = searchParams.get("revision");
  const revision = revisionParam ? String(revisionParam) : undefined;

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [resending, setResending] = useState(false);

  const queryParams = useMemo(
    () => (revision ? { revision } : undefined),
    [revision]
  );

  const fetchReport = useCallback(async () => {
    const startedAt = Date.now();
    setLoading(true);
    try {
      let res;
      let resolvedEndpoint = `/veriport/reports/${veriportReportId}`;
      try {
        // Admin API route
        console.info("[AdminReportDetail] Attempt endpoint", {
          endpoint: resolvedEndpoint,
          params: queryParams || {},
        });
        res = await axios.get(`/veriport/reports/${veriportReportId}`, {
          params: queryParams,
          skipGlobalErrorToast: true,
        });
      } catch (primaryError) {
        // Frontend-style endpoint fallback
        if (primaryError?.response?.status !== 404) {
          console.error("[AdminReportDetail] Primary endpoint failed", {
            endpoint: resolvedEndpoint,
            status: primaryError?.response?.status,
            message:
              primaryError?.response?.data?.message || primaryError?.message,
            responseData: primaryError?.response?.data || null,
          });
          throw primaryError;
        }
        resolvedEndpoint = `/veriport-reports/${veriportReportId}`;
        console.warn("[AdminReportDetail] Primary 404, trying fallback", {
          fallbackEndpoint: resolvedEndpoint,
          params: queryParams || {},
        });
        res = await axios.get(`/veriport-reports/${veriportReportId}`, {
          params: queryParams,
          skipGlobalErrorToast: true,
        });
      }

      const mapped = extractReportDetail(res.data);
      console.info("[AdminReportDetail] Endpoint response parsed", {
        endpoint: resolvedEndpoint,
        rawKeys: Object.keys(res.data || {}),
        mappedTopLevel: {
          veriportReportId: mapped?.veriportReportId,
          reportRevisionNumber: mapped?.reportRevisionNumber,
          receivedAt: mapped?.receivedAt,
          pdfStatus: mapped?.pdfStatus,
          emailStatus: mapped?.emailStatus,
          pdfAvailable: mapped?.pdfAvailable,
        },
        mappedNestedPresence: {
          hasMeta: Boolean(mapped?.meta),
          hasTimeline: Boolean(mapped?.reportTimeline),
          hasDonor: Boolean(mapped?.donor),
          hasLab: Boolean(mapped?.lab),
          hasMro: Boolean(mapped?.mro),
          hasCollectionSite: Boolean(mapped?.collectionSite),
          labPanelsCount: mapped?.results?.labPanels?.length || 0,
          firstPanelResultsCount:
            mapped?.results?.labPanels?.[0]?.results?.length || 0,
        },
        rawDataPreview: res.data?.data || res.data || null,
      });
      setReport(mapped);
    } catch (error) {
      console.error("[AdminReportDetail] Failed to load detail", {
        endpointsTried: [
          `/veriport/reports/${veriportReportId}`,
          `/veriport-reports/${veriportReportId}`,
        ],
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
        responseData: error?.response?.data || null,
      });
      handleApiError(error, {
        defaultMessage: "Failed to load report details. Please retry.",
      });
      setReport(null);
    } finally {
      await ensureMinDuration(startedAt, 600);
      setLoading(false);
    }
  }, [queryParams, veriportReportId]);

  useEffect(() => {
    if (!veriportReportId) return;
    fetchReport();
  }, [fetchReport, veriportReportId]);

  const isPdfOperationallyReady = Boolean(report?.pdfAvailable) && report?.pdfStatus === "UPLOADED";

  const handleDownloadPdf = async () => {
    if (!report) return;
    if (!isPdfOperationallyReady) {
      toast.error("PDF not available yet");
      return;
    }

    const startedAt = Date.now();
    setDownloading(true);
    try {
      console.info("[AdminReportDetail] GET PDF", {
        endpoint: `/veriport/reports/${veriportReportId}/pdf`,
        params: queryParams || {},
      });
      const res = await axios.get(`/veriport/reports/${veriportReportId}/pdf`, {
        params: queryParams,
        responseType: "blob",
        skipGlobalErrorToast: true,
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const fileRevision = report.reportRevisionNumber || revision || "latest";
      const fileName = `report-${veriportReportId}-rev-${fileRevision}.pdf`;

      const fileUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = fileUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(fileUrl);
    } catch (error) {
      console.error("[AdminReportDetail] Download PDF failed", {
        endpoint: `/veriport/reports/${veriportReportId}/pdf`,
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
      });
      handleApiError(error, {
        notFoundMessage: "PDF not available yet",
        defaultMessage: "Download failed. Please retry.",
      });
    } finally {
      await ensureMinDuration(startedAt, 300);
      setDownloading(false);
    }
  };

  const handleManualResend = async () => {
    if (!isPdfOperationallyReady) {
      toast.error("PDF not available yet");
      return;
    }

    const startedAt = Date.now();
    setResending(true);
    try {
      console.info("[AdminReportDetail] POST email-pdf", {
        endpoint: `/veriport/reports/${veriportReportId}/email-pdf`,
        params: queryParams || {},
      });
      await axios.post(
        `/veriport/reports/${veriportReportId}/email-pdf`,
        {},
        {
          params: queryParams,
          skipGlobalErrorToast: true,
        }
      );
      toast.success("Email resend queued");
      fetchReport();
    } catch (error) {
      console.error("[AdminReportDetail] Resend email failed", {
        endpoint: `/veriport/reports/${veriportReportId}/email-pdf`,
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
      });
      handleApiError(error, {
        defaultMessage: "Failed to trigger manual resend.",
      });
    } finally {
      await ensureMinDuration(startedAt, 300);
      setResending(false);
    }
  };

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push("/dashboard/admin/reports")}
              className="text-cyan-400 hover:text-cyan-300"
            >
              Back to reports
            </button>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading report detail..." />
          ) : !report ? (
            <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 text-gray-300">
              Report not found or you do not have access.
            </div>
          ) : (
            <div className="rounded-lg border border-gray-700 bg-gray-900 p-6 text-gray-100 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white">Report Detail</h1>
                <p className="text-gray-400 mt-1">
                  Report {report.veriportReportId} revision{" "}
                  {report.reportRevisionNumber ?? "—"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">veriportReportId</p>
                  <p>{report.veriportReportId}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">reportRevisionNumber</p>
                  <p>{report.reportRevisionNumber ?? "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">receivedAt</p>
                  <p>{formatDate(report.receivedAt)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">pdfAvailable</p>
                  <StatusBadge status={report.pdfAvailable ? "AVAILABLE" : "UNAVAILABLE"} />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">emailStatus</p>
                  <ReportStatusBadge value={report.emailStatus} />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">pdfStatus</p>
                  <ReportStatusBadge value={report.pdfStatus} />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <LoadingButton
                  onClick={handleDownloadPdf}
                  loading={downloading}
                  disabled={!isPdfOperationallyReady}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Download PDF
                </LoadingButton>
                <LoadingButton
                  onClick={handleManualResend}
                  loading={resending}
                  disabled={!isPdfOperationallyReady}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Resend Email PDF
                </LoadingButton>
              </div>

              {!isPdfOperationallyReady && (
                <p className="text-sm text-yellow-300">PDF not available yet</p>
              )}

              <div className="pt-3">
                <h2 className="text-lg font-semibold text-white mb-3">PDF Preview</h2>
                <div className="w-full overflow-x-auto rounded border border-gray-700 bg-gray-950 p-3">
                  <div className="mx-auto w-[794px] max-w-none">
                    <PrintableMroReport
                      report={report}
                      issuedAt={formatDate(report.receivedAt, {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                      compact
                      containerId={`admin-veriport-preview-${veriportReportId}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default AdminReportDetailPage;

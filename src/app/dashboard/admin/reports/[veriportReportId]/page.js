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

const extractErrorInfo = (error) => {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const code = error?.code;
  const isTimeout =
    code === "ECONNABORTED" ||
    /timeout/i.test(String(error?.message || "")) ||
    /timeout/i.test(String(data?.message || ""));
  return {
    status,
    code,
    isTimeout,
    message:
      (typeof data === "string" ? data : data?.message) ||
      error?.message ||
      (typeof error === "string" ? error : "Unknown error"),
    responseData: data ?? null,
    responseHeaders: error?.response?.headers
      ? Object.fromEntries(
          Object.entries(error.response.headers).filter(([, v]) => v != null)
        )
      : null,
    requestUrl: error?.config?.url,
    requestBaseURL: error?.config?.baseURL,
    requestTimeoutMs: error?.config?.timeout,
    rawError: error,
  };
};

const PDF_UPLOAD_TIMEOUT_MS = 120000;

const peekPdfMagic = async (blob) => {
  try {
    const buf = await blob.slice(0, 8).arrayBuffer();
    const bytes = new Uint8Array(buf);
    const ascii = String.fromCharCode(...bytes);
    return { ascii, hex: [...bytes].map((b) => b.toString(16).padStart(2, "0")).join(" ") };
  } catch (e) {
    return { error: String(e?.message || e) };
  }
};

const buildPdfFromPreview = async (containerId, logLabel = "buildPdf") => {
  const t0 = performance.now();
  const previewContainer = document.getElementById(containerId);
  if (!previewContainer) {
    console.error(`[AdminReportDetail] ${logLabel}: DOM node missing`, {
      containerId,
      hint: "Expected element with this id for html2canvas",
    });
    throw new Error("Could not find PDF preview area.");
  }

  const rect = previewContainer.getBoundingClientRect();
  console.info(`[AdminReportDetail] ${logLabel}: start`, {
    containerId,
    width: rect.width,
    height: rect.height,
    childCount: previewContainer.children?.length,
  });

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const t1 = performance.now();
  const canvas = await html2canvas(previewContainer, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });
  const t2 = performance.now();

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imageWidth = pageWidth;
  const imageHeight = (canvas.height * imageWidth) / canvas.width;
  let y = 0;

  pdf.addImage(imgData, "PNG", 0, y, imageWidth, imageHeight, undefined, "FAST");
  while (y + imageHeight > pageHeight) {
    y -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, y, imageWidth, imageHeight, undefined, "FAST");
  }

  const blob = pdf.output("blob");
  const t3 = performance.now();
  const magic = await peekPdfMagic(blob);
  console.info(`[AdminReportDetail] ${logLabel}: done`, {
    html2canvasMs: Math.round(t2 - t1),
    jsPdfMs: Math.round(t3 - t2),
    totalMs: Math.round(t3 - t0),
    canvasPx: { w: canvas.width, h: canvas.height },
    blobBytes: blob.size,
    pdfMagic: magic,
  });

  return blob;
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
  const [generatingPdf, setGeneratingPdf] = useState(false);

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

    const startedAt = Date.now();
    setDownloading(true);
    try {
      const previewContainerId = `admin-veriport-preview-${veriportReportId}`;
      console.info("[AdminReportDetail] Local PDF generation for download", {
        source: "preview-dom",
        containerId: previewContainerId,
      });
      const blob = await buildPdfFromPreview(previewContainerId, "downloadPdf");
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
      const info = extractErrorInfo(error);
      console.error("[AdminReportDetail] Download PDF failed", {
        mode: "local-preview-generation",
        ...info,
      });
      handleApiError(error, {
        defaultMessage: info.message || "Failed to generate PDF. Please retry.",
      });
    } finally {
      await ensureMinDuration(startedAt, 300);
      setDownloading(false);
    }
  };

  const handleGenerateAndUploadPdf = async () => {
    if (!report || generatingPdf) return;

    const startedAt = Date.now();
    setGeneratingPdf(true);
    try {
      const previewContainerId = `admin-veriport-preview-${veriportReportId}`;
      const blob = await buildPdfFromPreview(previewContainerId, "uploadPdf");

      const magic = await peekPdfMagic(blob);
      const uploadUrl = `/veriport/reports/${veriportReportId}/pdf`;
      // Backend: raw application/pdf (see dfc-backend veriportRoutes pdfBodyMiddleware).
      console.info("[AdminReportDetail] POST upload PDF — about to send", {
        uploadUrl,
        fullUrlHint: `${typeof window !== "undefined" ? window.location.origin : ""} → ${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"}${uploadUrl}`,
        params: queryParams || {},
        contentType: "application/pdf",
        blobBytes: blob.size,
        pdfMagic: magic,
        clientDefaultAxiosTimeoutMs: 10000,
        thisRequestTimeoutMs: PDF_UPLOAD_TIMEOUT_MS,
      });

      const postStarted = performance.now();
      const response = await axios.post(uploadUrl, blob, {
        params: queryParams,
        headers: { "Content-Type": "application/pdf" },
        timeout: PDF_UPLOAD_TIMEOUT_MS,
        skipGlobalErrorToast: true,
      });
      const postMs = Math.round(performance.now() - postStarted);
      console.info("[AdminReportDetail] POST upload PDF — success", {
        status: response.status,
        postMs,
        responseData: response.data,
      });

      toast.success("PDF generated and uploaded successfully.");
      await fetchReport();
    } catch (error) {
      const info = extractErrorInfo(error);
      console.error("[AdminReportDetail] Upload PDF failed (full detail)", {
        endpoint: `/veriport/reports/${veriportReportId}/pdf`,
        ...info,
        note: info.isTimeout
          ? "Likely axios timeout (default was 10s). This request uses 120s — if still timing out, check network/proxy or server."
          : info.status === 400 && String(info.message).includes("PDF")
          ? "Server rejected body: not valid PDF or wrong Content-Type."
          : null,
      });
      handleApiError(error, {
        defaultMessage:
          info.message || "Failed to generate and upload PDF. Please retry.",
      });
    } finally {
      await ensureMinDuration(startedAt, 500);
      setGeneratingPdf(false);
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
                {!isPdfOperationallyReady && (
                  <LoadingButton
                    onClick={handleGenerateAndUploadPdf}
                    loading={generatingPdf}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate & Upload PDF
                  </LoadingButton>
                )}
                <LoadingButton
                  onClick={handleDownloadPdf}
                  loading={downloading}
                  disabled={!isPdfOperationallyReady || generatingPdf}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Download PDF
                </LoadingButton>
                <LoadingButton
                  onClick={handleManualResend}
                  loading={resending}
                  disabled={!isPdfOperationallyReady || generatingPdf}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Resend Email PDF
                </LoadingButton>
              </div>

              {!isPdfOperationallyReady && (
                <p className="text-sm text-yellow-300">
                  PDF not available yet. Preview is hidden until a PDF exists on the server; use
                  Generate &amp; Upload to build one from this report (template is rendered off-screen for
                  capture).
                </p>
              )}

              {isPdfOperationallyReady ? (
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
              ) : (
                <div
                  className="pointer-events-none fixed left-[-10000px] top-0 z-0 w-[794px] overflow-visible"
                  aria-hidden
                >
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
              )}
            </div>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default AdminReportDetailPage;

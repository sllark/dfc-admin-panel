"use client";

import React, { useMemo } from "react";

const C = {
  primary: "#192649",
  accent: "#2E7DC0",
  secondary: "#22AE82",
  white: "#ffffff",
  rowStripe: "#E3EBF1",
};

const FONT = "var(--font-sans)";
const SECONDARY_BAR = "rgba(34, 174, 130, 0.5)";
const BORDER_SECTION_ACCENT = `4px solid ${C.accent}`;
const BORDER_TABLE_HEAD_ACCENT = `2px solid ${C.accent}`;
const HEADER_GRADIENT = `linear-gradient(to right, ${C.white} 0%, ${C.white} 4%, ${C.secondary} 26%, ${C.accent} 56%, ${C.primary} 100%)`;

function dv(v) {
  if (v === null || v === undefined || v === "") return "-";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

function joinAddressLine(parts, sep = ", ") {
  const filtered = parts.map((p) => (p ?? "").trim()).filter(Boolean);
  return filtered.length ? filtered.join(sep) : "";
}

function formatUsDate(iso) {
  if (!iso) return "-";
  const raw = String(iso).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(raw)) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return dv(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function donorDisplayName(report) {
  const parts = [
    report?.donor?.donorFirst,
    report?.donor?.donorMiddle,
    report?.donor?.donorLast,
  ].filter((p) => Boolean(p && String(p).trim()));
  return parts.length ? parts.join(" ") : "-";
}

function ssnLast4Placeholder(report) {
  const id = report?.donor?.donorId;
  if (!id) return "-";
  const digits = String(id).replace(/\D/g, "");
  if (digits.length >= 4) return `****${digits.slice(-4)}`;
  return "****";
}

function specimenTypeShort(report) {
  const t =
    report?.results?.labPanels?.[0]?.panel?.labSpecimenType?.trim()?.toLowerCase() ?? "";
  if (t.includes("urine")) return "UI";
  if (t.includes("oral")) return "OB";
  if (t.includes("hair")) return "HA";
  return t ? t.slice(0, 2).toUpperCase() : "—";
}

const SectionHeader = ({ title, marginBottom = 8 }) => (
  <div
    style={{
      backgroundColor: SECONDARY_BAR,
      color: C.primary,
      fontFamily: FONT,
      fontWeight: 800,
      fontSize: "11px",
      padding: "5px 10px",
      borderBottom: BORDER_SECTION_ACCENT,
      marginBottom,
      letterSpacing: "0.02em",
      display: "flex",
      alignItems: "center",
      lineHeight: 1.15,
      minHeight: "26px",
      boxSizing: "border-box",
    }}
  >
    {title}
  </div>
);

const TwoColInfo = ({ left, right }) => (
  <div style={{ display: "flex", marginBottom: "10px", fontFamily: FONT }}>
    <div style={{ flex: 1, display: "flex", gap: "8px", paddingLeft: "8px" }}>
      <div
        style={{
          fontWeight: 800,
          color: C.primary,
          whiteSpace: "nowrap",
          fontSize: "12px",
          minWidth: "100px",
          letterSpacing: "0.02em",
        }}
      >
        {left.label}
      </div>
      <div style={{ fontSize: "12px", color: C.primary, lineHeight: 1.55, fontWeight: 400 }}>
        {left.lines.map((l, i) => (
          <div key={`${left.label}-${i}`}>{l}</div>
        ))}
      </div>
    </div>
    <div style={{ flex: 1, display: "flex", gap: "8px", paddingLeft: "8px" }}>
      <div
        style={{
          fontWeight: 800,
          color: C.primary,
          whiteSpace: "nowrap",
          fontSize: "12px",
          minWidth: "80px",
          letterSpacing: "0.02em",
        }}
      >
        {right.label}
      </div>
      <div style={{ fontSize: "12px", color: C.primary, lineHeight: 1.55, fontWeight: 400 }}>
        {right.lines.map((l, i) => (
          <div key={`${right.label}-${i}`}>{l}</div>
        ))}
      </div>
    </div>
  </div>
);

export default function PrintableMroReport({
  report,
  issuedAt,
  compact = true,
  containerId = "veriport-pdf-root",
}) {
  if (!report) return null;

  const timeline = report?.reportTimeline || {};
  const panels = report?.results?.labPanels || [];
  const overallResult =
    report?.results?.mroVerification?.mroMisOverallResult ??
    report?.results?.mroVerification?.mroOverallResult ??
    "-";

  const orderedItems = useMemo(
    () => panels.map((p) => p?.panel?.labPanelName).filter(Boolean).join(", "),
    [panels]
  );

  const firstPanel = panels[0]?.panel;
  const resultRows = useMemo(
    () =>
      panels.flatMap((panel) =>
        (panel?.results || []).map((res) => ({
          testLabel: [res?.testName, res?.testCode ? `(${res.testCode})` : null]
            .filter(Boolean)
            .join(" "),
          screenCutoff: res?.screenCutoff,
          confirmCutoff: res?.confirmCutoff,
          mroResult: res?.mroResult,
        }))
      ),
    [panels]
  );

  const controlIdRaw =
    report?.lab?.labCustomerReferenceId ??
    report?.lab?.labAccessionNumber ??
    report?.meta?.veriportReportId ??
    null;
  const controlIdDisplay = (() => {
    const s = dv(controlIdRaw);
    if (s === "-") return s;
    if (/control\s*id/i.test(s)) return s;
    return `Control ID: ${s}`;
  })();

  const mroName = report?.results?.mroVerification?.mroName ?? report?.mro?.mroCompanyName ?? "-";
  const mroCompanyLine = dv(report?.mro?.mroCompanyName);
  const collectionSiteName = dv(report?.collectionSite?.collectionSiteName);
  const collectionAddress =
    joinAddressLine(
      [
        report?.collectionSite?.collectionSiteAddress1,
        report?.collectionSite?.collectionSiteAddress2,
        joinAddressLine(
          [
            report?.collectionSite?.collectionSiteCity,
            report?.collectionSite?.collectionSiteStateProv,
            report?.collectionSite?.collectionSiteZipPostalCode,
          ],
          " "
        ),
      ],
      ", "
    ) || "-";
  const labAddress =
    joinAddressLine(
      [
        report?.lab?.labAddress1,
        report?.lab?.labAddress2,
        joinAddressLine([report?.lab?.labCity, report?.lab?.labStateProv, report?.lab?.labZipPostalCode], " "),
      ],
      ", "
    ) || "-";
  const labDirector = dv(report?.lab?.labCertifyingScientist);
  const branchPhone = dv(report?.customer?.customerPhone ?? report?.client?.clientPhone);
  const labInquiryPhone = dv(report?.lab?.labPhone);
  const disclaimer = report?.mroNotes?.mroLetterComment ?? "-";

  const verificationLine = [formatUsDate(timeline?.mroReportedDate), timeline?.mroReportedTime]
    .filter((x) => x && String(x).trim())
    .join(" ")
    .trim();

  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: "11px",
        color: C.primary,
        padding: compact ? "4px 0" : "12px 0",
        backgroundColor: "transparent",
      }}
    >
      <div id={containerId} style={{ width: "794px", margin: "0 auto", backgroundColor: C.white, boxSizing: "border-box" }}>
        <div style={{ padding: "8px 12px 0 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "stretch", marginBottom: "6px", gap: "12px" }}>
            <img src="/logo-with-name.png" alt="Drug Free Compliance" style={{ height: "58px", width: "auto", display: "block", objectFit: "contain" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ textAlign: "right", fontSize: "10px", color: C.primary, opacity: 0.88, lineHeight: 1.45 }}>
                <div>Specimen ID: {dv(report?.lab?.labSpecimenId)}</div>
                <div>{controlIdDisplay}</div>
              </div>
              <div style={{ marginTop: "5px", background: HEADER_GRADIENT, color: C.white, fontWeight: 700, fontSize: "10.5px", padding: "5px 10px", textAlign: "right", letterSpacing: "0.35px", borderRadius: "2px", lineHeight: 1.2 }}>
                {dv(report?.meta?.veriportReportId)}, {dv(overallResult)}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "0 12px" }}>
          <TwoColInfo
            left={{ label: "Donor Info:", lines: [`Name: ${donorDisplayName(report)}`, `SSN (Last 4): ${ssnLast4Placeholder(report)}`, `Date of Collection: ${formatUsDate(timeline?.specimenCollectedDate)}`] }}
            right={{ label: "Test Info:", lines: [`Test Type: ${dv(orderedItems || firstPanel?.labPanelName)}`, `Specimen Type: ${dv(firstPanel?.labSpecimenType)}`] }}
          />
        </div>

        <div style={{ padding: "0 12px" }}>
          <SectionHeader title="Sample Information" />
          <TwoColInfo
            left={{ label: "Collection Site:", lines: [collectionSiteName, collectionAddress, `Phone: ${dv(report?.collectionSite?.collectionSitePhone)}`] }}
            right={{
              label: "MRO Info:",
              lines: (() => {
                const lines = [];
                if (mroName !== "-") lines.push(mroName);
                if (mroCompanyLine !== "-" && mroCompanyLine !== mroName) lines.push(mroCompanyLine);
                if (lines.length === 0 && mroCompanyLine !== "-") lines.push(mroCompanyLine);
                lines.push(`Phone: ${dv(report?.mro?.mroPhone)}`);
                lines.push(`Verification Date: ${verificationLine || "-"}`);
                return lines;
              })(),
            }}
          />
        </div>

        <div style={{ padding: "0 12px" }}>
          <SectionHeader title="Results" marginBottom={0} />
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", fontFamily: FONT, marginBottom: "8px" }}>
            <thead>
              <tr style={{ backgroundColor: C.white }}>
                <th style={{ textAlign: "left", padding: "4px 7px", borderTop: BORDER_TABLE_HEAD_ACCENT, borderBottom: BORDER_TABLE_HEAD_ACCENT, color: C.primary, fontWeight: 800 }}>Drug</th>
                <th style={{ textAlign: "center", padding: "4px 7px", borderTop: BORDER_TABLE_HEAD_ACCENT, borderBottom: BORDER_TABLE_HEAD_ACCENT, color: C.primary, fontWeight: 800 }}>Screen Cutoff</th>
                <th style={{ textAlign: "center", padding: "4px 7px", borderTop: BORDER_TABLE_HEAD_ACCENT, borderBottom: BORDER_TABLE_HEAD_ACCENT, color: C.primary, fontWeight: 800 }}>Confirm Cutoff</th>
                <th style={{ textAlign: "center", padding: "4px 7px", borderTop: BORDER_TABLE_HEAD_ACCENT, borderBottom: BORDER_TABLE_HEAD_ACCENT, color: C.primary, fontWeight: 800 }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {resultRows.map((drug, i) => (
                <tr key={`${drug.testLabel}-${i}`} style={{ backgroundColor: i % 2 === 0 ? C.white : C.rowStripe }}>
                  <td style={{ padding: "4px 7px", color: C.primary, fontWeight: 700 }}>{dv(drug.testLabel)}</td>
                  <td style={{ padding: "4px 7px", textAlign: "center", color: C.primary }}>{dv(drug.screenCutoff)}</td>
                  <td style={{ padding: "4px 7px", textAlign: "center", color: C.primary }}>{dv(drug.confirmCutoff)}</td>
                  <td style={{ padding: "4px 7px", textAlign: "center", color: C.primary, fontWeight: 600 }}>{dv(drug.mroResult)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: "0 24px 0 24px", fontFamily: FONT }}>
          <div style={{ border: BORDER_TABLE_HEAD_ACCENT, marginBottom: "8px", backgroundColor: C.white, boxSizing: "border-box" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.75px", color: C.primary }}>
              <tbody>
                <tr>
                  <td style={{ padding: "8px 10px 8px 18px", fontWeight: 800, width: "32px" }}>01</td>
                  <td style={{ padding: "8px 14px 8px 12px", width: "36px", color: C.accent, fontWeight: 800 }}>{specimenTypeShort(report)}</td>
                  <td style={{ padding: "8px 12px", lineHeight: 1.25 }}>
                    <div>{dv(report?.lab?.labName)}</div>
                    <div>{labAddress !== "-" ? labAddress : "-"}</div>
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "right", whiteSpace: "nowrap" }}>{labDirector !== "-" ? `Dir: ${labDirector}` : ""}</td>
                </tr>
                <tr>
                  <td style={{ padding: "8px 10px 8px 18px", fontWeight: 800 }}>02</td>
                  <td style={{ padding: "8px 14px 8px 12px", color: C.accent, fontWeight: 800 }}>CS</td>
                  <td style={{ padding: "8px 12px", lineHeight: 1.25 }}>
                    <div>{collectionSiteName}</div>
                    <div>{collectionAddress}</div>
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {report?.collector?.collectorName ? `Collector: ${dv(report.collector.collectorName)}` : ""}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: "9.75px", marginBottom: "10px", color: C.primary, lineHeight: 1.35 }}>
            For Inquiries, the physician may contact <strong>Branch: {branchPhone}</strong> <strong>Lab: {labInquiryPhone}</strong>
          </div>
        </div>

        <div style={{ padding: "0 12px" }}>
          <SectionHeader title="Additional Sample Information" marginBottom={0} />
          <div style={{ minHeight: "58px", backgroundColor: C.white }} aria-hidden />
        </div>

        <div style={{ padding: "10px 12px", fontSize: "10px", fontFamily: FONT, color: C.primary, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
          <span style={{ flex: "1 1 280px", lineHeight: 1.25 }}>This report is verified by a certified Medical Review Officer.</span>
          <span style={{ display: "inline-flex", alignItems: "baseline", gap: "6px", whiteSpace: "nowrap" }}>
            Signature:
            <span style={{ borderBottom: `2px solid ${C.primary}`, display: "inline-block", minWidth: "200px" }} />
          </span>
        </div>

        <div style={{ padding: "0 12px 10px 12px", marginTop: "4px", fontFamily: FONT }}>
          <div style={{ height: "1px", backgroundColor: "#D0D8E2", marginBottom: "6px" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "8px 0", fontSize: "10px", color: C.primary }}>
            <div>Date Issued: {issuedAt || "-"}</div>
            <div style={{ textAlign: "center", fontWeight: 800, letterSpacing: "0.03em" }}>Final Report</div>
            <div style={{ textAlign: "right" }}>Page 1 of 1</div>
          </div>
          <div style={{ fontSize: "9.5px", color: C.primary, opacity: 0.92, lineHeight: 1.35 }}>
            <strong>Disclaimer / Or Note Goes Here:</strong> {disclaimer}
          </div>
        </div>
      </div>
    </div>
  );
}

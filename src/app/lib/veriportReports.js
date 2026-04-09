const pick = (obj, keys, fallback = null) => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null) return value;
  }
  return fallback;
};

const maybeJson = (value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

const asObject = (value, fallback = {}) => {
  const parsed = maybeJson(value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : fallback;
};

const asArray = (value, fallback = []) => {
  const parsed = maybeJson(value);
  return Array.isArray(parsed) ? parsed : fallback;
};

const toArray = (value) => {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : [value];
};

export const normalizeReportSummary = (item) => ({
  veriportReportId: pick(item, ["veriportReportId", "veriport_report_id", "id"], ""),
  reportRevisionNumber: pick(item, ["reportRevisionNumber", "report_revision_number", "revision"], null),
  receivedAt: pick(item, ["receivedAt", "received_at", "createdAt", "created_at"], null),
  emailStatus: pick(item, ["emailStatus", "email_status"], null),
  pdfStatus: pick(item, ["pdfStatus", "pdf_status"], null),
  pdfAvailable: Boolean(pick(item, ["pdfAvailable", "pdf_available"], false)),
});

export const extractReportsList = (raw) => {
  const candidates = [
    raw?.data?.reports,
    raw?.data?.items,
    raw?.data?.rows,
    raw?.reports,
    raw?.items,
    raw?.rows,
    raw?.data,
    raw,
  ];

  const list = candidates.find((entry) => Array.isArray(entry)) || [];
  return list.map(normalizeReportSummary);
};

export const extractReportsMeta = (raw) => {
  const meta = raw?.meta || raw?.data?.meta || {};
  const totalPages =
    meta.last_page ?? meta.totalPages ?? meta.total_pages ?? meta.pageCount ?? 1;
  const totalItems = meta.total ?? meta.totalItems ?? meta.total_items ?? 0;
  return { totalPages: Math.max(1, Number(totalPages) || 1), totalItems: Number(totalItems) || 0 };
};

export const extractReportDetail = (raw) => {
  const base =
    raw?.data?.reportDetail ||
    raw?.data?.report_detail ||
    raw?.data?.report ||
    raw?.data?.veriportReport ||
    raw?.data?.veriport_report ||
    raw?.reportDetail ||
    raw?.report_detail ||
    raw?.report ||
    raw?.veriportReport ||
    raw?.veriport_report ||
    raw?.data ||
    raw;

  const detail = asObject(base, {});
  const parsedJson = asObject(pick(detail, ["parsedJson", "parsed_json"], {}), {});
  const veriportRoot = asObject(
    pick(parsedJson, ["VeriportMroData", "veriportMroData", "veriport_mro_data"], {}),
    {}
  );

  const metaRaw = asObject(
    pick(detail, ["meta", "reportMeta", "report_meta"], {
      veriportReportId:
        pick(veriportRoot, ["VeriportReportId", "veriportReportId"]) ||
        pick(detail, ["veriportReportId", "veriport_report_id"]),
      reportRevisionNumber:
        pick(veriportRoot?.TestInformation || {}, ["ReportRevisionNumber"]) ||
        pick(detail, ["reportRevisionNumber", "report_revision_number", "revision"]),
    }),
    {}
  );
  const timelineRaw = asObject(
    pick(detail, ["reportTimeline", "timeline", "report_timeline"], veriportRoot?.ReportTimeline || {}),
    {}
  );
  const donorRaw = asObject(
    pick(detail, ["donor", "donorInfo", "donor_info"], veriportRoot?.Donor || {}),
    {}
  );
  const clientRaw = asObject(
    pick(detail, ["client", "clientInfo", "client_info"], veriportRoot?.Client || {}),
    {}
  );
  const customerRaw = asObject(
    pick(detail, ["customer", "customerInfo", "customer_info"], veriportRoot?.Customer || {}),
    {}
  );
  const labRaw = asObject(
    pick(detail, ["lab", "labInfo", "lab_info"], veriportRoot?.Lab || {}),
    {}
  );
  const mroRaw = asObject(
    pick(detail, ["mro", "mroInfo", "mro_info"], veriportRoot?.Mro || {}),
    {}
  );
  const notesRaw = asObject(
    pick(detail, ["mroNotes", "notes", "mro_notes"], veriportRoot?.MroNotes || {}),
    {}
  );
  const collectorRaw = asObject(
    pick(detail, ["collector", "collectorInfo", "collector_info"], veriportRoot?.Collector || {}),
    {}
  );
  const collectionSiteRaw = asObject(
    pick(
      detail,
      ["collectionSite", "collection_site", "site", "collectionSiteInfo"],
      veriportRoot?.CollectionSite || {}
    ),
    {}
  );

  const resultsRaw = asObject(
    pick(
      detail,
      ["results", "reportResults", "report_results", "result"],
      veriportRoot?.Results || {}
    ),
    {}
  );
  const mroVerificationRaw = asObject(
    pick(
      resultsRaw,
      ["mroVerification", "mro_verification", "verification", "MroVerification"],
      {}
    ),
    {}
  );
  const rawPanels = asArray(
    pick(
      resultsRaw,
      ["labPanels", "lab_panels", "panels", "testPanels", "LabPanel"],
      []
    ),
    []
  );

  const labPanels = toArray(rawPanels).map((row) => {
    const source = asObject(row, {});
    const panelRaw = asObject(
      pick(source, ["panel", "labPanel", "lab_panel", "testPanel", "Panel"], source),
      {}
    );
    const rowResults = toArray(
      pick(
        source,
        ["results", "tests", "labResults", "lab_results", "panelResults", "Result"],
        []
      )
    ).map((r) => ({
      testName: pick(r, ["testName", "test_name", "name", "LabTestName", "TestCodeName"], null),
      testCode: pick(r, ["testCode", "test_code", "code", "LabTestCode", "TestCodeNumber"], null),
      screenCutoff: pick(r, ["screenCutoff", "screen_cutoff", "ScreenCutoff"], null),
      confirmCutoff: pick(r, ["confirmCutoff", "confirm_cutoff", "ConfirmCutoff"], null),
      mroResult: pick(r, ["mroResult", "mro_result", "result", "MroResult"], null),
    }));

    return {
      panel: {
        labPanelName: pick(panelRaw, ["labPanelName", "lab_panel_name", "name", "LabPanelName"], null),
        labSpecimenType: pick(
          panelRaw,
          ["labSpecimenType", "lab_specimen_type", "specimenType", "LabSpecimenType"],
          null
        ),
      },
      results: rowResults,
    };
  });

  return {
    ...detail,
    veriportReportId:
      pick(detail, ["veriportReportId", "veriport_report_id"]) ||
      pick(metaRaw, ["veriportReportId", "veriport_report_id"]),
    reportRevisionNumber:
      pick(detail, ["reportRevisionNumber", "report_revision_number", "revision"]) ||
      pick(metaRaw, ["reportRevisionNumber", "report_revision_number", "revision"]),
    receivedAt: pick(detail, ["receivedAt", "received_at", "createdAt", "created_at"], null),
    emailStatus: pick(detail, ["emailStatus", "email_status"], null),
    pdfStatus: pick(detail, ["pdfStatus", "pdf_status"], null),
    pdfAvailable: Boolean(
      pick(detail, ["pdfAvailable", "pdf_available"], false) ||
        pick(detail, ["pdfPublicId", "pdf_public_id"], null) ||
        pick(detail, ["pdfUploadedAt", "pdf_uploaded_at"], null) ||
        pick(detail, ["pdfStatus", "pdf_status"], null) === "UPLOADED"
    ),
    meta: {
      ...metaRaw,
      veriportReportId:
        pick(metaRaw, ["veriportReportId", "veriport_report_id"]) ||
        pick(detail, ["veriportReportId", "veriport_report_id"]),
    },
    reportTimeline: {
      ...timelineRaw,
      specimenCollectedDate: pick(timelineRaw, ["specimenCollectedDate", "SpecimenCollectedDate"], null),
      mroReportedDate: pick(timelineRaw, ["mroReportedDate", "MroReportedDate"], null),
      mroReportedTime: pick(timelineRaw, ["mroReportedTime", "MroReportedTime"], null),
    },
    donor: {
      ...donorRaw,
      donorFirst: pick(donorRaw, ["donorFirst", "DonorFirst"], null),
      donorMiddle: pick(donorRaw, ["donorMiddle", "DonorMiddle"], null),
      donorLast: pick(donorRaw, ["donorLast", "DonorLast"], null),
      donorId: pick(donorRaw, ["donorId", "DonorId"], null),
    },
    client: {
      ...clientRaw,
      clientPhone: pick(clientRaw, ["clientPhone", "ClientPhone"], null),
    },
    customer: {
      ...customerRaw,
      customerPhone: pick(customerRaw, ["customerPhone", "CustomerPhone"], null),
    },
    lab: {
      ...labRaw,
      labName: pick(labRaw, ["labName", "LabName"], null),
      labAddress1: pick(labRaw, ["labAddress1", "LabAddress1"], null),
      labAddress2: pick(labRaw, ["labAddress2", "LabAddress2"], null),
      labCity: pick(labRaw, ["labCity", "LabCity"], null),
      labStateProv: pick(labRaw, ["labStateProv", "LabStateProv"], null),
      labZipPostalCode: pick(labRaw, ["labZipPostalCode", "LabZipPostalCode"], null),
      labPhone: pick(labRaw, ["labPhone", "LabPhone"], null),
      labSpecimenId: pick(labRaw, ["labSpecimenId", "LabSpecimenId"], null),
      labAccessionNumber: pick(labRaw, ["labAccessionNumber", "LabAccessionNumber"], null),
      labCustomerReferenceId: pick(labRaw, ["labCustomerReferenceId", "LabCustomerReferenceId"], null),
      labCertifyingScientist: pick(labRaw, ["labCertifyingScientist", "LabCertifyingScientist"], null),
    },
    mro: {
      ...mroRaw,
      mroCompanyName: pick(mroRaw, ["mroCompanyName", "MroCompanyName"], null),
      mroPhone: pick(mroRaw, ["mroPhone", "MroPhone"], null),
    },
    mroNotes: {
      ...notesRaw,
      mroLetterComment: pick(notesRaw, ["mroLetterComment", "MroLetterComment"], null),
    },
    collector: {
      ...collectorRaw,
      collectorName: pick(collectorRaw, ["collectorName", "CollectorName"], null),
    },
    collectionSite: {
      ...collectionSiteRaw,
      collectionSiteName: pick(collectionSiteRaw, ["collectionSiteName", "CollectionSiteName"], null),
      collectionSiteAddress1: pick(collectionSiteRaw, ["collectionSiteAddress1", "CollectionSiteAddress1"], null),
      collectionSiteAddress2: pick(collectionSiteRaw, ["collectionSiteAddress2", "CollectionSiteAddress2"], null),
      collectionSiteCity: pick(collectionSiteRaw, ["collectionSiteCity", "CollectionSiteCity"], null),
      collectionSiteStateProv: pick(collectionSiteRaw, ["collectionSiteStateProv", "CollectionSiteStateProv"], null),
      collectionSiteZipPostalCode: pick(
        collectionSiteRaw,
        ["collectionSiteZipPostalCode", "CollectionSiteZipPostalCode"],
        null
      ),
      collectionSitePhone: pick(collectionSiteRaw, ["collectionSitePhone", "CollectionSitePhone"], null),
    },
    results: {
      ...resultsRaw,
      mroVerification: {
        ...mroVerificationRaw,
        mroName: pick(mroVerificationRaw, ["mroName", "MroName"], null),
        mroOverallResult: pick(mroVerificationRaw, ["mroOverallResult", "MroOverallResult"], null),
        mroMisOverallResult: pick(mroVerificationRaw, ["mroMisOverallResult", "MroMisOverallResult"], null),
      },
      labPanels,
    },
  };
};

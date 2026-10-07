import ExcelJS from "exceljs";

/**
 * Sanitizes a string for use as an Excel worksheet name.
 * Excel sheet names:
 * - Cannot exceed 31 characters
 * - Cannot contain: \ / ? * : [ ]
 * - Cannot be empty
 * - Must be unique within the workbook
 * @param {string} name
 * @param {Set<string>} existingNames
 * @returns {string}
 */
export const sanitizeWorksheetName = (name, existingNames = new Set()) => {
  let cleaned = (name || "Sheet")
    .replace(/[\\/?*:[\]]/g, "_")
    .trim()
    .slice(0, 31);
  if (!cleaned) cleaned = "Sheet";

  let finalName = cleaned;
  let counter = 1;
  while (existingNames.has(finalName.toLowerCase())) {
    const suffix = ` (${counter})`;
    const maxBaseLength = 31 - suffix.length;
    finalName = `${cleaned.slice(0, maxBaseLength)}${suffix}`;
    counter++;
  }
  existingNames.add(finalName.toLowerCase());
  return finalName;
};

const applyHeaderStyle = (row) => {
  row.font = { bold: true, color: { argb: "FF000000" } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF0F0F0" },
  };
  row.border = {
    bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
  };
  row.alignment = { vertical: "middle" };
  row.height = 24;
};

/**
 * Generates an ExcelJS workbook for job billing exports.
 * Worksheets included in order:
 * 1. All Print Jobs: All qualifying jobs within date range
 * 2. Billing Group Totals: Totals for each billing group
 * 3. Individual Billing Groups: Separate worksheet for each billing group
 *
 * @param {Array} jobs
 * @param {Object} options
 * @returns {Promise<ExcelJS.Workbook>}
 */
export const generateBillingExcelWorkbook = async (
  jobs = [],
  options = {}
) => {
  const { startDate = "", endDate = "" } = options;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CoreDesk";
  workbook.created = new Date();

  if (startDate && endDate) {
    workbook.title = `Billing Export: ${startDate} to ${endDate}`;
    workbook.subject = `Date Range: ${startDate} to ${endDate}`;
    workbook.description =
      `Export of finalized print jobs from ${startDate} to ${endDate}`;
  }

  const existingSheetNames = new Set();
  const dateRangeText =
    startDate && endDate ? `Date Range: ${startDate} to ${endDate}` : "";

  // 1. Sheet 1: All Print Jobs
  const allJobsSheetName = sanitizeWorksheetName(
    "All Print Jobs",
    existingSheetNames
  );
  const allJobsSheet = workbook.addWorksheet(allJobsSheetName);

  const titleRow1 = allJobsSheet.addRow(["All Print Jobs"]);
  titleRow1.font = { bold: true, size: 14, color: { argb: "FF1E293B" } };

  if (dateRangeText) {
    const dateRow1 = allJobsSheet.addRow([dateRangeText]);
    dateRow1.font = { italic: true, size: 10, color: { argb: "FF64748B" } };
  }

  allJobsSheet.addRow([]); // Spacer row

  const allJobsHeaders = [
    "Job ID",
    "Title",
    "Submitter",
    "Billing Group",
    "Finalized Date",
    "Status",
    "Items Count",
    "Total Cost",
  ];
  const headerRow1 = allJobsSheet.addRow(allJobsHeaders);
  applyHeaderStyle(headerRow1);

  const jobRows = jobs.map((job) => {
    const submitterName =
      `${job.user?.firstName || ""} ${job.user?.lastName || ""}`.trim() ||
      job.user?.email ||
      "Unknown";

    const groupLedgerItem = Array.isArray(job.ledgerItems)
      ? job.ledgerItems.find((item) => item.billingGroupId)
      : (job.ledgerItems?.billingGroupId ? job.ledgerItems : null);

    const billingGroupId =
      groupLedgerItem?.billingGroupId ?? job.groupId;

    const isGroupBilling = Boolean(billingGroupId);

    let groupName;
    let rawGroupKey;

    if (isGroupBilling) {
      groupName =
        groupLedgerItem?.billingGroup?.title ||
        job.group?.title ||
        "Billing Group";

      rawGroupKey = `group_${billingGroupId}`;
    } else {
      groupName = submitterName;
      rawGroupKey = `user_${job.userId ?? job.user?.id ?? "unknown"}`;
    }

    const finalizedDateStr = job.finalizedAt
      ? new Date(job.finalizedAt).toISOString().slice(0, 10)
      : "";

    const itemsCount = Array.isArray(job.items)
      ? job.items.length
      : job._count?.items || 0;

    const totalCost = Number(job.calculatedCost ?? 0);

    return {
      id: job.id,
      title: job.title || "",
      submitter: submitterName,
      billingGroup: groupName,
      finalizedAt: finalizedDateStr,
      status: job.status || "Finalized",
      itemsCount,
      totalCost,
      rawGroupKey,
      rawGroupName: groupName,
    };
  });

  jobRows.forEach((row) => {
    const addedRow = allJobsSheet.addRow([
      row.id,
      row.title,
      row.submitter,
      row.billingGroup,
      row.finalizedAt,
      row.status,
      row.itemsCount,
      row.totalCost,
    ]);
    const costCell = addedRow.getCell(8);
    costCell.numFmt = '"$"#,##0.00';
    costCell.alignment = { horizontal: "right" };
  });

  allJobsSheet.columns = [
    { width: 28 },
    { width: 32 },
    { width: 25 },
    { width: 28 },
    { width: 20 },
    { width: 16 },
    { width: 14 },
    { width: 16 },
  ];

  // Group by billing group (treating individual projects as separate groups)
  const groupMap = new Map();
  jobRows.forEach((row) => {
    if (!groupMap.has(row.rawGroupKey)) {
      groupMap.set(row.rawGroupKey, {
        groupName: row.rawGroupName,
        jobs: [],
        totalCost: 0,
      });
    }
    const g = groupMap.get(row.rawGroupKey);
    g.jobs.push(row);
    g.totalCost += row.totalCost;
  });

  // 2. Sheet 2: Billing Group Totals
  const totalsSheetName = sanitizeWorksheetName(
    "Billing Group Totals",
    existingSheetNames
  );
  const totalsSheet = workbook.addWorksheet(totalsSheetName);

  const titleRow2 = totalsSheet.addRow(["Billing Group Totals"]);
  titleRow2.font = { bold: true, size: 14, color: { argb: "FF1E293B" } };

  if (dateRangeText) {
    const dateRow2 = totalsSheet.addRow([dateRangeText]);
    dateRow2.font = { italic: true, size: 10, color: { argb: "FF64748B" } };
  }

  totalsSheet.addRow([]); // Spacer row

  const totalsHeaders = ["Billing Group", "Job Count", "Total Cost"];
  const headerRow2 = totalsSheet.addRow(totalsHeaders);
  applyHeaderStyle(headerRow2);

  Array.from(groupMap.values()).forEach((g) => {
    const addedRow = totalsSheet.addRow([
      g.groupName,
      g.jobs.length,
      g.totalCost,
    ]);
    const costCell = addedRow.getCell(3);
    costCell.numFmt = '"$"#,##0.00';
    costCell.alignment = { horizontal: "right" };
  });

  totalsSheet.columns = [{ width: 32 }, { width: 14 }, { width: 18 }];

  // 3. Sheets 3+: Individual Billing Groups
  Array.from(groupMap.values()).forEach((g) => {
    const sheetName = sanitizeWorksheetName(g.groupName, existingSheetNames);
    const groupSheet = workbook.addWorksheet(sheetName);

    const groupTitleRow = groupSheet.addRow([g.groupName]);
    groupTitleRow.font = {
      bold: true,
      size: 14,
      color: { argb: "FF1E293B" },
    };

    if (dateRangeText) {
      const groupDateRow = groupSheet.addRow([dateRangeText]);
      groupDateRow.font = {
        italic: true,
        size: 10,
        color: { argb: "FF64748B" },
      };
    }

    groupSheet.addRow([]); // Spacer row

    const groupHeaders = [
      "Job ID",
      "Title",
      "Submitter",
      "Finalized Date",
      "Items Count",
      "Total Cost",
    ];
    const groupHeaderRow = groupSheet.addRow(groupHeaders);
    applyHeaderStyle(groupHeaderRow);

    g.jobs.forEach((j) => {
      const addedRow = groupSheet.addRow([
        j.id,
        j.title,
        j.submitter,
        j.finalizedAt,
        j.itemsCount,
        j.totalCost,
      ]);
      const costCell = addedRow.getCell(6);
      costCell.numFmt = '"$"#,##0.00';
      costCell.alignment = { horizontal: "right" };
    });

    groupSheet.columns = [
      { width: 28 },
      { width: 32 },
      { width: 25 },
      { width: 20 },
      { width: 14 },
      { width: 16 },
    ];
  });

  return workbook;
};

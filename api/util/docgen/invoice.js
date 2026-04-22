import { prisma } from "#prisma";
import { LogType } from "#prisma-client";
import { uploadFile } from "#upload";
import PDFDocument from "pdfkit";

export const calculateTotalCostOfJobByJobId = async (jobId) => {
  const data = await prisma.job.findFirst({
    where: {
      id: jobId,
    },
    include: {
      items: {
        include: {
          resource: true,
          material: true,
          secondaryMaterial: true,
          resourceType: true,
        },
      },
      additionalCosts: {
        include: {
          resource: true,
          material: true,
          secondaryMaterial: true,
          resourceType: true,
        },
      },
    },
  });

  return calculateTotalCostOfJob(data);
};

const formatCurrency = (value) => `$${(Number(value) || 0).toFixed(2)}`;

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatQuantity = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "0";
  if (Number.isInteger(value)) return `${value}`;
  return value.toFixed(2).replace(/\.?0+$/, "");
};

const getEntityDisplayName = (entity) => {
  if (!entity) return "";

  if (typeof entity.name === "string" && entity.name.trim()) {
    return entity.name.trim();
  }

  return [entity.firstName, entity.lastName].filter(Boolean).join(" ").trim();
};

export const selectInvoiceCustomer = ({
  billingGroup,
  payerAccount,
  requester,
} = {}) => {
  const billingGroupName = billingGroup?.title || billingGroup?.name || "";
  if (billingGroupName) {
    return {
      name: billingGroupName,
      email: "",
    };
  }

  const payerName = getEntityDisplayName(payerAccount);
  if (payerName || payerAccount?.email) {
    return {
      name: payerName || payerAccount?.email || "Customer",
      email: payerAccount?.email || "",
    };
  }

  const requesterName = getEntityDisplayName(requester);
  if (requesterName || requester?.email) {
    return {
      name: requesterName || requester?.email || "Customer",
      email: requester?.email || "",
    };
  }

  return {
    name: "Customer",
    email: "",
  };
};

const calculateResourceAndMaterialLinePrice = (line) => {
  let total = 0;

  total += (line.unitQty || 0) * (line.resource?.costPerUnit || 0);
  total += (line.timeQty || 0) * (line.resource?.costPerTime || 0);
  total +=
    (line.processingTimeQty || 0) *
    (line.resource?.costPerProcessingTime || 0);
  total += (line.materialQty || 0) * (line.material?.costPerUnit || 0);
  total +=
    (line.secondaryMaterialQty || 0) *
    (line.secondaryMaterial?.costPerUnit || 0);

  return total;
};

export const calculateTotalCostOfJob = (data) => {
  let totalCost = 0;

  // First, add up the additional line items
  data.additionalCosts.forEach((cost) => {
    if (cost.resourceType?.costingMode === "RAW_VALUE_ENTRY") {
      totalCost += cost.rawValue || 0;
      return;
    }

    if (typeof cost.amount === "number") {
      totalCost += cost.amount;
      return;
    }

    totalCost += calculateResourceAndMaterialLinePrice(cost);
  });

  // if additionalCostOverride is true, return totalCost
  if (data.additionalCostOverride) return totalCost;

  // Next, add up the item costs
  data.items.forEach((item) => {
    if (item.resourceType?.costingMode === "RAW_VALUE_ENTRY") {
      totalCost += (item.rawValue || 0) * (item.qty ?? 1);
      return;
    }

    totalCost += calculateResourceAndMaterialLinePrice(item) * (item.qty ?? 1);
  });

  return totalCost;
};

const calculateJobItemLinePrice = (item) => {
  if (item.resourceType?.costingMode === "RAW_VALUE_ENTRY") {
    return item.rawValue || 0;
  }

  return calculateResourceAndMaterialLinePrice(item);
};

const calculateAdditionalCostLinePrice = (cost) => {
  if (cost.resourceType?.costingMode === "RAW_VALUE_ENTRY") {
    return cost.rawValue || 0;
  }

  if (typeof cost.amount === "number") {
    return cost.amount;
  }

  return calculateResourceAndMaterialLinePrice(cost);
};

const buildInvoiceRows = (job) => {
  const rows = [];

  const jobItems = (job.items || []).filter((item) => item.active !== false);
  const additionalCosts = (job.additionalCosts || []).filter(
    (cost) => cost.active !== false
  );

  if (!job.additionalCostOverride) {
    jobItems.forEach((item) => {
      const qty =
        typeof item.qty === "number" && Number.isFinite(item.qty) && item.qty > 0
          ? item.qty
          : 1;
      const lineItemPrice = calculateJobItemLinePrice(item);

      rows.push({
        label: item.title || "Untitled job item",
        qty,
        lineItemPrice,
        subtotal: lineItemPrice * qty,
      });
    });
  }

  additionalCosts.forEach((cost, index) => {
    const lineItemPrice = calculateAdditionalCostLinePrice(cost);
    rows.push({
      label: `Additional Cost #${index + 1}`,
      qty: 1,
      lineItemPrice,
      subtotal: lineItemPrice,
    });
  });

  return rows;
};

const drawInvoicePdf = async ({ job, shop, customer, rows, total, draft }) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "LETTER" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const left = doc.page.margins.left;
    const right = left + pageWidth;

    const itemWidth = 255;
    const qtyWidth = 60;
    const priceWidth = 95;
    const subtotalWidth = pageWidth - itemWidth - qtyWidth - priceWidth;

    const colItem = left;
    const colQty = colItem + itemWidth;
    const colPrice = colQty + qtyWidth;
    const colSubtotal = colPrice + priceWidth;

    if (draft) {
      doc
        .fillColor("red")
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("DRAFT INVOICE", left, doc.y, {
          width: pageWidth,
          align: "center",
        });
      doc.moveDown(0.3);
      doc.fillColor("black");
    }

    doc.fontSize(20).font("Helvetica-Bold").text("INVOICE");
    doc.moveDown(0.5);

    doc.fontSize(11).font("Helvetica");
    doc.text(`Inv created at: ${formatDate(new Date())}`);
    doc.text(`Job name: ${job.title || "Untitled job"}`);

    doc.moveDown();
    doc.font("Helvetica-Bold").text("Shop");
    doc.font("Helvetica").text(shop.name || "Shop");
    if (shop.email) doc.text(shop.email);
    if (shop.phone) doc.text(shop.phone);

    doc.moveDown();
    doc.font("Helvetica-Bold").text("Customer");
    doc.font("Helvetica").text(customer.name || "Customer");
    if (customer.email) doc.text(customer.email);

    doc.moveDown(1.5);
    let y = doc.y;

    const drawTableHeader = () => {
      doc.moveTo(left, y - 4).lineTo(right, y - 4).stroke();
      doc.font("Helvetica-Bold").fontSize(11);
      doc.text("Item", colItem, y, { width: itemWidth });
      doc.text("Qty", colQty, y, { width: qtyWidth });
      doc.text("Line Item Price", colPrice, y, { width: priceWidth });
      doc.text("Subtotal", colSubtotal, y, { width: subtotalWidth });
      y += 18;
      doc.moveTo(left, y).lineTo(right, y).stroke();
      y += 8;
      doc.font("Helvetica").fontSize(11);
    };

    const ensureRowFits = (rowHeight) => {
      const bottomLimit = doc.page.height - doc.page.margins.bottom;
      if (y + rowHeight + 25 <= bottomLimit) return;
      doc.addPage();
      y = doc.page.margins.top;
      drawTableHeader();
    };

    drawTableHeader();

    if (rows.length === 0) {
      const rowHeight = 16;
      ensureRowFits(rowHeight);
      doc.text("No billable items", colItem, y, { width: itemWidth });
      y += rowHeight;
      doc.moveTo(left, y + 2).lineTo(right, y + 2).stroke();
      y += 16;
    } else {
      rows.forEach((row) => {
        const itemHeight = doc.heightOfString(row.label, { width: itemWidth });
        const rowHeight = Math.max(itemHeight, 16);
        ensureRowFits(rowHeight);

        doc.text(row.label, colItem, y, { width: itemWidth });
        doc.text(formatQuantity(row.qty), colQty, y, { width: qtyWidth });
        doc.text(formatCurrency(row.lineItemPrice), colPrice, y, {
          width: priceWidth,
        });
        doc.text(formatCurrency(row.subtotal), colSubtotal, y, {
          width: subtotalWidth,
        });

        y += rowHeight + 6;
      });

      doc.moveTo(left, y).lineTo(right, y).stroke();
      y += 16;
    }

    const totalLineHeight = 18;
    ensureRowFits(totalLineHeight);
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text(`Total: ${formatCurrency(total)}`, left, y, {
      width: pageWidth,
      align: "right",
    });

    doc.end();
  });

export const generateInvoice = async (
  data,
  userId,
  shopId,
  { draft = false } = {}
) => {
  const job = await prisma.job.findFirst({
    where: {
      id: data.id,
      shopId,
    },
    include: {
      additionalCosts: {
        where: {
          active: true,
        },
        include: {
          material: true,
          secondaryMaterial: true,
          resource: true,
          resourceType: true,
        },
      },
      items: {
        where: {
          active: true,
        },
        include: {
          material: true,
          secondaryMaterial: true,
          resource: true,
          resourceType: true,
        },
      },
    },
  });

  if (!job) {
    throw new Error("Job not found while generating invoice");
  }

  const billingGroupId =
    job.groupId ||
    (data?.billingAccount?.type === "GROUP" ? data.billingAccount.id : null);
  const payerUserId = billingGroupId
    ? null
    : data?.billingAccount?.type === "USER"
      ? data.billingAccount.id
      : job.userId;
  const requesterUserId = job.userId;
  const userIds = [...new Set([payerUserId, requesterUserId].filter(Boolean))];

  const [shop, billingGroup, users] = await Promise.all([
    prisma.shop.findFirst({
      where: {
        id: shopId,
      },
      select: {
        name: true,
        email: true,
        phone: true,
      },
    }),
    billingGroupId
      ? prisma.billingGroup.findFirst({
          where: {
            id: billingGroupId,
          },
          select: {
            title: true,
          },
        })
      : null,
    userIds.length
      ? prisma.user.findMany({
          where: {
            id: {
              in: userIds,
            },
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        })
      : [],
  ]);

  if (!shop) {
    throw new Error("Shop not found while generating invoice");
  }

  const usersById = Object.fromEntries(users.map((user) => [user.id, user]));

  const rows = buildInvoiceRows(job);
  const total = calculateTotalCostOfJob(job);
  const customer = selectInvoiceCustomer({
    billingGroup,
    payerAccount:
      (payerUserId && usersById[payerUserId]) || data?.billingAccount || null,
    requester:
      (requesterUserId && usersById[requesterUserId]) || data?.user || null,
  });

  const pdf = await drawInvoicePdf({
    job,
    shop,
    customer,
    rows,
    total,
    draft,
  });

  const uploaded = await uploadFile({
    body: pdf,
    originalname: `invoice-${job.id}.pdf`,
    mimetype: "application/pdf",
    contentType: "application/pdf",
    userId,
    metadata: {
      type: "invoice",
      jobId: job.id,
      shopId,
    },
  });

  const log = await prisma.logs.create({
    data: {
      type: LogType.JOB_INVOICE_GENERATED,
      jobId: job.id,
      userId,
      to: JSON.stringify({
        url: uploaded.location,
        key: uploaded.key,
        value: total,
      }),
    },
  });

  return {
    url: uploaded.location,
    key: uploaded.key,
    value: total,
    log,
  };
};

/*
const test = async () => {
  const data = await prisma.job.findFirst({
    where: {
      id: "cm2jl8hwj0001q4bxbfex38io",
    },
    include: {
      items: {
        include: {
          resource: true,
          material: true,
        },
      },
      additionalCosts: {
        include: {
          resource: true,
          material: true,
        },
      },
    },
  });

  const userId = "cm2ceomc20000qrdmvld5p3s6";
  const shopId = "cm2dz5xdz0002665mvd5j491p";

  const invoice = await generateInvoice(data, userId, shopId);
  console.log(invoice);
};

test();
*/

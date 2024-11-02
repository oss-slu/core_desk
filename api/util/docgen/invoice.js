import ejs from "ejs";
import { utapi } from "../../config/uploadthing.js";
import html_to_pdf from "html-pdf-node";
import { prisma } from "#prisma";
import { LogType } from "@prisma/client";

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

  return calculateTotalCostOfJob(data);
};

export const calculateTotalCostOfJob = (data) => {
  let totalCost = 0;

  // First, add up the additional line items
  data.additionalCosts.forEach((cost) => {
    if (!cost.resource || !cost.material) return;

    totalCost += (cost.unitQty || 0) * (cost.resource.costPerUnit || 0);
    totalCost += (cost.timeQty || 0) * (cost.resource.costPerTime || 0);
    totalCost +=
      (cost.processingTimeQty || 0) *
      (cost.resource.costPerProcessingTime || 0);
    totalCost += (cost.materialQty || 0) * (cost.material.costPerUnit || 0);
  });

  // if additionalCostOverride is true, return totalCost
  if (data.additionalCostOverride) return totalCost;

  // Next, add up the item costs
  data.items.forEach((item) => {
    if (!item.resource || !item.material) return;

    totalCost += (item.timeQty || 0) * (item.resource.costPerTime || 0);
    totalCost +=
      (item.processingTimeQty || 0) *
      (item.resource.costPerProcessingTime || 0);
    totalCost += (item.unitQty || 0) * (item.resource.costPerUnit || 0);
    totalCost += (item.materialQty || 0) * (item.material.costPerUnit || 0);
  });

  return totalCost;
};

export const generateInvoice = async (data, userId, shopId) => {
  const shop = await prisma.shop.findFirst({
    where: {
      id: shopId,
    },
  });
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
  });

  return new Promise((resolve, reject) => {
    ejs.renderFile(
      "./util/docgen/invoice.ejs",
      { ...data, data, calculateTotalCostOfJob, shop, user },
      async (err, html) => {
        if (err) console.error(err);
        if (err) reject(err);

        html_to_pdf.generatePdf(
          { content: html },
          {
            format: "Letter",
            printBackground: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
          },
          async (err, res) => {
            if (err) reject(err);
            const ut = await utapi.uploadFiles([
              new File([res], "invoice.pdf", { type: "application/pdf" }),
            ]);
            if (!ut || !ut[0] || !ut[0].data) {
              console.error(ut);
              reject("Upload failed");
            }

            const log = await prisma.logs.create({
              data: {
                type: LogType.JOB_INVOICE_GENERATED,
                jobId: data.id,
                userId,
                to: JSON.stringify({
                  url: ut[0].data.url,
                  key: ut[0].data.key,
                  value: calculateTotalCostOfJob(data),
                }),
              },
            });

            resolve({
              url: ut[0].data.url,
              key: ut[0].data.key,
              value: calculateTotalCostOfJob(data),
              log,
            });
          }
        );
      }
    );
  });
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

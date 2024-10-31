import { generateInvoice } from "../util/docgen/invoice.js";
import { prisma } from "#prisma";
import { utapi } from "../config/uploadthing.js";

const regnerateInvoice = async () => {
  const shopId = "cm2dz5xdz0002665mvd5j491p";
  const userId = "cm2idh6v70000e42wflwjx5c3";
  const jobId = "cm2wwyvhl000dn17tqurtc8sf";

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

  const originalLedgerItem = await prisma.ledgerItem.findFirst({
    where: {
      jobId: jobId,
      type: "JOB",
    },
  });

  await utapi.deleteFiles(originalLedgerItem.invoiceKey);

  const { url, key } = await generateInvoice(data, userId, shopId);
  await prisma.job.update({
    where: {
      id: jobId,
    },
    data: {
      finalized: true,
      finalizedAt: new Date(),
    },
  });

  await prisma.ledgerItem.update({
    where: {
      jobId: jobId,
      type: "JOB",
    },
    data: {
      invoiceKey: key,
      invoiceUrl: url,
    },
  });

  console.log("Invoice regenerated");
  console.log("Invoice URL: ", url);
  console.log("Invoice Key: ", key);
};

regnerateInvoice();

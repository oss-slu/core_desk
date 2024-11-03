import { prisma } from "#prisma";
import { generateInvoice } from "../../util/docgen/invoice.js";
import { htmlToPdf } from "../../util/htmlToPdf.js";

export const get = async (req, res) => {
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

  // PDF is a Uint8Array

  res.setHeader("Content-Type", "application/pdf");
  res.send(Buffer.from(invoice));
};

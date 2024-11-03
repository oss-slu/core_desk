import { htmlToPdf } from "../../util/htmlToPdf.js";

export const get = async (req, res) => {
  const pdf = await htmlToPdf("<h1>Test</h1>");

  // PDF is a Uint8Array

  res.setHeader("Content-Type", "application/pdf");
  res.send(Buffer.from(pdf));
};

import { htmlToPdf } from "../../util/htmlToPdf.js";

export const get = async (req, res) => {
  const pdf = htmlToPdf("<h1>Test</h1>");
  res.send(pdf);
};

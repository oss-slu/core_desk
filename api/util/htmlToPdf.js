import puppeteer from "puppeteer";

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/chromium-browser",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const page = await browser.newPage();

export const htmlToPdf = async (html) => {
  await page.setContent(html);
  const pdf = await page.pdf({ format: "letter" });
  return pdf;
};

import puppeteer from "puppeteer";

const browser = await puppeteer.launch({
  executablePath:
    process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium-browser",

  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
console.log("Launched Puppeteer");

export const htmlToPdf = async (html) => {
  const page = await browser.newPage();
  console.log("Created Page");

  await page.setContent(html, { waitUntil: "domcontentloaded" });

  const pdf = await page.pdf({ format: "letter" });

  return pdf;
};

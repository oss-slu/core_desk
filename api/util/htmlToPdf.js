import puppeteer from "puppeteer";

const browser = await puppeteer.launch({
  executablePath:
    process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium-browser",

  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
console.log("Launched Puppeteer");

const page = await browser.newPage();
console.log("Created Page");

export const htmlToPdf = async (html) => {
  await page.setContent(html, { waitUntil: "domcontentloaded" });

  const pdf = await page.pdf({ format: "letter" });

  return pdf;
};

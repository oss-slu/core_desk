import puppeteer from "puppeteer";
const logging = false;

const browser = await puppeteer.launch({
  executablePath:
    process.env.NODE_ENV === "production"
      ? process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium-browser"
      : undefined,

  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
logging && console.log("Launched Puppeteer");

let page = null;

export const htmlToPdf = async (html) => {
  const startTime = Date.now();
  if (!page) {
    page = await browser.newPage();
    logging && console.log("Created Page");
  } else {
    logging && console.log("Inherited Page");
  }

  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({ format: "letter", printBackground: true });

  const endTime = Date.now();
  logging && console.log(`PDF generated in ${endTime - startTime}ms`);

  return pdf;
};

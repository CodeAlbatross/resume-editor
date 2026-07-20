import puppeteer from 'puppeteer';

let browser = null;

async function getBrowser() {
  if (!browser || !browser.isConnected()) {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browser;
}

export async function generatePDF(html, options = {}) {
  const b = await getBrowser();
  const page = await b.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // 检测是否超出一页
    if (options.checkOverflow) {
      const pageMargin = options.pageMargin || 15; // mm each side
      const overflow = await page.evaluate((margin) => {
        const body = document.body;
        const height = body.scrollHeight;
        const pxPerMm = 96 / 25.4;
        const pageHeightMm = 297 - margin * 2; // A4 - top & bottom margins
        return height / pxPerMm > pageHeightMm;
      }, pageMargin);
      return { overflow };
    }

    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
      printBackground: true,
      preferCSSPageSize: true,
    });
    return { buffer: pdf, overflow: false };
  } finally {
    await page.close();
  }
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

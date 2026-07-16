const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function generatePDF() {
  let browser;
  let context;
  let page;

  try {
    console.log('🚀 Starting PDF generation process...');

    // Validate Jekyll build output exists
    const mainPagePath = path.resolve('_site/index.html');
    console.log('📂 Checking for built site at:', mainPagePath);

    if (!fs.existsSync(mainPagePath)) {
      console.log('📁 Contents of _site directory:');
      if (fs.existsSync('_site')) {
        fs.readdirSync('_site').forEach(item => console.log('  -', item));
      }
      throw new Error('Jekyll build output not found at: ' + mainPagePath);
    }

    const fileContent = fs.readFileSync(mainPagePath, 'utf8');
    console.log('📝 Main page size:', fileContent.length, 'characters');

    if (fileContent.length < 100) {
      throw new Error('Main page appears to be empty or corrupted');
    }

    // Launch browser
    console.log('🌐 Launching Chromium...');
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--no-first-run',
        '--disable-default-apps'
      ]
    });

    context = await browser.newContext({
      viewport: { width: 1200, height: 900 },
      deviceScaleFactor: 1
    });
    page = await context.newPage();
    console.log('✅ Browser ready');

    // Load the Jekyll-built page via file:// protocol
    const fileUrl = 'file://' + mainPagePath;
    console.log('🔗 Loading:', fileUrl);

    await page.goto(fileUrl, {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    console.log('✅ Page loaded');

    // Force light theme so print stylesheet variables resolve correctly
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });

    // Wait for fonts and images to settle
    await page.waitForTimeout(2000);

    // Validate page has content
    const bodyText = await page.textContent('body');
    if (!bodyText || bodyText.trim().length === 0) {
      throw new Error('Page body is empty');
    }
    console.log('📝 Body content length:', bodyText.length, 'characters');

    // Emulate print media — this activates @media print in our stylesheet
    await page.emulateMedia({ media: 'print' });
    console.log('🖨️ Print media emulated — @media print styles active');

    // Short wait for print styles to apply
    await page.waitForTimeout(500);

    // Ensure output directory exists
    const outputDir = 'assets/pdf';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate PDF using print stylesheet — no injected styles, no manual overrides
    const outputPath = path.join(outputDir, 'cv-keg-dev-print.pdf');
    console.log('📄 Generating PDF...');

    await page.pdf({
      path: outputPath,
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,  // Respect @page rules in our stylesheet
      displayHeaderFooter: false,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }, // @page handles margins
      omitBackground: false
    });

    // Verify output
    const savedStats = fs.statSync(outputPath);
    const sizeKB = Math.round(savedStats.size / 1024);
    console.log('✅ PDF saved to:', outputPath);
    console.log('📊 PDF size:', sizeKB, 'KB');

    if (savedStats.size < 1000) {
      throw new Error('Generated PDF is too small — likely corrupted');
    }

    console.log('✅ PDF generation completed successfully');

  } catch (error) {
    console.error('❌ PDF generation failed:');
    console.error('  Error:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  } finally {
    if (page) await page.close().catch(e => console.error('Error closing page:', e.message));
    if (context) await context.close().catch(e => console.error('Error closing context:', e.message));
    if (browser) await browser.close().catch(e => console.error('Error closing browser:', e.message));
    console.log('🧹 Browser closed');
  }
}

generatePDF().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

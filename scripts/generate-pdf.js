const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function generatePDF() {
  let browser;
  let context;
  let page;
  
  try {
    console.log('🚀 Starting PDF generation process...');
    
    // Launch browser
    console.log('🌐 Launching Chromium browser...');
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
    console.log('✅ Browser launched successfully');
    
    // Create context and page
    console.log('📄 Creating browser context and page...');
    context = await browser.newContext({
      viewport: { width: 1200, height: 800 },
      deviceScaleFactor: 1
    });
    page = await context.newPage();
    console.log('✅ Page created successfully');
    
    // Check if main page exists
    const mainPagePath = path.resolve('_site/index.html');
    console.log('📂 Checking for main page at:', mainPagePath);
    
    if (!fs.existsSync(mainPagePath)) {
      console.log('❌ Main page does not exist');
      console.log('📁 Contents of _site directory:');
      if (fs.existsSync('_site')) {
        fs.readdirSync('_site').forEach(item => {
          console.log('  -', item);
        });
      }
      throw new Error('Main page not found at: ' + mainPagePath);
    }
    
    // Read and validate file content
    const fileContent = fs.readFileSync(mainPagePath, 'utf8');
    console.log('📝 Main page file size:', fileContent.length, 'characters');
    
    if (fileContent.length < 100) {
      console.log('❌ Main page seems too small or empty');
      console.log('📝 Content preview:', fileContent);
      throw new Error('Main page appears to be empty or corrupted');
    }
    
    // Load the page
    const fileUrl = 'file://' + mainPagePath;
    console.log('🔗 Loading URL:', fileUrl);
    
    const response = await page.goto(fileUrl, {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    
    if (!response) {
      throw new Error('Failed to load page - no response received');
    }
    
    console.log('✅ Page loaded with status:', response.status());
    
    // Wait for page to fully load
    console.log('⏳ Waiting for page content to load...');
    await page.waitForTimeout(5000);
    
    // Inject PDF-optimized styles
    console.log('🎨 Injecting PDF optimization styles...');
    await page.addStyleTag({
      content: `
        /* Hide elements that shouldn't be in PDF */
        footer, .footer { display: none !important; }
        
        /* Ensure colors are preserved */
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        /* Optimize body for PDF */
        body {
          padding: 0 !important;
          margin: 0 !important;
          background: #f5f5f5 !important;
        }
        
        /* Ensure wrapper fits properly */
        .wrapper {
          margin: 20px auto !important;
          max-width: 1000px !important;
          box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1) !important;
        }
        
        /* Hide any buttons or interactive elements */
        .btn, button, .pdf-download-btn {
          display: none !important;
        }
        
        /* Ensure proper page breaks */
        .section {
          page-break-inside: avoid;
        }
      `
    });
    
    // Take a screenshot for debugging
    console.log('📸 Taking screenshot for debugging...');
    await page.screenshot({ 
      path: 'debug-screenshot.png', 
      fullPage: true 
    });
    console.log('✅ Screenshot saved as debug-screenshot.png');
    
    // Validate page content
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    const bodyContent = await page.textContent('body');
    if (!bodyContent || bodyContent.trim().length === 0) {
      console.log('❌ Page body appears to be empty');
      const htmlContent = await page.content();
      console.log('🔍 HTML content preview:', htmlContent.substring(0, 500));
      throw new Error('Page body is empty');
    }
    
    console.log('📝 Body content length:', bodyContent.length, 'characters');
    
    // Generate PDF
    console.log('📄 Generating PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      displayHeaderFooter: false,
      margin: { 
        top: '0.3in', 
        right: '0.3in', 
        bottom: '0.3in', 
        left: '0.3in' 
      },
      scale: 0.8
    });
    
    console.log('✅ PDF generated, size:', pdf.length, 'bytes');
    
    // Ensure output directory exists
    const outputDir = 'assets/pdf';
    if (!fs.existsSync(outputDir)) {
      console.log('📁 Creating directory:', outputDir);
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save PDF
    const outputPath = path.join(outputDir, 'cv-keg-dev-print.pdf');
    console.log('💾 Saving PDF to:', outputPath);
    fs.writeFileSync(outputPath, pdf);
    
    // Verify saved file
    const savedStats = fs.statSync(outputPath);
    console.log('✅ PDF saved successfully:', Math.round(savedStats.size / 1024), 'KB');
    
    if (savedStats.size < 1000) {
      throw new Error('Generated PDF is too small, likely corrupted');
    }
    
  } catch (error) {
    console.error('❌ PDF generation failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    // Cleanup
    if (page) {
      console.log('🧹 Closing page...');
      await page.close().catch(e => console.error('Error closing page:', e.message));
    }
    if (context) {
      console.log('🧹 Closing context...');
      await context.close().catch(e => console.error('Error closing context:', e.message));
    }
    if (browser) {
      console.log('🧹 Closing browser...');
      await browser.close().catch(e => console.error('Error closing browser:', e.message));
    }
    console.log('✅ Cleanup completed');
  }
}

// Run the function
generatePDF().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
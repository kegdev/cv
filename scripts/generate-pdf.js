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
    
    // Wait for page to fully load including CSS
    console.log('⏳ Waiting for page content and styles to load...');
    await page.waitForTimeout(8000); // Increased wait time for CSS
    
    // Check if CSS is loaded by looking for styled elements
    const hasStyles = await page.evaluate(() => {
      const wrapper = document.querySelector('.wrapper');
      if (!wrapper) return false;
      
      const styles = window.getComputedStyle(wrapper);
      console.log('Wrapper background:', styles.backgroundColor);
      console.log('Wrapper display:', styles.display);
      
      return styles.display === 'grid' || styles.backgroundColor !== 'rgba(0, 0, 0, 0)';
    });
    
    console.log('🎨 CSS loaded status:', hasStyles ? 'Styles applied' : 'No styles detected');
    
    if (!hasStyles) {
      console.log('⚠️ CSS not loading properly, checking for stylesheet links...');
      const stylesheets = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        return links.map(link => ({
          href: link.href,
          loaded: link.sheet !== null
        }));
      });
      console.log('📄 Stylesheets found:', JSON.stringify(stylesheets, null, 2));
    }
    
    // Inject PDF-optimized styles
    console.log('🎨 Injecting PDF optimization styles...');
    await page.addStyleTag({
      content: `
        /* Ensure CSS Grid layout works */
        .wrapper {
          display: grid !important;
          grid-template-columns: repeat(10, 1fr) !important;
          background: #42A8C0 !important;
          max-width: 1000px !important;
          margin: 20px auto !important;
          box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1) !important;
        }
        
        .sidebar-wrapper {
          grid-column: span 3 !important;
          background: #42A8C0 !important;
          color: #fff !important;
          padding: 30px !important;
        }
        
        .main-wrapper {
          grid-column: span 7 !important;
          background: #fff !important;
          padding: 60px !important;
        }
        
        /* Typography */
        body {
          font-family: "Roboto", Arial, sans-serif !important;
          color: #666 !important;
          background: #f5f5f5 !important;
          font-size: 14px !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        
        .name {
          font-size: 32px !important;
          font-weight: 900 !important;
          margin-top: 0 !important;
          margin-bottom: 10px !important;
          color: #fff !important;
        }
        
        .tagline {
          color: rgba(256, 256, 256, 0.6) !important;
          font-size: 16px !important;
          font-weight: 400 !important;
          margin-top: 0 !important;
          margin-bottom: 0 !important;
        }
        
        .section-title {
          text-transform: uppercase !important;
          font-size: 20px !important;
          font-weight: 500 !important;
          color: #369fb5 !important;
          position: relative !important;
          margin-top: 0 !important;
          margin-bottom: 20px !important;
        }
        
        .container-block-title {
          text-transform: uppercase !important;
          font-size: 16px !important;
          font-weight: 700 !important;
          margin-top: 0 !important;
          margin-bottom: 15px !important;
          color: #fff !important;
        }
        
        .contact-list {
          list-style: none !important;
          padding: 0 !important;
        }
        
        .contact-list li {
          margin-bottom: 15px !important;
          color: #fff !important;
        }
        
        .profile-container {
          padding: 30px !important;
          background: rgba(0, 0, 0, 0.2) !important;
          text-align: center !important;
          color: #fff !important;
        }
        
        .avatar {
          max-width: 100px !important;
          margin-bottom: 15px !important;
          border: 0px solid #fff !important;
          border-radius: 100% !important;
          box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1) !important;
        }
        
        .container-block {
          padding: 30px !important;
        }
        
        .item {
          margin-bottom: 30px !important;
        }
        
        .upper-row {
          position: relative !important;
          overflow: hidden !important;
          margin-bottom: 2px !important;
          display: flex !important;
        }
        
        .job-title, .degree, .cert-title {
          color: #666 !important;
          font-size: 16px !important;
          margin-top: 0 !important;
          margin-bottom: 0 !important;
          font-weight: 500 !important;
          flex: 75% !important;
        }
        
        .time, .cert-url {
          position: absolute !important;
          right: 0 !important;
          top: 0 !important;
          color: #999 !important;
          flex: 25% !important;
        }
        
        .company, .university, .cert-org {
          margin-bottom: 10px !important;
          color: #999 !important;
        }
        
        .skillset .item {
          margin-bottom: 15px !important;
          overflow: hidden !important;
        }
        
        .level-title {
          font-size: 14px !important;
          margin-top: 0 !important;
          margin-bottom: 12px !important;
        }
        
        .level-bar {
          height: 12px !important;
          background: #f5f5f5 !important;
        }
        
        .level-bar-inner {
          height: 12px !important;
          background: #5bc0de !important;
        }
        
        /* Hide elements that shouldn't be in PDF */
        footer, .footer { display: none !important; }
        
        /* Ensure colors are preserved */
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
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
    
    // Wait for injected styles to take effect
    console.log('⏳ Waiting for injected styles to apply...');
    await page.waitForTimeout(3000);
    
    // Take another screenshot after styling
    console.log('📸 Taking post-styling screenshot...');
    await page.screenshot({ 
      path: 'debug-screenshot-styled.png', 
      fullPage: true 
    });
    console.log('✅ Styled screenshot saved as debug-screenshot-styled.png');
    
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
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
    
    // Wait for images to load and fix image paths
    console.log('🖼️ Fixing image paths and waiting for images to load...');
    
    // Fix relative image paths for file:// protocol
    await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (img.src && img.src.startsWith('file://') && img.src.includes('/assets/images/')) {
          // Image path is already correct for file protocol
          console.log('Image src:', img.src);
        } else if (img.getAttribute('src') && img.getAttribute('src').startsWith('/assets/images/')) {
          // Fix relative path
          const currentPath = window.location.pathname.replace('/index.html', '');
          const newSrc = window.location.protocol + '//' + window.location.host + currentPath + img.getAttribute('src');
          console.log('Fixing image path from', img.src, 'to', newSrc);
          img.src = newSrc;
        }
      });
    });
    
    await page.waitForTimeout(3000);
    
    // Check if profile image loaded and try to fix it if not
    const profileImageStatus = await page.evaluate(() => {
      const avatar = document.querySelector('.avatar');
      if (!avatar) return 'No avatar element found';
      
      console.log('Avatar src:', avatar.src);
      console.log('Avatar complete:', avatar.complete);
      console.log('Avatar naturalWidth:', avatar.naturalWidth);
      
      // If image failed to load, try to load it as base64
      if (!avatar.complete || avatar.naturalWidth === 0) {
        // Create a canvas to generate a placeholder
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        
        // Draw a simple placeholder
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = '#6d6e8a';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('KG', 50, 60);
        
        avatar.src = canvas.toDataURL();
        return 'Generated placeholder image';
      }
      
      return `Image loaded: ${avatar.naturalWidth}x${avatar.naturalHeight}`;
    });
    console.log('👤 Profile image status:', profileImageStatus);
    
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
    
    // Inject PDF-optimized styles with correct theme colors and fixes
    console.log('🎨 Injecting comprehensive PDF styles with ceramic theme and layout fixes...');
    await page.addStyleTag({
      content: `
        /* Ceramic theme variables */
        :root {
          --theme-color: #6d6e8a;
          --text-color: #3F4650;
          --text-color-secondary: #545E6C;
          --text-grey: #97AAC3;
          --smoky-white: #f5f5f5;
        }
        
        /* Base styles */
        body {
          font-family: "Roboto", Arial, sans-serif !important;
          color: var(--text-color-secondary) !important;
          background: var(--smoky-white) !important;
          font-size: 14px !important;
          padding: 30px !important;
          margin: 0 !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
        }
        
        /* Main wrapper - CSS Grid layout */
        .wrapper {
          display: grid !important;
          grid-template-columns: repeat(10, 1fr) !important;
          background: var(--theme-color) !important;
          max-width: 1000px !important;
          margin: 0 auto !important;
          position: relative !important;
          box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1) !important;
        }
        
        /* Sidebar - Fixed positioning and styling */
        .sidebar-wrapper {
          grid-column: span 3 !important;
          order: 1 !important;
          background: var(--theme-color) !important;
          color: #fff !important;
          position: static !important;
          float: none !important;
        }
        
        .sidebar-wrapper a {
          color: #fff !important;
        }
        
        /* Profile container - Fixed spacing */
        .profile-container {
          padding: 30px !important;
          background: rgba(0, 0, 0, 0.2) !important;
          text-align: center !important;
          color: #fff !important;
          margin-bottom: 0 !important;
        }
        
        /* Profile image - Ensure it displays */
        .avatar {
          max-width: 100px !important;
          width: 100px !important;
          height: 100px !important;
          margin: 0 auto 15px auto !important;
          border: 0px solid #fff !important;
          border-radius: 100% !important;
          box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1) !important;
          display: block !important;
          object-fit: cover !important;
        }
        
        .name {
          font-size: 32px !important;
          font-weight: 900 !important;
          margin-top: 0 !important;
          margin-bottom: 10px !important;
          color: #fff !important;
        }
        
        .tagline {
          color: rgba(255, 255, 255, 0.6) !important;
          font-size: 16px !important;
          font-weight: 400 !important;
          margin-top: 0 !important;
          margin-bottom: 0 !important;
        }
        
        /* Contact and other sidebar sections */
        .contact-list {
          list-style: none !important;
          padding: 0 !important;
          margin-bottom: 0 !important;
        }
        
        .contact-list .fas,
        .contact-list .fab,
        .contact-list .far {
          margin-right: 5px !important;
          font-size: 18px !important;
          vertical-align: middle !important;
          color: #fff !important;
        }
        
        .contact-list li {
          margin-bottom: 15px !important;
          color: #fff !important;
        }
        
        .contact-list li:last-child {
          margin-bottom: 0 !important;
        }
        
        .container-block {
          padding: 30px !important;
        }
        
        .container-block-title {
          text-transform: uppercase !important;
          font-size: 16px !important;
          font-weight: 700 !important;
          margin-top: 0 !important;
          margin-bottom: 15px !important;
          color: #fff !important;
        }
        
        /* Education section in sidebar */
        .education-container .item {
          margin-bottom: 15px !important;
        }
        
        .education-container .item:last-child {
          margin-bottom: 0 !important;
        }
        
        .education-container .degree {
          font-size: 14px !important;
          margin-top: 0 !important;
          margin-bottom: 5px !important;
          color: #fff !important;
        }
        
        .education-container .meta {
          color: rgba(255, 255, 255, 0.6) !important;
          font-weight: 500 !important;
          margin-bottom: 0px !important;
          margin-top: 0 !important;
        }
        
        .education-container .time {
          color: rgba(255, 255, 255, 0.6) !important;
          font-weight: 500 !important;
          margin-bottom: 0px !important;
        }
        
        /* Languages section */
        .languages-container .lang-desc {
          color: rgba(255, 255, 255, 0.6) !important;
        }
        
        .languages-list {
          margin-bottom: 0 !important;
        }
        
        .languages-list li {
          margin-bottom: 10px !important;
          color: #fff !important;
        }
        
        .languages-list li:last-child {
          margin-bottom: 0 !important;
        }
        
        /* Main content - Fixed alignment */
        .main-wrapper {
          grid-column: span 7 !important;
          order: 2 !important;
          background: #fff !important;
          padding: 60px !important;
          margin: 0 !important;
          position: static !important;
        }
        
        .section-title {
          text-transform: uppercase !important;
          font-size: 20px !important;
          font-weight: 500 !important;
          color: #5a5b73 !important;
          position: relative !important;
          margin-top: 0 !important;
          margin-bottom: 20px !important;
        }
        
        .section {
          margin-bottom: 60px !important;
        }
        
        .section:last-child {
          margin-bottom: 0 !important;
        }
        
        /* Experience and education items */
        .experiences-section .item,
        .educations-section .item {
          margin-bottom: 30px !important;
        }
        
        .upper-row,
        .second-upper-row {
          position: relative !important;
          overflow: hidden !important;
          margin-bottom: 2px !important;
          display: flex !important;
        }
        
        .job-title,
        .degree,
        .cert-title {
          color: var(--text-color) !important;
          font-size: 16px !important;
          margin-top: 0 !important;
          margin-bottom: 0 !important;
          font-weight: 500 !important;
          flex: 75% !important;
        }
        
        .time,
        .cert-url {
          position: absolute !important;
          right: 0 !important;
          top: 0 !important;
          color: var(--text-grey) !important;
          flex: 25% !important;
        }
        
        .company,
        .university,
        .cert-org {
          margin-bottom: 10px !important;
          color: var(--text-grey) !important;
        }
        
        .details {
          margin-top: 5px !important;
          color: var(--text-color-secondary) !important;
          line-height: 1.5 !important;
        }
        
        /* Skills section */
        .skillset .item {
          margin-bottom: 15px !important;
          overflow: hidden !important;
        }
        
        .skillset .level-title {
          font-size: 14px !important;
          margin-top: 0 !important;
          margin-bottom: 12px !important;
          color: var(--text-color) !important;
        }
        
        .skillset .level-bar {
          height: 12px !important;
          background: var(--smoky-white) !important;
        }
        
        .skillset .level-bar-inner {
          height: 12px !important;
          background: #8a8ba6 !important;
        }
        
        /* Certifications */
        .certifications-section .item {
          margin-bottom: 30px !important;
        }
        
        /* Typography */
        h1, h2, h3, h4, h5, h6 {
          font-weight: 700 !important;
        }
        
        p {
          line-height: 1.5 !important;
          margin-bottom: 15px !important;
        }
        
        /* Links */
        a {
          color: #5a5b73 !important;
        }
        
        /* Hide elements that shouldn't be in PDF */
        footer, .footer { display: none !important; }
        .btn, button, .pdf-download-btn { display: none !important; }
        
        /* Ensure colors are preserved */
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        /* Page breaks - Keep sections together */
        .section {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        .item {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Keep career profile and experiences together */
        .summary-section {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        
        .experiences-section {
          page-break-before: avoid !important;
          break-before: avoid !important;
        }
        
        /* Prevent orphaned titles */
        .section-title {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        
        /* Keep job entries together */
        .experiences-section .item,
        .educations-section .item,
        .certifications-section .item {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin-bottom: 25px !important;
        }
        
        /* Force image loading */
        img {
          max-width: 100% !important;
          height: auto !important;
        }
        
        /* Ensure profile image displays */
        .avatar {
          background: #ffffff !important;
          border: 2px solid rgba(255,255,255,0.3) !important;
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
        top: '0.4in', 
        right: '0.4in', 
        bottom: '0.4in', 
        left: '0.4in' 
      },
      scale: 0.75,  // Slightly smaller to fit more content
      pageRanges: '', // Print all pages
      omitBackground: false
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
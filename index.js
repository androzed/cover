const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const app = express();
const port = 3000;

// Serve static files (screenshots) from the "public" directory
app.use('/screenshots', express.static(path.join(__dirname, 'public')));

app.get('/screenshot', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send('URL query parameter is required');
  }

  let browser;
  try {
    // Launch Puppeteer with additional flags for better rendering
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--font-render-hinting=none'],
      defaultViewport: null
    });
    const page = await browser.newPage();

    // Set viewport size to double the desired dimensions
    await page.setViewport({ 
      width: 2400, 
      height: 1260, 
      deviceScaleFactor: 1 
    });

    // Set user agent to a modern browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Navigate to the URL with a longer timeout
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

    // Wait for the specific element to be loaded
    await page.waitForSelector('.container', { timeout: 15000 });

    // Create file names based on the current timestamp
    const timestamp = Date.now();
    const originalFilePath = path.join(__dirname, 'public', `original-${timestamp}.png`);
    const optimizedFilePath = path.join(__dirname, 'public', `optimized-${timestamp}.png`);

    // Capture the full page
    await page.screenshot({ 
      path: originalFilePath,
      type: 'png',
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width: 2400,
        height: 1260
      },
      omitBackground: true
    });

    // Optimize and resize the image
    await sharp(originalFilePath)
      .resize(1200, 630, {
        fit: 'cover',
        position: 'top'
      })
      .png({ quality: 80, compressionLevel: 9 })
      .toFile(optimizedFilePath);

    // Remove the original file
    fs.unlinkSync(originalFilePath);

    // Respond with the optimized screenshot URL
    const screenshotUrl = `/screenshots/optimized-${timestamp}.png`;
    res.json({ screenshotUrl });
  } catch (error) {
    console.error('Screenshot error:', error);
    res.status(500).send(`Error taking screenshot: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// Create "public" directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'public'))) {
  fs.mkdirSync(path.join(__dirname, 'public'));
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

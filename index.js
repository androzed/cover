const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
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
    // Launch Puppeteer with --no-sandbox and --disable-setuid-sandbox flags
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set viewport size with a higher deviceScaleFactor for better quality
    await page.setViewport({ 
      width: 1200, 
      height: 630, 
      deviceScaleFactor: 1 
    });

    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait for the specific element to be loaded
    await page.waitForSelector('.container', { timeout: 10000 });

    // Create a file name based on the current timestamp
    const timestamp = Date.now();
    const filePath = path.join(__dirname, 'public', `cover-${timestamp}.png`);

    // Capture the specific element and its content
    const element = await page.$('.container');
    await element.screenshot({ 
      path: filePath,
      type: 'png',
      clip: {
        x: 0,
        y: 0,
        width: 1200,
        height: 630
      }
    });

    // Respond with the screenshot URL
    const screenshotUrl = `/screenshots/cover-${timestamp}.png`;
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

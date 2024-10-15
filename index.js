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

    // Set a larger viewport to ensure we capture everything
    await page.setViewport({ width: 1920, height: 1080 });

    // Set user agent to a modern browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Navigate to the URL with a longer timeout
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

    // Wait for the specific element to be loaded
    await page.waitForSelector('.container', { timeout: 15000 });

    // Get the bounding box of the .container element
    const element = await page.$('.container');
    const boundingBox = await element.boundingBox();

    // Create file names based on the current timestamp
    const timestamp = Date.now();
    const originalFilePath = path.join(__dirname, 'public', `original-${timestamp}.png`);
    const optimizedFilePath = path.join(__dirname, 'public', `optimized-${timestamp}.png`);

    // Capture the .container element
    await element.screenshot({ 
      path: originalFilePath,
      type: 'png',
      omitBackground: true
    });

    // Calculate the aspect ratio of the desired dimensions
    const targetAspectRatio = 1200 / 630;

    // Calculate dimensions for cropping
    let cropWidth = boundingBox.width;
    let cropHeight = boundingBox.height;
    
    if (cropWidth / cropHeight > targetAspectRatio) {
      // If wider than target ratio, adjust width
      cropWidth = cropHeight * targetAspectRatio;
    } else {
      // If taller than target ratio, adjust height
      cropHeight = cropWidth / targetAspectRatio;
    }

    // Optimize and resize the image
    await sharp(originalFilePath)
      .resize({
        width: Math.round(cropWidth),
        height: Math.round(cropHeight),
        fit: 'cover',
        position: 'top'
      })
      .resize(1200, 630, { fit: 'fill' })
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

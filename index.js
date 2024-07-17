const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport:false,
        userDataDir: './tmp',
    });
    const page = await browser.newPage();
    await page.goto('https://www.amazon.in/s?k=Macbook');
    await page.screenshot({ path: 'example.png' });
    // Wait for 10 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
    }
)();
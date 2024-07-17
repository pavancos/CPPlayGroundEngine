const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: false, // Launches the browser in non-headless mode so you can see it
        defaultViewport: null, // Uses the default viewport size
        userDataDir: './tmp', // Sets a directory for storing user data
    });
    const page = await browser.newPage();
    await page.goto('https://www.codechef.com/users/pavankc');

    // Selects elements based on the provided CSS selector
    const wrapBox = await page.$$(
        'body > main > div > div > div > div > div > section.rating-data-section.problems-solved'
    );
    for(const box of wrapBox){
        // select the text content of element whoose class is "content"
        const text = await box.$eval('.content', node => node.textContent);
        console.log(text);
    }
    // Iterate throught all the children of wrapBox and get the text content of each element whose selector is "div.content>h5>p>span"
    for (const box of wrapBox) {
        const text = await box.$eval('.content>p', node => node.textContent);
        console.log(text);
    }

    // It's good practice to close the browser when you're done
    // await browser.close();
})();
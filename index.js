const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true, // Launches the browser in non-headless mode so you can see it
        defaultViewport: null, // Uses the default viewport size
        userDataDir: './tmp', // Sets a directory for storing user data
    });
    const page = await browser.newPage();
    await page.goto('https://www.codechef.com/users/pavankc');

    // Selects elements based on the provided CSS selector
    const wrapBox = await page.$$(
        'body > main > div > div > div > div > div > section.rating-data-section.problems-solved'
    );

    for (const box of wrapBox) {
        const contestTile = await box.$$eval('.content>h5', nodes => nodes.map(node => node.textContent));
        const solvedProblems = await box.$$eval('.content>p', nodes => nodes.map(node => node.textContent));
        const contests = [];
        for (let i = 0; i < contestTile.length; i++) {
            contests.push({
                contest: contestTile[i],
                problems: solvedProblems[i].split(',').length,
            });
        }
        console.log(contests);
    }

    await browser.close();
})();
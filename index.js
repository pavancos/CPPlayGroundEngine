const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: false, // Launches the browser in headless mode
        defaultViewport: null, // Uses the default viewport size
        userDataDir: './tmp', // Sets a directory for storing user data
    });

    // CodeChef data
    const scrapeCodeChef = async (page) => {
        await page.goto('https://www.codechef.com/users/siddharthasai');

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
                    contest: contestTile[i].split(' Division')[0],
                    problems: solvedProblems[i].split(',').length,
                    division: contestTile[i].split('Division ')[1].split(' ')[0],
                });
            }
            console.log('CodeChef Contests:', contests);
        }
    };

    // SPOJ data
    const scrapeSPOJ = async (page) => {
        await page.goto('https://www.spoj.com/status/vvsv/');

        // Selects elements based on the provided CSS selector
        const rows = await page.$$eval('table.problems tbody tr', rows => {
            return rows.map(row => {
                const columns = row.querySelectorAll('td');

                // Return if the result is accepted
                if (columns[3].textContent.trim() == 'accepted') {
                    return {
                        date: columns[1].textContent.trim().split(' ')[0],
                        problem: columns[2].textContent.trim(),
                    };
                }
                return null; 
            }).filter(row => row !== null);
        });
        console.log('SPOJ Submissions:', rows);
    };

    const page = await browser.newPage();
    
    // Scrape data from CodeChef
    await scrapeCodeChef(page);

    // Scrape data from SPOJ
    await scrapeSPOJ(page);

    await browser.close();
})();

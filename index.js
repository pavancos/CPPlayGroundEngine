const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 3000;

const launchBrowser = async () => {
    return await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        userDataDir: './tmp',
    });
};

// Scrape CodeChef data
const scrapeCodeChef = async (username) => {
    const browser = await puppeteer.launch({executablePath: '/opt/render/.cache/puppeteer/chrome/linux-126.0.6478.182/chrome-linux64/chrome'});
    const page = await browser.newPage();
    await page.goto(`https://www.codechef.com/users/${username}`);

    const wrapBox = await page.$$(
        'body > main > div > div > div > div > div > section.rating-data-section.problems-solved'
    );

    const contests = [];
    for (const box of wrapBox) {
        const contestTile = await box.$$eval('.content>h5', nodes => nodes.map(node => node.textContent));
        const solvedProblems = await box.$$eval('.content>p', nodes => nodes.map(node => node.textContent));
        for (let i = 0; i < contestTile.length; i++) {
            contests.push({
                contest: contestTile[i].split(' Division')[0],
                problems: solvedProblems[i].split(',').length,
                division: contestTile[i].split('Division ')[1].split(' ')[0],
            });
        }
    }
    // const allRating = await page.evaluate(() => {
    //     // I want select know the index of the string "var all_rating= " in the page, its in script
    //     const scripts = Array.from(document.querySelectorAll('script')).map(script => script.innerText);
    //     const allRatingScript = scripts.find(script => script.includes('var all_rating='));
    //     const start = allRatingScript.indexOf('[');
    //     const end = allRatingScript.indexOf('];');
    //     const allRating = JSON.parse(allRatingScript.slice(start, end + 1));
    // });

    await browser.close();
    return { contests };
};

// Scrape SPOJ data
const scrapeSPOJ = async (username) => {
    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto(`https://www.spoj.com/status/${username}/`);
    

    const rows = await page.$$eval('table.problems tbody tr', rows => {
        return rows.map(row => {
            const columns = row.querySelectorAll('td');

            if (columns[3].textContent.trim() == 'accepted') {
                
                
                return {
                    date: columns[1].textContent.trim().split(' ')[0],
                    problem: columns[2].textContent.trim()
                };
            }
            return null;
        }).filter(row => row !== null);
    });

    await browser.close();
    return rows;
};

// Define the /codechef endpoint
app.get('/codechef/:username', async (req, res) => {
    const username = req.params.username;
    try {
        const data = await scrapeCodeChef(username);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Define the /spoj endpoint
app.get('/spoj/:username', async (req, res) => {
    const username = req.params.username;
    try {
        const data = await scrapeSPOJ(username);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

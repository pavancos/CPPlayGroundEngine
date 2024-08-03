const express = require('express');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

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
    const browser = await launchBrowser();
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
    

    await browser.close();
    return { contests };
};
// Returns the all_rating object of the user
const getAllRating= async(username)=>{
    try{
        let res = await fetch(`https://www.codechef.com/users/${username}`);
        const text = await res.text();
        const allRatingIndex = text.indexOf('var all_rating =');
        const endPoint = text.indexOf(';',allRatingIndex);
        // console.log(text.substring(allRatingIndex+16,endPoint));
        return JSON.parse(text.substring(allRatingIndex+16,endPoint));
    }catch(err){
        console.log(err);
    }
}
// Returns the Data of Contests of the user 
const getDataofContests = async (username) => {
    try {
        let res = await fetch(`https://www.codechef.com/users/${username}`);
        const html = await res.text();
        const $ = cheerio.load(html);
        const contentData = [];
        $('div.content').each((index, element) => {
            const name = $(element).find('h5 > span').html();
            const problems = [];
            
            $(element).find('p > span > span').each((i, el) => {
                problems.push($(el).html());
            });
            if(name != null){
                contentData.push({
                    name: name,
                    problems: problems,
                    noOfProblems: problems.length
                });
            }
        });
        return contentData;
    }catch(err){
        console.log(err);
    }
}

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

app.get('/codechef/:username/rating', async (req, res) => {
    const username = req.params.username;
    try {
        const data = await getAllRating(username);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



app.get('/codechef/:username/contests', async (req, res) => {
    const username = req.params.username;
    try {
        const data = await getDataofContests(username);
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
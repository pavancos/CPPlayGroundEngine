const express = require('express');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const app = express();
const PORT = 8888;

const launchBrowser = async () => {
    return await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        userDataDir: './tmp',
    });
};

// Scrape CodeChef data
const scrapeCodeChef = async (username) => {
    try {
        let res = await fetch(`https://www.codechef.com/users/${username}`, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Referer': 'https://www.codechef.com/',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        });
        const html = await res.text();
        const allRatingIndex = html.indexOf('var all_rating =');
        const endPoint = html.indexOf(';',allRatingIndex);
        let allRating = JSON.parse(html.substring(allRatingIndex+16,endPoint));
        
        const $ = cheerio.load(html);
        const contentData = [];
        $('div.content').each((index, element) => {
            const name = $(element).find('h5 > span').html();
            const problems = [];
            
            $(element).find('p > span > span').each((i, el) => {
                problems.push($(el).html());
            });
            if(name != null && name.split(" ")[0] == "Starters" ){
                contentData.push({
                    name: name,
                    code: name.split(' ')[1],
                    problems: problems,
                    noOfProblems: problems.length
                });
            }
        });
        let dataofSolvedProblems = contentData;
        let newAllRating = allRating.map((rating)=>{
            if(rating.name.split(' ')[0] =='Starters'){
                // console.log(rating.name)
                let details = dataofSolvedProblems.find((data)=>data.name == rating.name);
                if(details != undefined ){
                    return {
                        ...rating,
                        problemsSolved : details.problems,
                        noOfProblems: details.noOfProblems
                    }
                }
            }
        })
        return newAllRating;
    }catch(err){
        console.log(err);
    }
    
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
            if(name != null && name.split(" ")[0] == "Starters" ){
                contentData.push({
                    name: name,
                    code: name.split(' ')[1],
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


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
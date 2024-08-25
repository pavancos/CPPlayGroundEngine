const express = require('express');
const cheerio = require('cheerio');

const app = express();
const PORT = 3000;


// Scrape AtCoder data
const scrapeAtCoder = async (username) => {
    const url = `https://atcoder.jp/users/${username}/history?contestType=algo`;
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    let contests = [];
    $('#history tbody tr').each((index, element) => {
        const date = $(element).find('td').eq(0).text();
        const name = $(element).find('td').eq(1).text().trim();
        const rank = $(element).find('td').eq(2).text();

        contests.push({
            date,
            name,
            rank
        });
    });

    contests = contests.reverse();

    console.log('contests: ', contests);
    return { contests };
};

// Returns the all_rating object of the user
const getAllRating = async (username) => {
    try {
        let res = await fetch(`https://www.codechef.com/users/${username}`);
        const text = await res.text();
        const allRatingIndex = text.indexOf('var all_rating =');
        const endPoint = text.indexOf(';', allRatingIndex);
        return JSON.parse(text.substring(allRatingIndex + 16, endPoint));
    } catch (err) {
        console.log(err);
    }
};

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
            if (name != null) {
                contentData.push({
                    name: name,
                    problems: problems,
                    noOfProblems: problems.length
                });
            }
        });
        return contentData;
    } catch (err) {
        console.log(err);
    }
};
const scrapeCodechefProblems = async (username) => {
    const url = `https://www.codechef.com/users/${username}`;
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    const problemsSolved = $('section.rating-data-section.problems-solved > h3').text().trim();
    return problemsSolved;
}

// Scrape SPOJ data
const scrapeSPOJ = async (username) => {
    const url = `https://www.spoj.com/users/${username}/`;
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    let problems = [];
    $('table.table.table-condensed tr').each((index, element) => {
        if (index === 0)
            return;
        const col = $(element).find('td');

        const problemName = $(col[0]).text().trim();
        // const submissions = $(col[4]).text().trim();

        problems.push({
            problem: problemName,
            // submissions: submissions
        });
    });
    return problems;
};

// Define the /codechef endpoint

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

// Codechef Total Problems Solved 
app.get('/codechef/:username/problems', async (req, res) => {
    const username = req.params.username;
    try {
        const data = await scrapeCodechefProblems(username);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Define the /spoj endpoint
app.get('/spoj/:username/problems', async (req, res) => {
    const username = req.params.username;
    try {
        const data = await scrapeSPOJ(username);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Define the /atcoder endpoint
app.get('/atcoder/:username/contests', async (req, res) => {
    const username = req.params.username;
    try {
        const data = await scrapeAtCoder(username);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Leetcode : Getting data of contests
async function fetchLeetCodeContestsData(username) {
    const url = 'https://leetcode.com/graphql';
    const query = `
        query getUserContestRanking ($username: String!) {
            userContestRanking(username: $username) {
                attendedContestsCount
                rating
                globalRanking
                totalParticipants
                topPercentage
                badge {
                    name
                }
            }
            userContestRankingHistory(username: $username) {
                attended
                rating
                ranking
                trendDirection
                problemsSolved
                totalProblems
                finishTimeInSeconds
                contest {
                    title
                    startTime
                }
            }
        }
    `;
    const variables = { username };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json',
                'Referer': 'https://leetcode.com/',
                'Origin': 'https://leetcode.com'
            },
            body: JSON.stringify({
                query,
                variables,
            }),
        });

        const data = await response.json();
        if (data.data && data.data.userContestRankingHistory) {
            data.data.userContestRankingHistory = data.data.userContestRankingHistory.filter(contest => contest.attended);
            data.data.userContestRankingHistory.reverse();
        }
        return { username, data: data.data };
    } catch (error) {
        console.error(`Failed to fetch data for ${username}:`, error);
        return { username, error: error.message };
    }
}

// Define a route to fetch LeetCode data
app.get('/leetcode/:username/contests', async (req, res) => {
    const username = req.params.username;
    const data = await fetchLeetCodeContestsData(username);
    res.json(data);
});


// Leetcode : Getting data of Number of Problems Slolved
async function fetchLeetCodeProblemsData(username) {
    const url = 'https://leetcode.com/graphql';
    const query = `
        query userProblemsSolved($username: String!) {
            allQuestionsCount {
                difficulty
                count
            }
            matchedUser(username: $username) {
                problemsSolvedBeatsStats {
                    difficulty
                    percentage
                }
                submitStatsGlobal {
                    acSubmissionNum {
                        difficulty
                        count
                    }
                }
            }
        }
    `;
    const variables = { username };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json',
                'Referer': 'https://leetcode.com/',
                'Origin': 'https://leetcode.com'
            },
            body: JSON.stringify({
                query,
                variables,
            }),
        });

        const data = await response.json();


        return { username, data: data.data };
    } catch (error) {
        console.error(`Failed to fetch data for ${username}:`, error);
        return { username, error: error.message };
    }
}


// Define the /leetcode/:username/problems endpoint
app.get('/leetcode/:username/problems', async (req, res) => {
    const username = req.params.username;
    try {
        const data = await fetchLeetCodeProblemsData(username);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Codeforeces: Get the data of Submission of the user
const fetchCodeforcesData = async (username) => {
    const url = `https://codeforces.com/api/user.status?handle=${username}`;
    const response = await fetch(url);
    let data = await response.json();
    data = data.result.filter(submission => submission.verdict === 'OK');
    return data;
};

// Codeforeces: /codeforces/:username/problems endpoint
app.get('/codeforces/:username/problems', async (req, res) => {
    const username = req.params.username;
    try {
        const data = await fetchCodeforcesData(username);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const fetchCodeforcesContest = async (username) =>{
    const url = `https://codeforces.com/api/user.rating?handle=${username}`;
    const response = await fetch(url);
    let data = await response.json();
    data = data.result.reverse();
    return data;
}

app.get('/codeforces/:username/contests',async (req,res)=>{
    const username = req.params.username;
    try{
        const data = await fetchCodeforcesContest(username);
        res.json(data);
    }catch(error){
        res.status(500).json({error:error.message});
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

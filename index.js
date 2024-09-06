const express = require('express');
const cheerio = require('cheerio');
const app = express();
const cors = require('cors');
app.use(cors({ origin: '*' }));
const PORT = process.env.PORT || 3000;
const fs = require('fs');


app.get('/', (req, res) => {
    res.send('CP PlayGround Engine');
});


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
    // console.log('contests: ', contests);
    return { contests, username };
};

// Returns the all_rating object of the user
const getCodeChefData = async (username) => {
    try {
        let res = await fetch(`https://www.codechef.com/users/${username}`);
        const text = await res.text();
        const $ = cheerio.load(text);
        const allRatingIndex = text.indexOf('var all_rating =');
        console.log('allRatingIndex: ', allRatingIndex);
        const endPoint = text.indexOf(';', allRatingIndex);
        // fs.writeFile('data.txt', text,(err)=>{
        //     if(err){
        //         console.log(err,err.message);
        //     }
        // });
        // handle the case when user is not found
        if(allRatingIndex===-1){
            let data = {
                username: username,
                contests: [],
                problemsSolved: null,
                message:'Username does not exist'
            };
            return data;
        }
        

        let retingData = JSON.parse(text.substring(allRatingIndex + 16, endPoint));
        console.log('retingData: ', retingData);

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
        const problemsSolved = $('section.rating-data-section.problems-solved > h3').text().trim();

        // Merge Contest data and Rating data by using the name of the contest
        let fullContestData = [];
        for (let i = 0; i < retingData.length; i++) {
            let contestData = contentData.find((data) => data.name === retingData[i].name);
            if (contestData) {
                retingData[i].problems = contestData.problems;
                retingData[i].noOfProblems = contestData.noOfProblems;
                fullContestData.push(retingData[i]);
            }
        }
        fullContestData = fullContestData.reverse();
        console.log('fullContestData: ', fullContestData);

        let data = {
            username: username,
            contests: fullContestData,
            problemsSolved: problemsSolved
        };
        return data;
    } catch (err) {
        console.log(err);
    }
};


// Scrape SPOJ data
const scrapeSPOJ = async (username) => {
    const url = `https://www.spoj.com/status/${username}/`;
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    let problems = [];

    $('tr').each((index, element) => {
        if (index === 0) return; // Skip the header row

        const col = $(element).find('td');
        const status = $(col[3]).text().trim(); // The status column (Accepted, Wrong Answer, etc.)

        if (status === "accepted") {
            const problemName = $(col[2]).text().trim(); // The problem name column
            const submissionDate = $(col[1]).text().trim(); // The submission date column

            problems.push({
                problem: problemName,
                submissionDate: submissionDate
            });
        }
    });

    return problems;
};
// Define the /codechef endpoint

app.get('/codechef/:username', async (req, res) => {
    const username = req.params.username;
    try {
        const data = await getCodeChefData(username);
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

// Define the /atcoder endpoint
app.get('/atcoder/:username', async (req, res) => {
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
        console.log(data)
        if(data.errors){
            return {
                username: username,
                error:`${username} does not exist`
            }
        }
        if(data.data.userContestRanking===null){
            return {
                username: username,
                error:`${username} did not participate in any contest`
            }
        }
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
app.get('/leetcode/:username', async (req, res) => {
    const username = req.params.username;
    const data = await fetchLeetCodeContestsData(username);
    res.json(data);
});


// Codeforeces: Get the data of Submission of the user
const fetchCodeforcesData = async (username) => {
    const url = `https://codeforces.com/api/user.status?handle=${username}`;
    const response = await fetch(url);
    let data = await response.json();
    console.log('data: ', data);
    if(data.status === 'FAILED') {
        return [];
    }
    data = data.result.filter(submission => submission.verdict === 'OK');
    return data;
};
const fetchCodeforcesContest = async (username) => {
    const url = `https://codeforces.com/api/user.rating?handle=${username}`;
    const response = await fetch(url);
    let data = await response.json();
    if(data.status === 'FAILED') {
        return [];
    }
    data = data.result.reverse();
    return data;
}

// Codeforeces: /codeforces/:username/problems endpoint
app.get('/codeforces/:username', async (req, res) => {
    const username = req.params.username;
    try {
        const data = await fetchCodeforcesData(username);
        const contestsData = await fetchCodeforcesContest(username);
        let codeforcesData = {
            username: username,
            problems: data,
            contests: contestsData
        };
        res.json(codeforcesData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// get data of all platforms of a user
app.get('/all', async (req, res) => {
    const { codechef, spoj, atcoder, leetcode, codeforces } = req.query;

    try {
        let codechefData = [];
        if (codechef !== '')
            codechefData = await getCodeChefData(codechef);

        let spojData = [];
        if (spoj !== '')
            spojData = await scrapeSPOJ(spoj);

        let atcoderData = [];
        if (atcoder !== '')
            atcoderData = await scrapeAtCoder(atcoder);

        let leetcodeData = [];
        if (leetcode !== '')
            leetcodeData = await fetchLeetCodeContestsData(leetcode);

        let codeforcesProblems = [];
        let codeforcesContests = [];
        let codeforcesData = [];
        if (codeforces !== '') {
            codeforcesProblems = await fetchCodeforcesData(codeforces);
            codeforcesContests = await fetchCodeforcesContest(codeforces);
            codeforcesData = {
                username: codeforces,
                problems: codeforcesProblems,
                contests: codeforcesContests
            }
        }

        const data = {
            codechef: codechefData,
            spoj: spojData,
            atcoder: atcoderData,
            leetcode: leetcodeData,
            codeforces: codeforcesData
        };
        res.json(data);

    } catch (error) {
        res.status(500).json({ error: error.message, stack: error.stack });
    }
    console.log('codechef: ', codechef);
    console.log('spoj: ', spoj);
    console.log('atcoder: ', atcoder);
    console.log('leetcode: ', leetcode);
    console.log('codeforces: ', typeof (codeforces));
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

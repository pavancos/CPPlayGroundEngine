
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

# scraping
Using [puppeteer](https://www.npmjs.com/package/puppeteer)
## function:
1. Opens the browser ( Chrome incase of puppeteer , Chromium incase of puppeteer-core ).
2. Navigates to the user's profile.
3. Scrapes the data from it but using built-ins in puppeteer ($eval, evaluate methods).
4. Returns the data of the contests at `/codechef/<user-name>` endpoint.

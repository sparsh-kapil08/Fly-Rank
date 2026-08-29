const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");

const baseUrl = "https://books.toscrape.com/";
const cacheDir = path.join(__dirname, "../cache");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getPage(url, pageNumber) {
  const cacheFile = path.join(
    cacheDir,
    `catalogue-page-${pageNumber}.html`
  );

  if (fs.existsSync(cacheFile)) {
    console.log(`CACHE HIT page ${pageNumber}`);
    return fs.readFileSync(cacheFile, "utf8");
  }


  if (pageNumber > 1) {
    await sleep(500);
  }

  console.log(`FETCH page ${pageNumber}`);

  const response = await axios.get(url, {
    timeout: 5000,
    headers: {
      "User-Agent":
        "FlyRankInternshipA9/1.0 (+https://github.com/YOUR_USERNAME/YOUR_REPO)",
    },
  });

  if (response.status !== 200) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cacheFile, response.data);

  return response.data;
}

async function main() {
  let pageUrl = baseUrl;
  let pageNumber = 1;
  const bookUrls = new Set();

  while (pageNumber <= 3) {
    const html = await getPage(pageUrl, pageNumber);
    const $ = cheerio.load(html);

    // Find every book link on this catalogue page
    $("article.product_pod h3 a").each((_, element) => {
      const href = $(element).attr("href");

      if (href) {
        const absoluteUrl = new URL(href, pageUrl).href;
        bookUrls.add(absoluteUrl);
      }
    });

    // Find the catalogue's own "next" link
    const nextLink = $("li.next a").attr("href");

    if (!nextLink || pageNumber === 3) {
      break;
    }


    pageUrl = new URL(nextLink, pageUrl).href;
    pageNumber++;
  }

  console.log(`catalogue_pages=${pageNumber}`);
  console.log(`discovered=${bookUrls.size}`);
  console.log(`unique_urls=${bookUrls.size}`);
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});


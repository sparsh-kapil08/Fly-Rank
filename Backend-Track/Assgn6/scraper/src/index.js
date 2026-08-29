const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");

const baseUrl = "https://books.toscrape.com/";
const cacheDir = path.join(__dirname, "../cache");
const bookCacheDir = path.join(cacheDir, "books");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getPage(url, cacheFile) {
  // Use cache if available
  if (fs.existsSync(cacheFile)) {
    return {
      html: fs.readFileSync(cacheFile, "utf8"),
      cached: true,
    };
  }

  // Polite delay before a real request
  await sleep(500);

  const response = await axios.get(url, {
    timeout: 5000,
    headers: {
      "User-Agent":
        "FlyRankInternshipA9/1.0 (+https://github.com/sparsh-kapil08/Fly-Rank)",
    },
  });

  // Only accept successful responses
  if (response.status !== 200) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
  fs.writeFileSync(cacheFile, response.data);

  return {
    html: response.data,
    cached: false,
  };
}

async function findBookUrls() {
  let pageUrl = baseUrl;
  const bookUrls = new Set();

  for (let pageNumber = 1; pageNumber <= 3; pageNumber++) {
    const cacheFile = path.join(
      cacheDir,
      `catalogue-page-${pageNumber}.html`
    );

    const { html } = await getPage(pageUrl, cacheFile);
    const $ = cheerio.load(html);

    $("article.product_pod h3 a").each((_, element) => {
      const href = $(element).attr("href");

      if (href) {
        bookUrls.add(new URL(href, pageUrl).href);
      }
    });

    const nextLink = $("li.next a").attr("href");

    if (!nextLink || pageNumber === 3) {
      break;
    }

    pageUrl = new URL(nextLink, pageUrl).href;
  }

  return [...bookUrls];
}

function extractBook(html, productUrl, sourcePage) {
  const $ = cheerio.load(html);

  const title = $("div.product_main h1").text().trim() || null;

  const priceText =
    $("div.product_main .price_color").first().text().trim() || null;

  const availabilityText =
    $("div.product_main .availability").text().replace(/\s+/g, " ").trim() ||
    null;

  const ratingText =
    $("div.product_main .star-rating").attr("class")?.replace("star-rating", "").trim() ||
    null;

  const descriptionElement = $("#product_description").next("p");

  const description = descriptionElement.length
    ? descriptionElement.text().trim() || null
    : null;

  return {
    title,
    product_url: productUrl,
    price_text: priceText,
    availability_text: availabilityText,
    rating_text: ratingText,
    description,
    source_page: sourcePage,
    fetched_at: new Date().toISOString(),
  };
}

async function main() {
  const bookUrls = await findBookUrls();
  const records = [];

  for (let i = 0; i < bookUrls.length; i++) {
    const productUrl = bookUrls[i];

    const filename = `book-${i + 1}.html`;
    const cacheFile = path.join(bookCacheDir, filename);

    const { html, cached } = await getPage(productUrl, cacheFile);

    if (cached) {
      console.log(`CACHE HIT ${i + 1}/60`);
    } else {
      console.log(`FETCH ${i + 1}/60`);
    }

    // The catalogue page containing this book
    const sourcePage =
      i < 20
        ? "https://books.toscrape.com/catalogue/page-1.html"
        : i < 40
        ? "https://books.toscrape.com/catalogue/page-2.html"
        : "https://books.toscrape.com/catalogue/page-3.html";

    const record = extractBook(html, productUrl, sourcePage);

    records.push(record);
  }

  console.log(`detail_pages=${records.length}`);

  console.log("\nFirst raw record:");
  console.log(JSON.stringify(records[0], null, 2));
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});

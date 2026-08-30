const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
const { z } = require("zod");

const BASE_URL = "https://books.toscrape.com/";
const CACHE_DIR = path.join(__dirname, "../cache");
const BOOK_CACHE_DIR = path.join(CACHE_DIR, "books");
const OUTPUT_DIR = path.join(__dirname, "../output");

const BOOKS_FILE = path.join(OUTPUT_DIR, "books.json");
const ERRORS_FILE = path.join(OUTPUT_DIR, "errors.json");

const USER_AGENT =
  "FlyRankInternshipA9/1.0 (+https://github.com/sparsh-kapil08/Fly-Rank)";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/*
  Stage 4 record schema
*/
const bookSchema = z.object({
  title: z.string().min(1),
  product_url: z
    .string()
    .url()
    .refine((url) => url.startsWith("https://")),
  price_text: z.string().min(1),
  price_gbp: z.number(),
  availability_text: z.string().nullable(),
  rating_text: z.string().nullable(),
  description: z.string().nullable(),
  source_page: z.string().url(),
  fetched_at: z.string().datetime(),
});

/*
  Read cached book page
  or download it if it doesn't exist.
*/
async function getBookPage(url, cacheFile) {
  if (fs.existsSync(cacheFile)) {
    return fs.readFileSync(cacheFile, "utf8");
  }

  await sleep(500);

  const response = await axios.get(url, {
    timeout: 5000,
    headers: {
      "User-Agent": USER_AGENT,
    },
  });

  if (response.status !== 200) {
    throw new Error(`HTTP ${response.status}`);
  }

  fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
  fs.writeFileSync(cacheFile, response.data);

  return response.data;
}

/*
  Convert:
  "£51.77"
  into:
  51.77
*/
function parsePrice(priceText) {
  const number = parseFloat(priceText.replace("£", ""));

  if (Number.isNaN(number)) {
    return null;
  }

  return number;
}

/*
  Extract and normalize one book.
*/
function extractBook(html, productUrl, sourcePage) {
  const $ = cheerio.load(html);

  const title =
    $("div.product_main h1").text().trim() || null;

  const priceText =
    $("div.product_main .price_color").first().text().trim() || null;

  const availabilityText =
    $("div.product_main .availability")
      .text()
      .replace(/\s+/g, " ")
      .trim() || null;

  const ratingText =
    $("div.product_main .star-rating")
      .attr("class")
      ?.replace("star-rating", "")
      .trim() || null;

  const descriptionElement =
    $("#product_description").next("p");

  const description =
    descriptionElement.length
      ? descriptionElement.text().trim() || null
      : null;

  return {
    title,
    product_url: productUrl,
    price_text: priceText,
    price_gbp: priceText ? parsePrice(priceText) : null,
    availability_text: availabilityText,
    rating_text: ratingText,
    description,
    source_page: sourcePage,
    fetched_at: new Date().toISOString(),
  };
}

/*
  Get the 60 book URLs from the cached catalogue pages.
*/
function getBookUrls() {
  const books = new Map();

  for (let page = 1; page <= 3; page++) {
    const file = path.join(
      CACHE_DIR,
      `catalogue-page-${page}.html`
    );

    const html = fs.readFileSync(file, "utf8");
    const $ = cheerio.load(html);

    $("article.product_pod h3 a").each((_, element) => {
      const href = $(element).attr("href");

      if (!href) return;

      const productUrl = new URL(href, BASE_URL).href;

      // product_url is the identity
      if (!books.has(productUrl)) {
        books.set(productUrl, {
          productUrl,
          sourcePage: new URL(
            `catalogue/page-${page}.html`,
            BASE_URL
          ).href,
        });
      }
    });
  }

  return [...books.values()];
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const books = getBookUrls();

  const validRecords = [];
  const errors = [];

  for (let i = 0; i < books.length; i++) {
    const { productUrl, sourcePage } = books[i];

    try {
      const cacheFile = path.join(
        BOOK_CACHE_DIR,
        `book-${i + 1}.html`
      );

      const html = await getBookPage(
        productUrl,
        cacheFile
      );

      const record = extractBook(
        html,
        productUrl,
        sourcePage
      );

      const result = bookSchema.safeParse(record);

      if (!result.success) {
        errors.push({
          product_url: productUrl,
          reason: result.error.issues
            .map((issue) => issue.message)
            .join(", "),
        });

        continue;
      }

      validRecords.push(result.data);
    } catch (error) {
      errors.push({
        product_url: productUrl,
        reason: error.message,
      });
    }
  }

  fs.writeFileSync(
    BOOKS_FILE,
    JSON.stringify(validRecords, null, 2)
  );

  fs.writeFileSync(
    ERRORS_FILE,
    JSON.stringify(errors, null, 2)
  );

  console.log(`valid_records=${validRecords.length}`);
  console.log(`invalid_records=${errors.length}`);
}

main().catch((error) => {
  console.error(error.message);
});


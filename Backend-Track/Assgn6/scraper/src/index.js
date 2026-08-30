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
const REPORT_FILE = path.join(OUTPUT_DIR, "run-report.json");

const USER_AGENT =
  "FlyRankInternshipA9/1.0 (+https://github.com/sparsh-kapil08/Fly-Rank)";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  Fetch a book page.

  Retry once only for:
  - timeout
  - 5xx server errors

  Do not retry:
  - 403
  - 404
*/
async function getBookPage(url, cacheFile, report) {
  // Cache hit
  if (fs.existsSync(cacheFile)) {
    report.cache_hits++;

    return {
      html: fs.readFileSync(cacheFile, "utf8"),
      cached: true,
    };
  }

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      // Polite delay before every real request
      await sleep(500);

      report.pages_fetched++;

      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          "User-Agent": USER_AGENT,
        },
        validateStatus: () => true,
      });

      // Never retry 403 or 404
      if (response.status === 403) {
        throw new Error("HTTP 403");
      }

      if (response.status === 404) {
        throw new Error("HTTP 404");
      }

      // Retry 5xx once
      if (response.status >= 500 && response.status <= 599) {
        if (attempt === 1) {
          console.log(`RETRY ${url}`);
          await sleep(1000);
          continue;
        }

        throw new Error(`HTTP ${response.status}`);
      }

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }

      fs.mkdirSync(path.dirname(cacheFile), {
        recursive: true,
      });

      fs.writeFileSync(
        cacheFile,
        response.data,
        "utf8"
      );

      return {
        html: response.data,
        cached: false,
      };
    } catch (error) {
      const status = error.response?.status;

      const isTimeout =
        error.code === "ECONNABORTED" ||
        error.code === "ETIMEDOUT";

      const isServerError =
        status >= 500 && status <= 599;

      // Retry timeout once
      if (
        (isTimeout || isServerError) &&
        attempt === 1
      ) {
        console.log(`RETRY ${url}`);
        await sleep(1000);
        continue;
      }

      throw error;
    }
  }

  throw new Error("Request failed");
}

/*
  Extract a book from its HTML.
*/
function extractBook(html, productUrl, sourcePage) {
  const $ = cheerio.load(html);

  const title =
    $("div.product_main h1").text().trim() || null;

  const priceText =
    $("div.product_main .price_color")
      .first()
      .text()
      .trim() || null;

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

  const priceGbp = priceText
    ? parseFloat(priceText.replace("£", ""))
    : null;

  return {
    title,
    product_url: productUrl,
    price_text: priceText,
    price_gbp: Number.isNaN(priceGbp)
      ? null
      : priceGbp,
    availability_text: availabilityText,
    rating_text: ratingText,
    description,
    source_page: sourcePage,
    fetched_at: new Date().toISOString(),
  };
}

/*
  Get the unique 60 book URLs from the
  three cached catalogue pages.
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

    $("article.product_pod h3 a").each(
      (_, element) => {
        const href = $(element).attr("href");

        if (!href) return;

        const productUrl =
          new URL(href, BASE_URL).href;

        if (!books.has(productUrl)) {
          books.set(productUrl, {
            productUrl,
            sourcePage: new URL(
              `catalogue/page-${page}.html`,
              BASE_URL
            ).href,
          });
        }
      }
    );
  }

  return [...books.values()];
}

async function main() {
  const startTime = new Date();

  const report = {
    start_time: startTime.toISOString(),
    duration_seconds: 0,
    pages_fetched: 0,
    cache_hits: 0,
    valid_records: 0,
    invalid_records: 0,
    failed_pages: 0,
  };

  const validRecords = [];
  const errors = [];

  const books = getBookUrls();

  /*
    STAGE 5 TEST

    Uncomment this temporarily to test
    one failed page.

    Remove it after testing.
  */

  /*
  books.push({
    productUrl:
      "https://books.toscrape.com/catalogue/fake-book-that-does-not-exist/index.html",
    sourcePage: BASE_URL,
  });
  */

  console.log(`discovered=${books.length}`);

  /*
    Process every book independently.
    One failure does not stop the loop.
  */
  for (let i = 0; i < books.length; i++) {
    const {
      productUrl,
      sourcePage,
    } = books[i];

    const cacheFile = path.join(
      BOOK_CACHE_DIR,
      `book-${i + 1}.html`
    );

    try {
      const result = await getBookPage(
        productUrl,
        cacheFile,
        report
      );

      const record = extractBook(
        result.html,
        productUrl,
        sourcePage
      );

      const validation =
        bookSchema.safeParse(record);

      if (!validation.success) {
        report.invalid_records++;

        errors.push({
          product_url: productUrl,
          reason: validation.error.issues
            .map((issue) => issue.message)
            .join(", "),
        });

        continue;
      }

      validRecords.push(validation.data);
      report.valid_records++;
    } catch (error) {
      report.failed_pages++;

      errors.push({
        product_url: productUrl,
        reason: error.message,
      });

      console.error(
        `FAILED: ${productUrl} - ${error.message}`
      );
    }
  }

  report.duration_seconds = Number(
    (
      (Date.now() - startTime.getTime()) /
      1000
    ).toFixed(2)
  );

  fs.mkdirSync(OUTPUT_DIR, {
    recursive: true,
  });

  fs.writeFileSync(
    BOOKS_FILE,
    JSON.stringify(validRecords, null, 2)
  );

  fs.writeFileSync(
    ERRORS_FILE,
    JSON.stringify(errors, null, 2)
  );

  fs.writeFileSync(
    REPORT_FILE,
    JSON.stringify(report, null, 2)
  );

  console.log("");
  console.log("Run complete");
  console.log(
    `valid_records=${report.valid_records}`
  );
  console.log(
    `invalid_records=${report.invalid_records}`
  );
  console.log(
    `failed_pages=${report.failed_pages}`
  );
  console.log(
    `cache_hits=${report.cache_hits}`
  );
  console.log(
    `pages_fetched=${report.pages_fetched}`
  );
}
  
main().catch((error) => {
  console.error("Fatal error:", error.message);
});


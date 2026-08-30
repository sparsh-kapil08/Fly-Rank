# Books to Scrape - Web Scraper

## Target Classification

**Target:** Books to Scrape
**URL:** https://books.toscrape.com/

Books to Scrape is a sandbox website specifically created for practising web scraping.

### Scope

This scraper processes only the first **3 catalogue pages** and the books discovered on those pages.

It collects:

* `title`
* `product_url`
* `price_text`
* `price_gbp`
* `availability_text`
* `rating_text`
* `description`
* `source_page`
* `fetched_at`

I will not reuse this code on another site without checking its rules and terms first.

### Robots.txt

I checked:

`https://books.toscrape.com/robots.txt`

**Result:** 404 not found

---

## Lane

**Backend Track - Node.js**

### Requirements

* Node.js
* npm

Docker is not required for this scraper.

---

## Installation

From the `scraper/` directory:

```bash
npm install
```

---

## Run

The complete scraper can be run with:

```bash
node src/index.js
```

The scraper produces:

```text
output/books.json
output/errors.json
output/run-report.json
```

A fresh clone can install the dependencies and run the scraper with:

```bash
npm install && node src/index.js
```

---

## Record Schema

Each valid book record follows this schema:

```json
{
  "title": "A Light in the Attic",
  "product_url": "https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html",
  "price_text": "£51.77",
  "price_gbp": 51.77,
  "availability_text": "In stock (22 available)",
  "rating_text": "Three",
  "description": "...",
  "source_page": "https://books.toscrape.com/catalogue/page-1.html",
  "fetched_at": "2026-08-30T10:00:00.000Z"
}
```

The record is validated using Zod before being written to `books.json`.

`price_text` preserves the original value, while `price_gbp` is the normalized numeric value.

`product_url` is the canonical identity of a book, and duplicate URLs are removed.

Records that fail validation are written to `errors.json` instead of `books.json`.

---

## Politeness Rules

The scraper follows these rules:

* Uses an identifying User-Agent.
* Waits at least **500 ms** between real requests.
* Uses a **5-second timeout**.
* Checks the HTTP status before processing the response.
* Caches downloaded pages locally.
* Cached pages are read from disk and do not cause another request.
* Only the first 3 catalogue pages are processed.
* Only the books discovered from those catalogue pages are processed.

The cache is stored in `cache/` and is excluded from Git.

---

## Failure Handling

Each book page is processed independently.

A failed page is logged in `errors.json` without stopping the rest of the scraper.

Timeouts and `5xx` server errors are retried once.

`403` and `404` responses are not retried.

Every run produces a `run-report.json` containing:

* start time
* duration
* pages fetched
* cache hits
* valid records
* invalid records
* failed pages

---

## Run Report

```json
{
  "start_time": "2026-08-30T09:03:39.874Z",
  "duration_seconds": 1.65,
  "pages_fetched": 0,
  "cache_hits": 60,
  "valid_records": 60,
  "invalid_records": 0,
  "failed_pages": 0
}
```

---

## Why No Browser?

This assignment does not need a browser because the required data is already present in the HTML sent by the server. Using a browser would only add unnecessary cost and complexity.

---

## Ethics

I will use an official API when one exists. I will never bypass logins, paywalls, or access blocks. I will collect only the data that is necessary for the task.

---

## Limitation

This scraper is intentionally limited to the first three catalogue pages of Books to Scrape and is not designed for large-scale crawling or use against arbitrary websites.

---

## Output

The scraper produces:

```text
output/
├── books.json
├── errors.json
└── run-report.json
```

The expected successful run contains **60 valid book records**.

```
```

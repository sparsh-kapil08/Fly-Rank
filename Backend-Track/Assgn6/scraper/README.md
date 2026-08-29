# Books to Scrape - Scraper

## Target classification

**Target:** Books to Scrape
**URL:** https://books.toscrape.com/

**Why this site:** Books to Scrape is a sandbox website created specifically for people to practise web scraping. It is therefore an appropriate target for this learning exercise.

**Scope:** Only the first 3 catalogue pages will be requested and processed. The scraper will not crawl the entire catalogue.

**Data collected:**

* Book title
* Price
* Availability
* Rating
* Product URL

**Why this is appropriate:** The target is specifically provided as a scraping practice sandbox, and the exercise is limited to a small number of catalogue pages rather than attempting large-scale collection.

## Robots.txt

I requested:

`https://books.toscrape.com/robots.txt`

**Result:** 404 Not Found nginx/1.21.6

Do not assume that a missing robots.txt file means scraping is automatically permitted. A missing file is simply a missing file.

## Responsible scraping

I will only use this scraper for the specified Books to Scrape sandbox exercise.

**I will not reuse this code on another site without checking its rules and terms first.**

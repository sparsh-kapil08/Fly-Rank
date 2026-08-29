const fs = require("fs");
const path = require("path");
const axios = require("axios");

const url = "https://books.toscrape.com/";
const cacheFile = path.join(__dirname, "../cache/Sandbox1.html");

async function main() {
  if (fs.existsSync(cacheFile)) {
    const html = fs.readFileSync(cacheFile, "utf8");

    console.log("CACHE HIT");
    console.log(`Response size: ${Buffer.byteLength(html)} bytes`);
    return;
  }

  console.log("FETCH");

  const response = await axios.get(url, {
    timeout: 5000,
    headers: {
      "User-Agent":
        "FlyRankInternshipA9/1.0 https://github.com/sparsh-kapil08/Fly-Rank",
    },
  });

  if (response.status !== 200) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const html = response.data;

  fs.mkdirSync(path.dirname(cacheFile), { recursive: true });

  fs.writeFileSync(cacheFile, html);

  console.log(`Response size: ${Buffer.byteLength(html)} bytes`);
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});


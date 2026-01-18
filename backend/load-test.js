import axios from "axios";
import { performance } from "perf_hooks";

async function runLoadTest() {
  const url = "http://localhost:3001/api/scrape";
  const urlCount = 5000;

  // Generate 5,000 sample URLs (using varied domains for realistic test)
  const domains = [
    "https://www.theatlantic.com/world/",
    "https://www.wikipedia.org/wiki/Main_Page",
    "https://github.com/trending",
    "https://news.ycombinator.com/",
  ];

  const largeUrlArray = Array.from(
    { length: urlCount },
    (_, i) => domains[i % domains.length],
  );

  console.log("\n" + "=".repeat(60));
  console.log("MEDIA SCRAPER - LOAD TEST");
  console.log("=".repeat(60));
  console.log(`Test Parameters:`);
  console.log(`   • URLs to submit: ${urlCount.toLocaleString()}`);
  console.log(`   • Target endpoint: ${url}`);
  console.log(`   • Unique domains: ${domains.length}`);
  console.log(`   • Request size: ~${(JSON.stringify({ urls: largeUrlArray }).length / 1024 / 1024).toFixed(2)}MB`);
  console.log("=".repeat(60) + "\n");

  const startTime = performance.now();
  console.log("Sending request...");

  try {
    const response = await axios.post(
      url,
      {
        urls: largeUrlArray,
      },
      {
        // Important: Ensure axios doesn't cap the request size
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      },
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log("REQUEST SUCCESSFUL\n");
    console.log("Response Details:");
    console.log(`   • Status: ${response.status} (${response.statusText})`);
    console.log(`   • Message: ${response.data.message}`);
    console.log(`   • Response time: ${(duration / 1000).toFixed(2)}s`);
    console.log(`   • Throughput: ${(urlCount / (duration / 1000)).toFixed(0)} URLs/sec`);
    console.log(`   • Request payload: ${(response.config.data.length / 1024).toFixed(2)}KB`);

    console.log("\nPerformance Metrics:");
    console.log(`   • Response time category: ${
      duration < 1000 ? "Excellent" :
      duration < 2000 ? "Good" :
      duration < 5000 ? "Acceptable" :
      "Slow"
    }`);
    
    console.log("\nNext Steps:");
    console.log("   1. Monitor backend logs: docker compose logs -f backend");
    console.log("   2. Check job queue: docker compose exec redis redis-cli");
    console.log("      → Run: LLEN bull:media-scraper:wait");
    console.log("   3. View gallery at http://localhost:5173/gallery");
    console.log("   4. Processing typically takes 5-10 minutes for 5000 URLs");
    console.log("      (depending on MAX_CONCURRENT_SCRAPES setting)");

    console.log("\n" + "=".repeat(60) + "\n");
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log("REQUEST FAILED\n");
    console.log("Error Details:");
    if (error.response) {
      console.log(`   • Status: ${error.response.status}`);
      console.log(`   • Message: ${error.response.data?.message || error.response.statusText}`);
    } else if (error.code === "ECONNREFUSED") {
      console.log(`   • Connection refused to ${url}`);
      console.log(`   • Make sure the backend is running:`);
      console.log(`     → docker compose up -d`);
      console.log(`     → or: npm run start (in backend directory)`);
    } else if (error.code === "ENOTFOUND") {
      console.log(`   • Cannot resolve hostname`);
      console.log(`   • Check your internet connection`);
    } else {
      console.log(`   • Error: ${error.message}`);
    }
    console.log(`   • Duration: ${(duration / 1000).toFixed(2)}s`);

    console.log("\n" + "=".repeat(60) + "\n");
    process.exit(1);
  }
}

runLoadTest();

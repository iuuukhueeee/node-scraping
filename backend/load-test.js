import axios from "axios";

async function runLoadTest() {
  const url = "http://localhost:3001/api/scrape";

  // Generate 5,000 sample URLs
  const largeUrlArray = Array.from(
    { length: 5000 },
    () => `https://www.theatlantic.com/world/`,
  );

  console.log(`🚀 Sending ${largeUrlArray.length} URLs to ${url}...`);
  console.time("Response Time");

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
      },
    );

    console.timeEnd("Response Time");
    console.log("✅ Status:", response.status);
    console.log("✅ Server Message:", response.data.message);
  } catch (error) {
    console.timeEnd("Response Time");
    console.error(
      "❌ Error:",
      error.response ? error.response.status : error.message,
    );
    if (error.code === "ECONNREFUSED")
      console.error("Is the server running on port 3001?");
  }
}

runLoadTest();

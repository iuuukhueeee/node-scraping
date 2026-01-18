# Load Test Documentation

This document explains the load testing setup and how to run performance tests on the Media Scraper system.

## Overview

The load test simulates submitting 5000 URLs to the scraper API simultaneously, measuring:
- Response time
- Memory usage
- Processing capacity
- Error handling

## Running the Load Test

### Prerequisites

1. Backend and Redis must be running:
```bash
docker compose up -d
# or locally
npm run start &  # in backend directory
```

2. Install dependencies (if running locally):
```bash
cd backend
npm install
```

### Execute Load Test

```bash
cd backend
node load-test.js
```

### Expected Output

```
🚀 Sending 5000 URLs to http://localhost:3001/api/scrape...
Response Time: 1234ms
✅ Status: 202
✅ Server Message: 5000 tasks queued.
```

## Metrics Explained

### Response Time
- **Time**: How long it takes the server to queue all 5000 URLs
- **Target**: < 2 seconds for 5000 URLs
- **Note**: This is just queueing time, actual scraping happens asynchronously

### Status Code
- **202 Accepted**: Request queued successfully
- **400 Bad Request**: Invalid request format
- **500 Server Error**: Internal error

## Performance Monitoring

### Monitor Processing Progress

While load test is running, check progress:

```bash
# View backend logs
docker compose logs -f backend

# Connect to Redis
redis-cli
> KEYS *        # See queued jobs
> DBSIZE        # Total entries
```

### Monitor System Resources

```bash
# Docker resource usage
docker stats backend postgres redis

# Or use system monitoring
# macOS: Activity Monitor
# Linux: htop / top
```

### Database Growth

Monitor how many media entries are created:

```bash
# Connect to database
psql -h localhost -U scraper_user -d media_scraper

# Count media entries
SELECT COUNT(*) FROM media;

# Count by type
SELECT media_type, COUNT(*) FROM media GROUP BY media_type;

# Count errors
SELECT COUNT(*) FROM media WHERE errors IS NOT NULL;
```

## Test Scenarios

### Scenario 1: Basic Load (5000 URLs)
```javascript
// In load-test.js
const largeUrlArray = Array.from(
  { length: 5000 },
  () => `https://www.theatlantic.com/world/`
);
```

### Scenario 2: Varied URLs
```javascript
const baseUrls = [
  'https://www.theatlantic.com/world/',
  'https://example.com',
  'https://www.wikipedia.org',
  'https://github.com/trending'
];

const largeUrlArray = Array.from(
  { length: 5000 },
  (_, i) => baseUrls[i % baseUrls.length]
);
```

### Scenario 3: Mixed Valid/Invalid URLs
```javascript
const validUrls = [
  'https://www.theatlantic.com/world/',
  'https://example.com'
];

const invalidUrls = [
  'not-a-url',
  'http://invalid..com',
  'ftp://old-protocol.com'
];

const largeUrlArray = Array.from(
  { length: 5000 },
  (_, i) => i % 10 < 7 ? validUrls[i % validUrls.length] : invalidUrls[i % invalidUrls.length]
);
```

## Benchmarks

Typical performance on 1 CPU, 1GB RAM:

| Metric | Value |
|--------|-------|
| Queue Time (5000 URLs) | ~1-2 seconds |
| Memory Used | ~400-500MB |
| Concurrent Jobs | 10-50 (configurable) |
| Avg Job Time | 2-5 seconds |
| Total Processing | 5-10 minutes |
| Error Rate | < 5% |

## Enhanced Load Test Script

For more detailed metrics, you can enhance `load-test.js`:

```javascript
import axios from "axios";
import { performance } from 'perf_hooks';

async function runLoadTest() {
  const url = "http://localhost:3001/api/scrape";
  const urlCount = 5000;
  
  // Generate URLs
  const largeUrlArray = Array.from(
    { length: urlCount },
    () => `https://www.theatlantic.com/world/`
  );

  console.log(`🚀 Sending ${urlCount} URLs to ${url}...`);
  const startTime = performance.now();
  console.time("Response Time");

  try {
    const response = await axios.post(
      url,
      { urls: largeUrlArray },
      {
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: { "Content-Type": "application/json" },
      }
    );

    console.timeEnd("Response Time");
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`\n📊 Results:`);
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Message: ${response.data.message}`);
    console.log(`⏱️  Total Time: ${(duration / 1000).toFixed(2)}s`);
    console.log(`📈 Throughput: ${(urlCount / (duration / 1000)).toFixed(0)} URLs/sec`);
    
  } catch (error) {
    console.timeEnd("Response Time");
    console.error(`\n❌ Error: ${error.response?.status || error.message}`);
    if (error.code === "ECONNREFUSED")
      console.error("Is the server running on port 3001?");
  }
}

runLoadTest();
```

## Analyzing Results

### Good Performance
- Response time < 2 seconds for queuing
- All 5000 URLs queued successfully
- No memory errors
- Processing starts immediately

### Areas for Optimization
- If response time > 5 seconds: Increase request body parsing limit
- If errors occur: Check Redis connection and memory
- If slow processing: Increase `MAX_CONCURRENT_SCRAPES` (monitor memory)

## Real-World Testing

For production-like testing:

1. **Test with diverse URLs**: Real websites have varying sizes/content
2. **Monitor over time**: Let jobs process for 30+ minutes
3. **Check database**: Verify all media is stored correctly
4. **Review errors**: Check what URLs fail and why

## Cleanup After Testing

```bash
# Clear database
docker compose exec postgres psql -U scraper_user -d media_scraper -c "TRUNCATE media;"

# Clear Redis
docker compose exec redis redis-cli FLUSHALL

# Or restart all services
docker compose down
docker compose up -d
```

## Troubleshooting

### "ECONNREFUSED" Error
```bash
# Check if server is running
docker compose ps

# Start if needed
docker compose up -d
```

### High Memory Usage
```bash
# Reduce concurrency
# In docker-compose.yml, change:
# MAX_CONCURRENT_SCRAPES=10  (instead of 50)

docker compose up -d --build
```

### Slow Processing
```bash
# Monitor queue depth
redis-cli
> LLEN bull:media-scraper:wait    # Waiting jobs
> LLEN bull:media-scraper:active  # Active jobs
```

## References

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Performance Tuning](https://redis.io/topics/optimization)
- [Load Testing Best Practices](https://en.wikipedia.org/wiki/Load_testing)

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
```

### Execute Load Test
Connect to backend container

```bash
npx vite-node load-test.js
```

### Expected Output

```
🚀 Sending 5000 URLs to http://localhost:3001/api/scrape
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
\c media_scraper

# Count media entries
SELECT COUNT(*) FROM "Media";

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

## Slow Processing
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

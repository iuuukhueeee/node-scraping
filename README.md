# Media Scraper

A high-performance web scraper that extracts images and videos from URLs, stores them in a database, and provides a web interface for browsing and filtering the results.

## Features

- **Async Job Queue**: Uses BullMQ with Redis for efficient processing of up to 5000 URLs
- **Web Scraping**: Extracts images and videos from HTML using Cheerio
- **Database Storage**: PostgreSQL with Prisma ORM for reliable data persistence
- **Web Gallery**: React-based frontend for browsing, filtering, and paginating media
- **Docker Support**: Complete Docker Compose setup for easy deployment
- **Performance**: Handles high concurrent loads with resource constraints (1 CPU, 1GB RAM)

## Project Structure

```
scraper/
├── backend/           # Node.js Express server
│   ├── main.ts       # API server and job queue setup
│   ├── worker.ts     # Job worker for scraping
│   ├── load-test.js  # Load testing script
│   ├── prisma/       # Database schema and migrations
│   └── Dockerfile
├── frontend/         # React + Vite application
│   ├── src/
│   │   ├── routes/
│   │   │   ├── index.tsx     # URL submission page
│   │   │   └── gallery.tsx   # Media gallery page
│   │   └── App.tsx
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Or: Node.js 22+, PostgreSQL 17+, Redis 7+

### Using Docker Compose (Recommended)

```bash
# Clone and navigate to project
cd scraper

# Start all services
docker compose up -d --build

# Wait for services to initialize (10-15 seconds)
# Check logs
docker compose logs -f backend
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Manual Setup (Local Development)

**Backend:**
```bash
cd backend
npm install
npm run start-main &      # Start API server
npm run start-worker &    # Start job worker
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Usage

### 1. Submit URLs for Scraping

Navigate to http://localhost:5173 and:
- Paste URLs (one per line)
- Supports up to 5000 URLs per request
- Click "Submit URLs"
- Server queues jobs and processes them asynchronously

### 2. Browse Results

Go to http://localhost:5173/gallery to:
- View all scraped images and videos
- Filter by media type (All, Images, Videos)
- Search by alt text
- Navigate through pages
- See processing status (OK or Error)

## API Endpoints

### POST `/api/scrape`
Submit URLs for scraping
```bash
curl -X POST http://localhost:3001/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://example.com", "https://example.com/page"]}'
```

**Response:**
```json
{ "message": "2 tasks queued." }
```

### GET `/api/media`
Retrieve scraped media
```bash
# Get all media
curl http://localhost:3001/api/media

# Filter by type
curl http://localhost:3001/api/media?media_type=image
curl http://localhost:3001/api/media?media_type=video
```

**Response:**
```json
[
  {
    "id": 1,
    "source_url": "https://example.com",
    "media_url": "https://example.com/image.jpg",
    "media_type": "image",
    "alt_text": "Sample image",
    "file_name": "image.jpg",
    "created_at": "2026-01-18T10:30:00Z",
    "errors": null
  }
]
```

## Configuration

### Environment Variables

**Backend (.env file):**
- `PORT` - Server port (default: 3001)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST` - Redis hostname (default: localhost)
- `REDIS_PORT` - Redis port (default: 6379)
- `MAX_CONCURRENT_SCRAPES` - Concurrent jobs (default: 50)
- `REQUEST_TIMEOUT` - HTTP request timeout in ms (default: 30000)

**Docker Compose:**
- Database credentials configured in `docker-compose.yml`
- Resource limits: 1 CPU, 512MB RAM for backend

## Performance

### Handling 5000 Concurrent Requests

The system is designed to handle ~5000 scraping requests with:

- **Job Queue (Redis/BullMQ)**: Queues all jobs for async processing
- **Concurrency Control**: Configurable worker concurrency (default: 50)
- **Database Optimization**: Bulk inserts for efficiency
- **Resource Limits**: Docker constraints to 512MB RAM, 1 CPU
- **Timeout Handling**: 5-second timeout per URL + error logging

### Load Testing

Run the load test to verify performance:

```bash
cd backend
node load-test.js
```

This sends 5000 URLs and measures:
- Response time
- Success/failure rate
- Memory usage
- Processing throughput

See [LOAD-TEST.md](./LOAD-TEST.md) for detailed metrics.

## Architecture

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS
- **Routing**: TanStack Router
- **Data Table**: TanStack React Table with pagination
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js with Vite-node for TypeScript
- **API**: Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Job Queue**: BullMQ + Redis
- **Scraping**: Axios + Cheerio
- **Port**: 3001

### Database
- **Type**: PostgreSQL 17
- **ORM**: Prisma
- **Schema**: `Media` table with indexed columns for performance

### Message Queue
- **Technology**: Redis + BullMQ
- **Purpose**: Async job processing and concurrency control

## Docker Services

All services run in isolated containers with network connectivity:

| Service | Image | Port | Memory | CPU |
|---------|-------|------|--------|-----|
| PostgreSQL | postgres:15-alpine | 5432 | 256MB | 1.0 |
| Redis | redis:7-alpine | 6379 | 128MB | 1.0 |
| Backend | Node 24-alpine | 3001 | 512MB | 1.0 |
| Frontend | Node 24-alpine | 5173 | 128MB | 1.0 |

## Development

### Add Dependencies

**Backend:**
```bash
cd backend
npm install <package>
```

**Frontend:**
```bash
cd frontend
npm install <package>
```

### Database Migrations

Create a migration after schema changes:
```bash
cd backend
npx prisma migrate dev --name <migration_name>
```

### View Database

Open Prisma Studio:
```bash
cd backend
npx prisma studio
```

## Troubleshooting

### Connection Refused
- Ensure Docker Compose services are running: `docker compose ps`
- Check logs: `docker compose logs backend`

### Out of Memory
- Increase Docker memory limits in `docker-compose.yml`
- Reduce `MAX_CONCURRENT_SCRAPES` value

### Database Errors
- Check PostgreSQL is healthy: `docker compose logs postgres`
- Verify DATABASE_URL is correct
- Run migrations: `npx prisma migrate deploy`

### Redis Connection Issues
- Verify Redis service is running
- Check REDIS_HOST and REDIS_PORT in backend environment

## Performance Tips

1. **Increase Concurrency**: Adjust `MAX_CONCURRENT_SCRAPES` based on available resources
2. **Bulk Operations**: Uses `createMany()` for efficient database writes
3. **Connection Pooling**: Configured with Prisma
4. **Request Timeout**: Set to 5 seconds to prevent hanging
5. **Resource Monitoring**: Docker limits ensure stable operation

## Limits

- **Max URLs per request**: 5000
- **Request timeout**: 5 seconds per URL
- **Concurrent jobs**: Configurable (default: 50)
- **Memory**: 512MB backend, 256MB database
- **CPU**: 1 core for backend

## License

ISC

## Demo

For a demo video showing the application in action, see [DEMO.md](./DEMO.md).

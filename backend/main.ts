import { Queue } from 'bullmq';

import express from 'express'
import cors from 'cors'
import { prisma } from './lib/prisma';

const app = express()
app.use(cors())
app.use((express.json({ limit: '5mb' }))) // Increase limit for 5k URLs

app.listen(process.env.PORT as unknown as number, 'localhost')
console.log(`🚀 Server running on port ${process.env.PORT}`);

const scrapeQueue = new Queue('media-scraper', {
  connection: { host: 'localhost', port: 6379 }
});


app.post('/api/scrape', async (req, res) => {
  const { urls } = req.body

  const jobs = urls.map(url => ({ name: 'scrape-task', data: { url } }));
  await scrapeQueue.addBulk(jobs);

  res.status(202).json({ message: `${urls.length} tasks queued.` });
})

app.get('/api/media', async (req, res) => {
  const mediaType = req.query.media_type as string | undefined

  const where = mediaType ? { media_type: mediaType } : {}

  const data = await prisma.media.findMany({
    where
  })

  return res.status(200).json(data)
})
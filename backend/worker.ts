import { Worker } from 'bullmq'

import axios from 'axios';
import * as cheerio from 'cheerio'
import { prisma } from './lib/prisma';

const worker = new Worker('media-scraper', async (job) => {
  const { url } = job.data;

  try {
    const { data } = await axios.get(url, { timeout: 5000 });
    const $ = cheerio.load(data);
    const results = [];

    // Extract Images
    $('img').each((_, el) => {
      const src = $(el).attr('src');
      if (src) results.push({
        source_url: url,
        media_url: new URL(src, url).href,
        media_type: 'image',
        alt_text: $(el).attr('alt') || '',
        file_name: src.split('/').pop() || 'image'
      });
    });

    // Scrape videos
    $('video source, video').each((i, elem) => {
      const src = $(elem).attr('src');
      if (src) {
        try {
          const absoluteUrl = new URL(src, url).href;
          results.push({
            source_url: url,
            media_url: absoluteUrl,
            media_type: 'video',
            file_name: src.split('/').pop().split('?')[0] || 'unknown.mp4',
            alt_text: ''
          });
        } catch (e) {
          // Invalid URL, skip
        }
      }
    });

    // Bulk save to SQL for efficiency
    if (results.length) await prisma.media.createMany({
      data: results
    })

    // if (results.length) console.log(results)

    // console.log(`process ${url} done`)

  } catch (err) {
    await prisma.media.create({
      data: {
        source_url: url,
        media_url: "",
        alt_text: "",
        file_name: "",
        media_type: "",
        errors: err.message
      }
    });
  }
}, {
  connection: { host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT) || 6379 },
  concurrency: Number(process.env.MAX_CONCURRENT_SCRAPES) // Only 10 URLs at a time to stay under 1GB RAM
})
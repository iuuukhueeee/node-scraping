import { Worker } from 'bullmq'

import axios from 'axios';
import * as cheerio from 'cheerio'

const worker = new Worker('media-scraper', async (job) => {
  const { url } = job.data;
  console.log(url.length)

  try {
    const { data } = await axios.get(url, { timeout: 5000 });
    const $ = cheerio.load(data);
    const results = [];

    // Extract Images
    $('img').each((_, el) => {
      const src = $(el).attr('src');
      if (src) results.push({
        sourceUrl: url,
        mediaUrl: new URL(src, url).href,
        mediaType: 'image',
        altText: $(el).attr('alt') || '',
        fileName: src.split('/').pop() || 'image'
      });
    });

    // Scrape videos
    $('video source, video').each((i, elem) => {
      const src = $(elem).attr('src');
      if (src) {
        try {
          const absoluteUrl = new URL(src, url).href;
          results.push({
            mediaUrl: absoluteUrl,
            mediaType: 'video',
            fileName: src.split('/').pop().split('?')[0] || 'unknown.mp4',
            altText: null
          });
        } catch (e) {
          // Invalid URL, skip
        }
      }
    });

    // Bulk save to SQL for efficiency
    // if (results.length) await Media.bulkCreate(results);

    // if (results.length) console.log(results)

    // console.log(`process ${url} done`)

  } catch (err) {
    console.log(err)
    // await Media.create({ sourceUrl: url, errors: err.message });
  }
}, {
  connection: { host: 'localhost', port: 6379 },
  concurrency: 10 // Only 10 URLs at a time to stay under 1GB RAM
})
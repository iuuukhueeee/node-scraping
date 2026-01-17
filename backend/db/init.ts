import { Pool } from 'pg'

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT as unknown as number,
  user: process.env.DB_USER,
  // password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

export const initDb = async () => {
  console.log(pool)
  const client = await pool.connect()

  try {
    console.log('📦 Initializing database...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS media (
        id SERIAL PRIMARY KEY,
        source_url TEXT NOT NULL,
        media_url TEXT NOT NULL,
        media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('image', 'video')),
        file_name VARCHAR(255),
        alt_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        errors TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_source_url ON media(source_url);
      CREATE INDEX IF NOT EXISTS idx_media_type ON media(media_type);
      CREATE INDEX IF NOT EXISTS idx_created_at ON media(created_at DESC);
    `);

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
  finally {
    client.release();
  }
}
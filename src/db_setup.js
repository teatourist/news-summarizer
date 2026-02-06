import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:Summarizer-Password-2026!@db.eesrbwtbszpkztdkpxgl.supabase.co:6543/postgres';

const sql = `
-- Create the articles table
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT NOT NULL,
    description TEXT,
    url TEXT UNIQUE NOT NULL,
    published_at TIMESTAMPTZ NOT NULL,
    source TEXT,
    content TEXT,
    summary TEXT
);

-- Enable RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read articles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read') THEN
        CREATE POLICY "Allow public read" ON public.articles FOR SELECT USING (true);
    END IF;
END
$$;

-- Allow anonymous inserts
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous insert') THEN
        CREATE POLICY "Allow anonymous insert" ON public.articles FOR INSERT WITH CHECK (true);
    END IF;
END
$$;
`;

async function setup() {
    const client = new Client({
        connectionString: connectionString,
    });
    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Running SQL setup...');
        await client.query(sql);
        console.log('Database setup complete.');
    } catch (err) {
        console.error('Setup error:', err);
    } finally {
        await client.end();
    }
}

setup();

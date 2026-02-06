import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    const newsApiKey = process.env.NEWS_API_KEY;

    if (!supabaseUrl || !supabaseKey || !newsApiKey) {
        return res.status(500).json({ error: 'Missing environment variables' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&pageSize=100&apiKey=${newsApiKey}`);
        const data = await response.json();

        if (data.status !== 'ok') {
            throw new Error(data.message || 'NewsAPI error');
        }

        const allArticles = data.articles;

        const formattedArticles = allArticles.map(a => ({
            title: a.title,
            description: a.description,
            url: a.url,
            published_at: a.publishedAt,
            source: a.source.name,
            content: a.content
        })).filter(a => a.title && a.url && a.published_at);

        // Deduplicate by URL to avoid "ON CONFLICT DO UPDATE command cannot affect row a second time"
        const uniqueArticles = Array.from(new Map(formattedArticles.map(a => [a.url, a])).values());

        const { error } = await supabase
            .from('articles')
            .upsert(uniqueArticles, { onConflict: 'url' });

        if (error) throw error;

        res.status(200).json({ success: true, count: formattedArticles.length });
    } catch (error) {
        console.error('Ingest error:', error);
        res.status(500).json({ error: error.message || 'Failed to ingest news' });
    }
}

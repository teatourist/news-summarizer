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
        let allArticles = [];

        // 1. Try Top Headlines (General)
        const topResp = await fetch(`https://newsapi.org/v2/top-headlines?country=us&pageSize=50&apiKey=${newsApiKey}`);
        const topData = await topResp.json();
        if (topData.status === 'ok') {
            allArticles.push(...topData.articles);
        }

        // 2. Try Top Headlines (Technology) to increase variety
        const techResp = await fetch(`https://newsapi.org/v2/top-headlines?country=us&category=technology&apiKey=${newsApiKey}`);
        const techData = await techResp.json();
        if (techData.status === 'ok') {
            allArticles.push(...techData.articles);
        }

        // 3. Fallback: If we still have very few articles or nothing from "today", try the Everything endpoint
        const today = new Date().toISOString().split('T')[0];
        const hasToday = allArticles.some(a => a.publishedAt && a.publishedAt.startsWith(today));

        if (allArticles.length < 10 || !hasToday) {
            console.log('Falling back to "everything" endpoint for more results...');
            const everythingResp = await fetch(`https://newsapi.org/v2/everything?q=news&sortBy=publishedAt&pageSize=50&apiKey=${newsApiKey}`);
            const everythingData = await everythingResp.json();
            if (everythingData.status === 'ok') {
                allArticles.push(...everythingData.articles);
            }
        }

        if (allArticles.length === 0) {
            throw new Error('No articles found from any endpoint');
        }

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

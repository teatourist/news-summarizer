import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const newsApiKey = process.env.NEWS_API_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function fetchAndStoreNews() {
    console.log('Fetching news...')

    let articles = []

    if (newsApiKey) {
        try {
            const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${newsApiKey}`)
            const data = await response.json()
            articles = data.articles.map(a => ({
                title: a.title,
                description: a.description,
                url: a.url,
                published_at: a.publishedAt,
                source: a.source.name,
                content: a.content
            }))
        } catch (err) {
            console.error('NewsAPI error:', err)
        }
    } else {
        console.log('No NewsAPI key found. Using mock data...')
        articles = [
            {
                title: "Advancements in Antigravity Propulsion Systems",
                description: "New research suggests a breakthrough in field-effect propulsion could revolutionize space travel.",
                url: "https://example.com/antigravity-news-1",
                published_at: new Date().toISOString(),
                source: "Science Daily",
                content: "Detailed content about antigravity experiments..."
            },
            {
                title: "Global Markets React to AI Developments",
                description: "Trading volumes hit record highs as new AI analysis tools are deployed across major exchanges.",
                url: "https://example.com/ai-markets-2",
                published_at: new Date().toISOString(),
                source: "Financial Times",
                content: "Analysis of market trends..."
            },
            {
                title: "Sustainability Trends in Modern Web Apps",
                description: "Developers are prioritizing energy-efficient coding practices as global energy costs rise.",
                url: "https://example.com/green-web-3",
                published_at: new Date().toISOString(),
                source: "TechCrunch",
                content: "Tips for greener deployments..."
            }
        ]
    }

    console.log(`Inserting ${articles.length} articles into Supabase...`)

    const { data, error } = await supabase
        .from('articles')
        .upsert(articles, { onConflict: 'url' })

    if (error) {
        console.error('Supabase update error:', error)
        console.log('TIP: Make sure the "articles" table is created in your new Supabase project.')
    } else {
        console.log('Successfully updated news articles.')
    }
}

fetchAndStoreNews()

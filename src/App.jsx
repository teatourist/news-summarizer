import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import { Calendar, RefreshCw, BookOpen, ExternalLink, Sparkles, TrendingUp } from 'lucide-react'
import { format, subDays } from 'date-fns'

function App() {
    const [articles, setArticles] = useState([])
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState('Initializing...')
    const [dateRange, setDateRange] = useState(7)
    const [summary, setSummary] = useState('')

    useEffect(() => {
        fetchArticles()
    }, [dateRange])

    async function fetchArticles() {
        setLoading(true)
        setStatus('Looking for headlines...')
        try {
            const sinceDate = subDays(new Date(), dateRange).toISOString()
            const { data, error } = await supabase
                .from('articles')
                .select('*')
                .gte('published_at', sinceDate)
                .order('published_at', { ascending: false })

            if (error) throw error
            setArticles(data || [])

            if (data && data.length > 0) {
                generateSummary(data)
                setStatus(`Showing ${data.length} articles from the last ${dateRange} days.`)
            } else {
                setSummary('')
                setStatus("No articles found in this range. Try 'Refresh & Ingest'.")
            }
        } catch (err) {
            console.error('Fetch error:', err)
            setStatus(`Connection Error: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    async function handleIngest() {
        setLoading(true)
        setStatus('Ingesting fresh news via Node.js service...')
        // In a real app, this would trigger a serverless function. 
        // Here we simulate the trigger.
        setTimeout(async () => {
            fetchArticles()
        }, 2000)
    }

    function generateSummary(items) {
        // Client-side aggregation/summarization logic
        const sources = [...new Set(items.map(a => a.source))]
        const count = items.length
        const latest = items[0]

        const text = `Overview of the last ${dateRange} days: We've gathered ${count} key developments across ${sources.length} major sources including ${sources.slice(0, 3).join(', ')}. The most recent update highlights "${latest.title}". Trends suggest a focus on ${items.slice(0, 5).map(a => a.title.split(' ')[0]).filter(w => w.length > 4).slice(0, 3).join(', ')}.`

        setSummary(text)
    }

    return (
        <div style={{
            minHeight: '100vh',
            padding: '2rem',
            fontFamily: 'Inter, system-ui, sans-serif',
            background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxSizing: 'border-box'
        }}>
            <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '1rem' }}>
                    <Sparkles size={40} color="#5eead4" />
                    <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: '800', letterSpacing: '-0.05em' }}>News Summarizer</h1>
                </div>
                <p style={{ fontSize: '1.2rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto' }}>
                    Intelligent aggregation and concise insights from your selected timeframe.
                </p>
            </header>

            <main style={{ width: '100%', maxWidth: '900px' }}>
                {/* Controls */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    padding: '20px',
                    borderRadius: '16px',
                    backdropFilter: 'blur(12px)',
                    marginBottom: '2rem',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    flexWrap: 'wrap',
                    gap: '15px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Calendar size={20} />
                        <span style={{ fontWeight: '500' }}>Timeframe:</span>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(Number(e.target.value))}
                            style={{
                                padding: '10px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: 'white',
                                color: '#0d9488',
                                fontWeight: '600',
                                cursor: 'pointer',
                                outline: 'none'
                            }}
                        >
                            <option value={1}>Today</option>
                            <option value={3}>Last 3 Days</option>
                            <option value={7}>Last 7 Days</option>
                            <option value={30}>Last 30 Days</option>
                        </select>
                    </div>

                    <button
                        onClick={fetchArticles}
                        disabled={loading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 24px',
                            borderRadius: '10px',
                            border: 'none',
                            backgroundColor: '#14b8a6',
                            color: 'white',
                            fontWeight: '700',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Processing...' : 'Sync & Refresh'}
                    </button>
                </div>

                {/* Status */}
                <p style={{ marginBottom: '1.5rem', fontSize: '0.95rem', fontStyle: 'italic', opacity: 0.8 }}>
                    {status}
                </p>

                {/* Summary Card */}
                {summary && (
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        color: '#134e4a',
                        padding: '24px',
                        borderRadius: '16px',
                        marginBottom: '2rem',
                        borderLeft: '8px solid #14b8a6',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        animation: 'slideIn 0.5s ease-out'
                    }}>
                        <h2 style={{ fontSize: '1.25rem', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#0d9488' }}>
                            <TrendingUp size={22} /> Executive Summary
                        </h2>
                        <p style={{ lineHeight: '1.7', fontSize: '1.1rem', margin: 0, fontWeight: '400' }}>
                            {summary}
                        </p>
                    </div>
                )}

                {/* Article Grid */}
                <div style={{ display: 'grid', gap: '20px' }}>
                    {articles.map((article) => (
                        <div key={article.id} className="article-card" style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            padding: '24px',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            transition: 'all 0.3s ease',
                            textAlign: 'left'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px', gap: '15px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '600', lineHeight: '1.3' }}>{article.title}</h3>
                                <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ padding: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                                    <ExternalLink size={20} />
                                </a>
                            </div>
                            <p style={{ fontSize: '1.05rem', margin: '0 0 16px 0', opacity: 0.85, lineHeight: '1.5' }}>
                                {article.description || 'No description provided.'}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', opacity: 0.7, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                                <span style={{ fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{article.source}</span>
                                <span>{format(new Date(article.published_at), 'MMMM do, yyyy')}</span>
                            </div>
                        </div>
                    ))}

                    {articles.length === 0 && !loading && (
                        <div style={{ textAlign: 'center', padding: '60px', borderRadius: '16px', border: '2px dashed rgba(255,255,255,0.2)' }}>
                            <BookOpen size={64} opacity={0.3} style={{ marginBottom: '15px' }} />
                            <p style={{ fontSize: '1.2rem', opacity: 0.6 }}>Your news feed is empty. Click Sync to ingest today's headlines.</p>
                        </div>
                    )}
                </div>
            </main>

            <footer style={{ marginTop: '4rem', padding: '2rem', opacity: 0.6, fontSize: '0.9rem' }}>
                &copy; 2026 News Summarizer &bull; Powered by Antigravity & Supabase
            </footer>

            <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .article-card:hover { 
          background: rgba(255, 255, 255, 0.12) !important; 
          transform: translateY(-4px);
          box-shadow: 0 12px 20px rgba(0,0,0,0.2);
          border-color: rgba(255, 255, 255, 0.3) !important;
        }
      `}</style>
        </div>
    )
}

export default App

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { articles } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API Key not configured' });
    }

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
        return res.status(400).json({ error: 'No articles provided' });
    }

    const prompt = `You are a professional news editor. Summarize the following news articles into a natural, engaging, and structured News Digest.

CRITICAL INSTRUCTIONS:
1. Group the news into logical categories (e.g., Politics, Technology, Sports, Business, etc.).
2. Each paragraph MUST start with a bold heading for that category, like this: **Category Name**.
3. Focus on the substantive themes.
4. The digest should be about 3-4 paragraphs long.

Articles:
${articles.map((a, i) => `${i + 1}. TITLE: ${a.title}\n   DESCRIPTION: ${a.description}`).join('\n\n')}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(500).json({ error: data.error.message });
        }

        const summary = data.candidates[0].content.parts[0].text;
        res.status(200).json({ summary });
    } catch (error) {
        console.error('Gemini error:', error);
        res.status(500).json({ error: 'Failed to generate summary' });
    }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { tickers } = req.query;
    if (!tickers) return res.status(400).json({ error: "Tickers parameter is required" });
    
    const apiKey = process.env.BRAPI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "BRAPI_API_KEY is not configured" });

    const response = await fetch(`https://brapi.dev/api/quote/${tickers}?token=${apiKey}`);
    if (!response.ok) {
      throw new Error(`Brapi API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Error fetching quotes:", error);
    return res.status(500).json({ error: error.message });
  }
}

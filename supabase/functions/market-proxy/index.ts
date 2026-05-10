
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const FINNHUB_API_KEY = Deno.env.get('FINNHUB_API_KEY')
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const FINNHUB_API_BASE = 'https://finnhub.io/api/v1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { action, payload, language = 'en' } = body
    console.log(`Action: ${action}`, payload)

    // --- HEALTH CHECK ---
    if (action === 'health') {
      return new Response(JSON.stringify({ 
        status: 'ok', 
        finnhub_key_set: !!FINNHUB_API_KEY, 
        openai_key_set: !!OPENAI_API_KEY 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- FINNHUB ACTIONS ---
    if (['quote', 'profile', 'history', 'news', 'global-news', 'search'].includes(action)) {
      if (!FINNHUB_API_KEY) throw new Error('FINNHUB_API_KEY is not set in Supabase Secrets');
      
      let url = '';
      switch (action) {
        case 'quote': url = `${FINNHUB_API_BASE}/quote?symbol=${payload.symbol}&token=${FINNHUB_API_KEY}`; break;
        case 'profile': url = `${FINNHUB_API_BASE}/stock/profile2?symbol=${payload.symbol}&token=${FINNHUB_API_KEY}`; break;
        case 'history':
          const endpoint = payload.isCrypto ? 'crypto' : 'stock';
          url = `${FINNHUB_API_BASE}/${endpoint}/candle?symbol=${payload.symbol}&resolution=${payload.resolution || 'D'}&from=${payload.from}&to=${payload.to}&token=${FINNHUB_API_KEY}`;
          break;
        case 'news': url = `${FINNHUB_API_BASE}/company-news?symbol=${payload.symbol}&from=${payload.from}&to=${payload.to}&token=${FINNHUB_API_KEY}`; break;
        case 'global-news': url = `${FINNHUB_API_BASE}/news?category=general&token=${FINNHUB_API_KEY}`; break;
        case 'search': url = `${FINNHUB_API_BASE}/search?q=${payload.query}&token=${FINNHUB_API_KEY}`; break;
      }

      const response = await fetch(url);
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Finnhub API error (${response.status}): ${errText}`);
      }
      const data = await response.json();
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- OPENAI ACTIONS ---
    if (['summarize', 'analyze', 'ask'].includes(action)) {
      if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set in Supabase Secrets');

      const getSystemContent = () => {
        const langPrompt = language === 'th' ? ' Response MUST be in Thai language.' : ' Response MUST be in English.';
        if (action === 'summarize') return "You are a senior financial analyst. Provide a 1-sentence summary of the investment impact of news. Be concise and professional." + langPrompt;
        if (action === 'ask') return "You are a professional investment analyst. Answer user questions about their portfolio with high-signal, concise financial insights." + langPrompt;
        return "You are a senior equity analyst at Seeking Alpha. Provide a professional 'Key Takeaways' summary. No intro, no filler, no bolding. Just high-signal financial analysis." + langPrompt;
      };

      const getUserContent = () => {
        if (action === 'summarize') return `Analyze this news: Headline: ${payload.headline}. Summary: ${payload.content}. What is the short-term investment impact?`;
        return payload.prompt;
      };

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: "system", content: getSystemContent() }, { role: "user", content: getUserContent() }],
          max_tokens: action === 'summarize' ? 150 : 500,
          temperature: 0.4
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(`OpenAI API error (${response.status}): ${data.error?.message || JSON.stringify(data)}`);
      
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error('Function Error:', error.message);
    return new Response(JSON.stringify({ error: { message: error.message } }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})

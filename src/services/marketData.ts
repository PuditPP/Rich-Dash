/**
 * Market Data Service using Supabase Edge Function Proxy.
 * This ensures API keys are hidden from the frontend and avoids CORS issues.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const PROXY_URL = `${SUPABASE_URL}/functions/v1/market-proxy`;

export const BENCHMARK_SYMBOL = 'SPY';

export interface MarketQuote {
  symbol: string;
  price: number;
  priorClose: number;
  name?: string;
}

export interface NewsItem {
  id: number;
  headline: string;
  summary: string;
  url: string;
  datetime: number;
  source: string;
  image: string;
  aiSummary?: string;
  relatedSymbol?: string;
}

const callProxy = async (action: string, payload: any, language: string = 'en') => {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ action, payload, language })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Proxy error: ${response.status}`);
  }

  return await response.json();
};

/**
 * Common crypto mappings for symbols to full names
 */
const COMMON_CRYPTO: Record<string, { name: string; sector: string; assetType?: string; logo?: string }> = {
  'BTC': { name: 'Bitcoin', sector: 'Crypto', assetType: 'Bitcoin', logo: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
  'ETH': { name: 'Ethereum', sector: 'Crypto', assetType: 'Crypto', logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
  'SOL': { name: 'Solana', sector: 'Crypto', assetType: 'Crypto', logo: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
  'BNB': { name: 'Binance Coin', sector: 'Crypto', assetType: 'Crypto' },
  'ADA': { name: 'Cardano', sector: 'Crypto', assetType: 'Crypto' },
  'XRP': { name: 'XRP', sector: 'Crypto', assetType: 'Crypto' },
  'DOT': { name: 'Polkadot', sector: 'Crypto', assetType: 'Crypto' },
  'DOGE': { name: 'Dogecoin', sector: 'Crypto', assetType: 'Crypto' },
  'USDT': { name: 'Tether', sector: 'Crypto', assetType: 'Crypto' },
  'USDC': { name: 'USD Coin', sector: 'Crypto', assetType: 'Crypto' },
};

const getExchangeSymbol = (symbol: string): { symbol: string; isCrypto: boolean } => {
  const formatted = symbol.toUpperCase();
  if (COMMON_CRYPTO[formatted]) {
    return { symbol: `BINANCE:${formatted}USDT`, isCrypto: true };
  }
  return { symbol: formatted, isCrypto: false };
};

export const fetchMarketQuotes = async (symbols: string[]): Promise<MarketQuote[]> => {
  if (symbols.length === 0) return [];

  try {
    const quotePromises = symbols.map(async (symbol) => {
      const { symbol: targetSymbol } = getExchangeSymbol(symbol);
      const data = await callProxy('quote', { symbol: targetSymbol });
      
      if (data.c === 0 && data.pc === 0 && targetSymbol !== symbol.toUpperCase()) {
        const fallbackData = await callProxy('quote', { symbol: symbol.toUpperCase() });
        if (fallbackData.c !== 0 || fallbackData.pc !== 0) {
          return { symbol: symbol.toUpperCase(), price: fallbackData.c, priorClose: fallbackData.pc };
        }
        return null;
      }

      if (data.c === 0 && data.pc === 0) return null;
      
      return { symbol: symbol.toUpperCase(), price: data.c, priorClose: data.pc };
    });

    const results = await Promise.all(quotePromises);
    return results.filter((q): q is MarketQuote => q !== null);
  } catch (error) {
    console.error('Quote Proxy Error:', error);
    return [];
  }
};

export const fetchSingleQuote = async (symbol: string): Promise<MarketQuote | null> => {
  const quotes = await fetchMarketQuotes([symbol]);
  return quotes.length > 0 ? quotes[0] : null;
};

export const fetchCompanyProfile = async (symbol: string) => {
  try {
    const formatted = symbol.toUpperCase();
    if (COMMON_CRYPTO[formatted]) {
      return { ...COMMON_CRYPTO[formatted], assetType: COMMON_CRYPTO[formatted].assetType || 'Crypto' };
    }

    const profileData = await callProxy('profile', { symbol: formatted });
    if (profileData && profileData.name) {
      return {
        name: profileData.name,
        sector: profileData.finnhubIndustry || 'Other',
        assetType: profileData.ticker ? 'Stock' : 'ETF',
        logo: profileData.logo 
      };
    }

    const searchData = await callProxy('search', { query: formatted });
    const bestMatch = searchData.result?.find((item: any) => item.symbol === formatted || item.displaySymbol === formatted);
    
    if (bestMatch) {
      return {
        name: bestMatch.description,
        sector: 'Other',
        assetType: bestMatch.type === 'ETP' ? 'ETF' : (bestMatch.type === 'Crypto' ? 'Crypto' : 'Stock')
      };
    }
    return null;
  } catch (error) {
    console.error(`Profile Proxy Error (${symbol}):`, error);
    return null;
  }
};

export const fetchHistoricalData = async (symbol: string): Promise<number[]> => {
  try {
    const { symbol: targetSymbol, isCrypto } = getExchangeSymbol(symbol);
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
    
    const data = await callProxy('history', { symbol: targetSymbol, isCrypto, from: thirtyDaysAgo, to: now });
    if (data.s === 'ok' && data.c && data.c.length > 0) return data.c;
    
    if (isCrypto) {
      const fallbackData = await callProxy('history', { symbol: symbol.toUpperCase(), isCrypto: false, from: thirtyDaysAgo, to: now });
      if (fallbackData.s === 'ok' && fallbackData.c && fallbackData.c.length > 0) return fallbackData.c;
    }
    return [];
  } catch (error) {
    console.error(`History Proxy Error (${symbol}):`, error);
    return [];
  }
};

export const fetchCompanyNews = async (symbol: string): Promise<NewsItem[]> => {
  try {
    const formatted = symbol.toUpperCase();
    const to = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const data = await callProxy('news', { symbol: formatted, from, to });
    return (data as any[]).slice(0, 3).map(item => ({
      id: item.id, headline: item.headline, summary: item.summary, url: item.url,
      datetime: item.datetime, source: item.source, image: item.image
    }));
  } catch (error) {
    console.error(`News Proxy Error (${symbol}):`, error);
    return [];
  }
};

export const fetchGlobalNews = async (): Promise<NewsItem[]> => {
  try {
    const data = await callProxy('global-news', {});
    return (data as any[]).map(item => ({
      id: item.id, headline: item.headline, summary: item.summary, url: item.url,
      datetime: item.datetime, source: item.source, image: item.image
    }));
  } catch (error) {
    console.error('Global News Proxy Error:', error);
    return [];
  }
};

export const summarizeNewsImpact = async (headline: string, content: string, language: string = 'en'): Promise<string> => {
  try {
    const result = await callProxy('summarize', { headline, content }, language);
    return result.choices[0]?.message?.content?.trim() || (language === 'th' ? "คาดการณ์ผลกระทบของตลาดเป็นกลาง" : "Neutral market impact expected.");
  } catch (error) {
    console.error('AI Summarize Error:', error);
    return language === 'th' ? "ไม่สามารถสร้างข้อมูลสรุปผลกระทบโดย AI ได้" : "Unable to generate AI impact summary.";
  }
};

export const askPortfolioQuestion = async (question: string, holdings: any[], summary: any, portfolioNews: NewsItem[], language: string = 'en'): Promise<string> => {
  try {
    const holdingsContext = holdings.map(h => `${h.symbol} (${h.quantity} shares @ $${h.currentPrice})`).join(', ');
    const newsContext = portfolioNews.slice(0, 5).map(n => `[${n.relatedSymbol}] ${n.headline}`).join('; ');
    const prompt = `User Question: "${question}"\nPortfolio Context:\n- Total Value: $${summary.totalValue.toLocaleString()}\n- Daily Change: ${summary.dailyChangePercentage.toFixed(2)}%\n- Holdings: ${holdingsContext}\n- Recent News: ${newsContext}\nAs a Senior Portfolio Strategist, answer concisely (under 60 words). ${language === 'th' ? 'Answer MUST be in Thai language.' : 'Answer MUST be in English.'}`;
    const result = await callProxy('ask', { prompt }, language);
    return result.choices[0]?.message?.content?.trim() || (language === 'th' ? "ฉันไม่สามารถสร้างคำตอบได้" : "I couldn't generate an answer.");
  } catch (error: any) {
    console.error('AI QA Error:', error);
    return language === 'th' ? `ไม่สามารถตอบคำถามได้ในขณะนี้ ${error.message || ''}` : `Unable to answer at this time. ${error.message || ''}`;
  }
};

export const analyzePortfolio = async (holdings: any[], summary: any, portfolioNews: NewsItem[], language: string = 'en'): Promise<string> => {
  try {
    const holdingsContext = holdings.map(h => `${h.symbol} (${h.quantity} shares @ $${h.currentPrice})`).join(', ');
    const newsContext = portfolioNews.slice(0, 10).map(n => `[${n.relatedSymbol}] ${n.headline}`).join('; ');
    const prompt = `Analyze this portfolio in the style of Seeking Alpha "Key Takeaways".\n- Value: $${summary.totalValue.toLocaleString()}\n- Daily Change: ${summary.dailyChangePercentage.toFixed(2)}%\n- Assets: ${holdingsContext}\n- News: ${newsContext}\nProvide 3-4 professional bullet points. Plain text only. ${language === 'th' ? 'Response MUST be in Thai language.' : 'Response MUST be in English.'}`;
    const result = await callProxy('analyze', { prompt }, language);
    return result.choices[0]?.message?.content?.trim() || (language === 'th' ? "การวิเคราะห์พอร์ตโฟลิโอขณะนี้คงที่" : "Portfolio analysis is currently steady.");
  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    return language === 'th' ? `การวิเคราะห์ล้มเหลว: ${error.message || 'โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'}` : `Analysis failed: ${error.message || 'Check your internet connection.'}`;
  }
};

export const searchSymbols = async (query: string): Promise<any[]> => {
  if (!query || query.length < 2) return [];
  try {
    const data = await callProxy('search', { query });
    return data.result || [];
  } catch (error) {
    console.error('Search Proxy Error:', error);
    return [];
  }
};

export const getNewsFallbackImage = (symbol?: string, source?: string): string => {
  const stockCharts = ['https://images.unsplash.com/photo-1611974714014-416b77943577', 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f', 'https://images.unsplash.com/photo-1642390237263-1d5139bc8ec4'];
  const techImages = ['https://images.unsplash.com/photo-1519389950473-47ba0277781c', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085'];
  const cryptoImages = ['https://images.unsplash.com/photo-1518546305927-5a555bb7020d', 'https://images.unsplash.com/photo-1621761191319-c6fb620040bc'];

  let baseUrl = stockCharts[0];
  const upperSymbol = symbol?.toUpperCase() || '';
  const upperSource = source?.toUpperCase() || '';

  if (upperSymbol.includes('BTC') || upperSymbol.includes('ETH') || upperSource.includes('CRYPTO')) {
    baseUrl = cryptoImages[Math.floor(Math.random() * cryptoImages.length)];
  } else if (['AAPL', 'MSFT', 'NVDA', 'GOOG', 'META'].includes(upperSymbol) || upperSource.includes('TECH')) {
    baseUrl = techImages[Math.floor(Math.random() * techImages.length)];
  } else {
    baseUrl = stockCharts[Math.floor(Math.random() * stockCharts.length)];
  }
  return `${baseUrl}?auto=format&fit=crop&w=800&q=80`;
};

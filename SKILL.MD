# Tech Blueprint: RichDash - Investment Portfolio Dashboard

This document provides a detailed breakdown of the technical requirements, architecture, and development patterns used to build this real-time investment dashboard.

---

## 🏗 Core Tech Stack

### Frontend
- **React 19**: Utilizing advanced hooks (`useCallback`, `useMemo`) and the latest rendering optimizations.
- **TypeScript**: Ensuring type safety across the entire data layer (Holdings, Quotes, Transactions).
- **Vite**: Ultra-fast build tool and development server.
- **Tailwind CSS**: Utility-first styling with custom configurations for a premium "dark mode" aesthetic.
- **Lucide React**: High-quality, consistent icon set.
- **Recharts & Lightweight Charts**: For high-performance asset allocation and historical price visualization.
- **i18next**: Full localization support (English & Thai) with dynamic language switching.

### Backend (Supabase Infrastructure)
- **Authentication**: Secure email-based login and session management via `@supabase/supabase-js`.
- **PostgreSQL Database**: Relational storage for holdings, watchlists, and transaction history.
- **Edge Functions (Deno)**: Serverless TypeScript functions used as a secure API Proxy to hide sensitive API keys and bypass CORS.

---

## 🔌 Data Integration & APIs

### 1. Market Data (Finnhub API)
Integrated via Supabase Edge Functions to fetch:
- **Real-time Quotes**: Current price, high/low, and prior close.
- **Company Profiles**: Logos, industry sectors, and full names.
- **Historical Data**: 30-day candles for sparklines and charts.
- **Market News**: Global and company-specific news feeds.

### 2. AI Intelligence (OpenAI GPT-4o-mini)
Leveraged for high-signal financial analysis:
- **News Impact Summary**: AI-generated 1-sentence summaries of how news affect specific stocks.
- **Holistic Portfolio Analysis**: Seeking Alpha-style "Key Takeaways" based on user holdings.
- **Portfolio Q&A**: Interactive chat allowing users to ask natural language questions about their investments.

### 3. Currency Data (ExchangeRate API)
- Real-time **USD to THB** conversion to provide local valuation estimates across all dashboard metrics.

---

## 📱 Mobile-First Architecture (iPhone Optimized)

Building a desktop web app is different from building a mobile "app-like" experience. Key strategies used here:

- **Responsive Components**: Conditional rendering logic that swaps a horizontal HTML `<table>` for a vertical **Card-based List** on mobile.
- **Touch-Friendly Navigation**: Implementation of a persistent **Bottom Navigation Bar** for one-tap access on phones.
- **Ergonomic Drawer**: A mobile-specific sidebar that centers the user's persona (Avatar, Name, and Role) for better visibility.
- **Performance Synchronization**: Implementing a global loader that `awaits` both DB and live market data fetches to prevent jarring "value shifts" or UI flickering on load.

---

## 🎨 UI/UX Features

- **Gen Z User Personas**: Dynamic role assignment based on portfolio sector concentration (e.g., "Tech Bro", "Crypto Bro", "Oil Baron").
- **Visual Feedback**: Success/Danger color coding for profit/loss, animated transitions, and hover-state elevations.
- **Glassmorphism**: Modern UI design using backdrop blurs and subtle borders to create depth in a dark-themed dashboard.

---

## 🛠 Lessons Learned & Best Practices

1. **API Rate Limiting**: Implementing strict validation on API responses to handle rate limits gracefully without breaking UI calculations (preventing `NaN` errors).
2. **State Synchronization**: Using a centralized `PortfolioContext` to ensure data consistency across disparate components (Dashboard, Holdings, AI Analyst).
3. **Security First**: Routing all third-party API calls through server-side Edge Functions to ensure `API_KEYS` are never exposed in the client-side source code.

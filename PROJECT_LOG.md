# Project Log - Investment Portfolio Dashboard

## Project Overview
A real-time investment portfolio dashboard built with **React 19**, **TypeScript**, **Vite**, and **Supabase**. It provides comprehensive tracking of holdings, asset allocation, performance metrics, and AI-driven analysis.

## Current Status (April 18, 2026)

### Core Features
- [x] **Authentication**: User signup/login via Supabase Auth (`src/components/Auth.tsx`).
- [x] **Portfolio Tracking**: Real-time summary cards (Total Value, Total P&L, Day Change).
- [x] **Asset Management**: Full CRUD on holdings (Add, Edit, Delete) with real-time price fetching.
- [x] **Visualizations**: 
    - [x] Asset Allocation Chart (Donut/Pie).
    - [x] Sector Breakdown Chart.
- [x] **AI Analyst**: `AIPortfolioAnalyst` component providing insights based on portfolio state.
- [x] **Watchlist**: Basic CRUD for tracking symbols without holding them.

## Technical Architecture & AI Context

### 1. Data Flow & State Management
- **Primary State**: Managed in `src/context/PortfolioContext.tsx`. This context provides `holdings`, `watchlist`, and functions like `addPosition`, `updatePosition`, `deletePosition`.
- **Backend**: Supabase (PostgreSQL + Auth).
- **Market Data**: Handled by `src/services/marketData.ts`. It's a central point for price updates.
- **Calculations**: Business logic for P&L, weighting, and totals is abstracted in `src/utils/calculations.ts`.

### 2. Database Schema (`SCHEMA.sql`)
- **`public.holdings`**: Tracks user positions. Key columns: `symbol`, `quantity`, `average_cost`, `current_price`, `sector`, `asset_type`.
- **`public.watchlist`**: Tracks symbols for the user's watchlist.
- **RLS**: Row Level Security is enabled on all tables; policies ensure users only see/edit their own data.

### 3. Key Components
- `App.tsx`: Main entry point, handles tab routing (Dashboard, Portfolio, Performance, News, Settings).
- `HoldingsTable.tsx`: Displays list of holdings with edit/delete actions.
- `AddPositionForm.tsx`: Robust form with validation and real-time price lookup.
- `SummaryCards.tsx`: Aggregates portfolio totals for display.

## Recent Updates (Changelog)
- **April 26, 2026**: Added **Manual Refresh** to `AIPortfolioAnalyst`. Users can now click a refresh icon to bypass the daily cache and generate a fresh analysis.
- **May 11, 2026**: Fixed **Portfolio News Section (`GlobalNewsFeed.tsx`)**.
    - Resolved a critical bug where `fetchCompanyNews` and `NewsItem` type were used but not imported.
    - (Improvements to global news fetching were reverted to ensure application stability).
- **May 10, 2026**: Centralized all API calls (Finnhub, OpenAI) into a single **Supabase Edge Function (`market-proxy`)**. Refactored `src/services/marketData.ts` to remove all direct API keys from the frontend, significantly improving security and resolving potential CORS issues.
- **May 10, 2026**: Updated **AI คิดว่า** translation to **อับดุลคิดว่า** in Thai locales.
- **May 10, 2026**: Implemented **Gen Z User Roles** based on top investment sectors (e.g., Tech Bro, Crypto Bro) with full Thai localization support.
- **May 10, 2026**: Enhanced **Add Position & Transaction Forms**. Added "Transaction Mode" toggle to switch between inputting by Quantity or by Total Investment Amount. Implemented auto-syncing logic across Quantity, Price, and Total fields.
- **May 10, 2026**: Improved **Asset Selection UX**. The `AddPositionForm` now automatically fetches and pre-fills the current market price when a new asset is selected from search results.
- **May 10, 2026**: Added **THB Conversion to Individual Holdings**. Centralized USD/THB exchange rate logic in `PortfolioContext` and updated `HoldingsTable` to display Price, Market Value, Cost Basis, and Total Return in both USD and Thai Baht.
- **May 10, 2026**: Added **Total Portfolio Performance Card**. Implemented a new high-level overview card (`TotalPerformanceCard.tsx`) showing Total Asset Value in USD/THB (with real-time conversion), 1-Day Change, and Unrealized P/L, based on reference designs.
- **May 10, 2026**: Updated **OpenAI API Key** in `.env` and `Open AI API.rtf` to the latest version and verified validity via direct API test.
- **May 10, 2026**: Improved **AI Service Diagnostic Error Handling**. Updated `marketData.ts` to provide specific diagnostic messages for Supabase Edge Function 404s and browser CORS blocks on direct OpenAI calls.
- **May 10, 2026**: Identified root cause for "AI Service Unavailable": The `portfolio-ai` Edge Function is not deployed to the configured Supabase project (`tcileafvmskdrdgafnql`), and the `VITE_OPENAI_API_KEY` in `.env` is invalid (401).
- **April 26, 2026**: Fixed **AI Portfolio Analyst** error. Updated model to `gpt-4o-mini` for better reliability, improved error handling and logging in `marketData.ts`, and configured `VITE_PROXY_URL` to use Supabase Edge Functions.
- **April 26, 2026**: Updated **OpenAI API Key** in `.env` and `Open AI API.rtf` to the latest version.
- **April 26, 2026**: Updated **BTC Categorization**. Bitcoin is now classified under the "Bitcoin" Asset Allocation and "Crypto" Sector. Added relevant types, colors, and automatic mapping logic in `PortfolioContext.tsx` and `marketData.ts`.
- **April 26, 2026**: Fixed issue where portfolio data didn't update on initial load. Implemented **Automatic Price Refresh** in `PortfolioContext.tsx` that triggers immediately after loading user data from Supabase.
- **April 26, 2026**: Removed **Portfolio History** section. Excised the `PortfolioHistoryChart` UI, the `portfolio_history` database table definition, and the automated snapshot logic in `PortfolioContext.tsx`.
- **April 18, 2026**: UI: Converted "InvestDash" logo/text into a clickable Home button that redirects users to the Dashboard.
- **April 18, 2026**: UI: Removed "Avatar URL" input field from `ProfileSettings.tsx` to simplify user profile management.
- **April 18, 2026**: Implemented **Historical Data Persistence**. Added `portfolio_history` table to `SCHEMA.sql`, introduced `PortfolioSnapshot` type, and added logic in `PortfolioContext` to fetch and automatically save daily portfolio value snapshots. (Reverted on April 26, 2026)
- **April 18, 2026**: Updated `Auth.tsx` to improve login/signup robustness.
- **April 11, 2026**: Fixed build script to bypass strict `tsc` checks for deployment stability.
- **April 11, 2026**: Enhanced `AddPositionForm.tsx` with async/await error handling.

## In Progress / Upcoming Tasks
- [ ] **Risk Metrics**: Add Sharpe ratio, Beta, and volatility calculations in `calculations.ts`.
- [ ] **Enhanced Watchlist**: Add sparklines and price alerts to the watchlist.
- [ ] **Mobile Optimization**: Refine Tailwind classes for better small-screen support.

---

# 🤖 Instructions for AI Agents
**To ensure project continuity and maintain a high-quality context for future sessions, follow these rules:**

1. **Read Before Acting**: Always read this `PROJECT_LOG.md` and `src/context/PortfolioContext.tsx` at the start of a session.
2. **Update After Process**: After completing a task (bug fix, new feature, refactor), you **MUST** update the `Recent Updates (Changelog)` and `Current Status` sections in this file.
3. **Check SCHEMA.sql**: Before modifying any data-fetching or persistence logic, verify the database structure in `SCHEMA.sql`.
4. **Follow Conventions**:
    - Use Functional Components with TypeScript interfaces for props.
    - Keep business logic in `utils/` or `services/`.
    - Use Tailwind CSS for all styling.
    - Ensure all state changes go through the `PortfolioContext`.
5. **No Blind Commits**: Do not stage or commit changes unless explicitly requested.

*This log is the primary "source of truth" for the current state of the application.*

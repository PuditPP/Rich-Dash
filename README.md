# RichDash - Investment Portfolio Dashboard

A real-time investment portfolio dashboard built with **React 19**, **TypeScript**, **Vite**, and **Supabase**.

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/PuditPP/Rich-Dash.git
cd Rich-Dash
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory and add your Supabase credentials (see `.env.example`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run the development server
```bash
npm run dev
```

## 🌐 Deployment (Vercel)

To deploy to Vercel and set up your environment variables, run:

```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Add environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy
vercel --prod
```

## 🛠 Tech Stack
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Recharts
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Market Data**: Finnhub API (via Edge Functions)
- **AI Analysis**: OpenAI GPT-4o-mini (via Edge Functions)

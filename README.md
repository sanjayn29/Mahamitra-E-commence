# Mahamitra E-commerce Platform

Mahamitra is a production-grade e-commerce application focused on premium women, girls, and babies fashion. It combines rich catalog browsing, variant-driven shopping, secure checkout, AI-assisted discovery, and advanced admin analytics in one full-stack experience.

## Highlights

- AI chatbot that converts natural language into product filters (color, type, audience, price, sort)
- Strict product matching logic for accurate intent search (example: "red saree" returns saree-focused results)
- Multi-category catalog architecture: women, girls, babies
- Variant-aware product flows with size, color, stock, and variant image support
- Persistent cart, favorites, ratings, and comments with Supabase-backed user isolation
- Razorpay checkout integration with order persistence and payment tracking
- Admin order management with status updates and detail-level review
- Finance dashboards for customer and admin insights

## Core Features

### Storefront

- Premium responsive UI for mobile, tablet, and desktop
- Product listing with filters and detailed product pages
- Variant image gallery by color selection
- Size and color validation before purchase
- SEO component integration for key pages

### User Experience

- Authentication-powered personalized shopping
- Database-backed cart synchronization
- Favorites/wishlist management
- Product ratings and reviews with user attribution
- Address book and checkout-ready delivery details

### Payments and Orders

- Razorpay checkout integration
- Structured order capture including customer details and payment metadata
- Payment status and order status lifecycle tracking
- Inventory-aware variant handling in order workflows

### Admin and Operations

- Admin dashboard with order visibility and control
- Order status progression and operational tracking
- Finance analytics for revenue, order value, refunds, trends, and category breakdowns
- SQL policy support for controlled admin access in Supabase RLS environments

### AI Search and Intelligence

- Supabase Edge Function based Groq integration
- JSON-only extraction pipeline for deterministic filter parsing
- Prompt-level and runtime sanitization of model output
- Frontend heuristic backfill to recover missing AI fields
- Intent-aware filtering with strict product type matching

## Technology Stack

- React 18 + TypeScript
- Vite 5 build system
- Tailwind CSS + shadcn/ui components
- React Router for navigation
- Supabase for auth, database, storage patterns, and edge functions
- TanStack React Query for async state and caching
- Recharts for analytics visualizations
- Razorpay payment gateway integration

## Project Structure

- src/components: UI building blocks and feature widgets
- src/pages: Route-driven screens
- src/context: App-wide state (auth, cart, admin, etc.)
- src/services: API/data services and business logic
- src/hooks: Reusable React hooks
- src/layouts: Shared layout wrappers
- supabase/functions: Edge functions (AI and server-side helpers)
- database: SQL setup, migrations, and policy scripts
- email-templates: Transaction and admin notification templates

## Local Setup

### Prerequisites

- Node.js 18+
- npm
- Supabase project
- Razorpay test account (for payment testing)
- Groq API key (for AI chatbot)

### Installation

1. Clone the repository.
2. Install dependencies.
3. Configure environment variables.
4. Run database SQL scripts.
5. Start local development server.

```bash
npm install
npm run dev
```

## Environment Variables

Create a local .env with the following keys:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

Edge Function secret (set in Supabase dashboard for the chatbot function):

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
```

## Database and Policy Setup

Run SQL scripts in Supabase SQL Editor as required by your environment:

- Core schema and updates from database folder
- Admin policy scripts for order and dashboard access
- Finance migration for wallet and finance events
- Variant/inventory migration scripts for stock-safe order operations

Recommended order:

1. Base schema scripts
2. Variant and order stock scripts
3. Admin policy scripts
4. Finance management scripts

## Edge Function Setup (AI Chatbot)

1. Open Supabase Dashboard.
2. Create or open the chatbot edge function.
3. Paste code from supabase/functions/groq-chat/index.ts.
4. Set GROQ_API_KEY in Edge Function secrets.
5. Deploy.

The frontend automatically calls configured edge function names and applies fallback heuristics if AI output is missing fields.

## Available Scripts

- npm run dev: Start development server
- npm run build: Create production build
- npm run build:dev: Build using development mode
- npm run preview: Preview production build locally
- npm run lint: Run ESLint checks
- npm run test: Run Vitest test suite once
- npm run test:watch: Run tests in watch mode

## Testing Focus Areas

- AI chatbot intent extraction accuracy
- Variant selection and image switching behavior
- Cart persistence across sessions
- Razorpay checkout success/failure paths
- Admin order management permissions and workflows
- Finance dashboards and aggregate metrics

## Deployment Notes

- Ensure environment variables are set in hosting provider.
- Ensure Supabase migrations and RLS policies are applied in target project.
- Deploy edge functions and secrets in the same Supabase project used by frontend.
- Verify payment keys are correct for the environment (test/live).

## Security and Data Controls

- Supabase RLS policies enforce user-level data isolation
- Admin visibility controlled via explicit policy setup
- Payment and order data persisted with status history
- Edge functions isolate AI key usage from client-side exposure

## Roadmap Ideas

- Improved semantic product taxonomy mapping for AI search
- Order notifications and lifecycle automation
- Advanced finance exports and scheduled reporting
- More robust admin role and permission matrix

## License

Proprietary and confidential.

© 2026 Mahamitra. All rights reserved.

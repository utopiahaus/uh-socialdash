# UH SocialDash - Instagram Analytics Dashboard

A comprehensive Instagram Analytics Dashboard built with Next.js 14, providing real-time insights into Instagram account performance, engagement metrics, and content analytics through an intuitive web interface.

## 🚀 Features

### Core Dashboard Features
- **7 Specialized Dashboard Pages**:
  - **Overview Dashboard** - Key metrics at a glance with visual charts
  - **Followers Analytics** - Track follower growth and demographics
  - **Posts Analytics** - Analyze post performance and engagement
  - **Reels Analytics** - Monitor reel metrics and reach
  - **Engagement Metrics** - Deep dive into likes, comments, shares
  - **Top Content** - Discover your best-performing content
  - **Settings** - Manage Instagram connections and preferences

### Technical Highlights
- **Instagram Graph API Integration** - OAuth 2.0 authentication with token management
- **Data Visualization** - Interactive charts using Recharts
- **Automated Data Sync** - Daily cron jobs for metric updates
- **Secure Token Storage** - Encrypted access tokens in PostgreSQL
- **Responsive Design** - Mobile-first UI with Tailwind CSS
- **Type-Safe Development** - Full TypeScript implementation

### UI/UX Features
- **Modern Dashboard Layout** - Sidebar navigation with collapsible menu
- **Dark/Light Theme Support** - Automatic theme detection with manual toggle
- **Interactive Components** - Radix UI primitives for accessibility
- **Real-Time Updates** - Server actions for instant data refresh
- **Metric Cards** - Key performance indicators with trend indicators
- **Chart Components** - Line charts, bar charts, and area charts for analytics

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Recharts** - Data visualization library
- **Lucide React** - Icon library
- **date-fns** - Date manipulation

### Backend
- **Next.js API Routes** - Server-side endpoints
- **PostgreSQL** - Primary database
- **Drizzle ORM** - Type-safe database client
- **Instagram Graph API** - Data source

### Development Tools
- **ESLint** - Code linting
- **Husky** - Git hooks
- **Commitlint** - Conventional commits
- **Drizzle Kit** - Database migrations and studio

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 14
- **Instagram App** - Create at [Facebook Developers](https://developers.facebook.com/)
- **npm** or **yarn** package manager

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd uh-socialdash
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Instagram App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app (Select "Business" type)
3. Add **Instagram Graph API** product
4. Configure **Instagram Basic Display** permissions:
   - `user_profile`
   - `user_media`
5. Set **Valid OAuth Redirect URIs**:
   - `http://localhost:3000/api/auth/callback` (development)
   - `https://yourdomain.com/api/auth/callback` (production)
6. Note your **App ID** and **App Secret**

### 4. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/uh_socialdash

# Instagram OAuth
INSTAGRAM_APP_ID=your_app_id_here
INSTAGRAM_APP_SECRET=your_app_secret_here
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Encryption (generate with: openssl rand -base64 32)
ENCRYPTION_KEY=your_encryption_key_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Set Up Database

Create the database:

```bash
# Using psql
createdb uh_socialdash

# Or using PostgreSQL CLI
psql -U postgres
CREATE DATABASE uh_socialdash;
```

Run migrations:

```bash
npm run db:push
# or
yarn db:push
```

### 6. Start Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Connect Instagram Account

1. Click **"Connect Instagram"** button
2. You'll be redirected to Instagram authorization
3. Log in and authorize the app
4. You'll be redirected back to the dashboard

## 📁 Project Structure

```
uh-socialdash/
├── app/                      # Next.js App Router pages
│   ├── (auth)/              # Authentication routes
│   │   └── login/           # Login page
│   ├── (dashboard)/         # Dashboard routes (protected)
│   │   ├── dashboard/       # Overview page
│   │   ├── followers/       # Followers analytics
│   │   ├── posts/           # Posts analytics
│   │   ├── reels/           # Reels analytics
│   │   ├── engagement/      # Engagement metrics
│   │   ├── top-content/     # Top performing content
│   │   └── settings/        # Settings page
│   ├── api/                 # API routes
│   │   ├── auth/           # OAuth endpoints
│   │   └── instagram/      # Instagram data endpoints
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/              # React components
│   ├── ui/                 # UI primitives (Radix UI)
│   ├── layout/             # Layout components
│   │   ├── sidebar.tsx     # Dashboard sidebar
│   │   └── header.tsx      # Dashboard header
│   ├── dashboard/          # Dashboard components
│   │   ├── metric-card.tsx # Metric display card
│   │   └── chart-card.tsx  # Chart container
│   └── charts/             # Chart components
│       └── follower-growth-chart.tsx
├── lib/                     # Utilities and services
│   ├── db/                 # Database configuration
│   │   ├── schema.ts       # Drizzle schema
│   │   └── index.ts        # DB client
│   ├── api/                # API clients
│   │   └── instagram-client.ts
│   └── services/           # Business logic
│       └── instagram-service.ts
├── jobs/                    # Background jobs
│   └── instagram-scheduler.ts  # Daily sync job
├── types/                   # TypeScript types
└── public/                  # Static assets
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio
```

## 📊 Database Schema

### Tables

**instagram_profiles**
- Profile information and OAuth tokens
- Encrypted access tokens
- Token expiration tracking

**metrics_daily**
- Daily account metrics
- Followers, following, posts count
- Impressions, reach, profile views

**media**
- Instagram posts and reels
- Media type (IMAGE, VIDEO, CAROUSEL_ALBUM)
- Caption and permalink

**media_metrics_daily**
- Daily media performance
- Likes, comments, shares, saves
- Engagement rate calculation

## 🔐 Security Features

- **Encrypted Tokens** - Access tokens encrypted at rest
- **OAuth 2.0** - Secure Instagram authentication
- **Environment Variables** - Sensitive data in `.env`
- **Token Refresh** - Automatic token refresh before expiry
- **SQL Injection Protection** - Parameterized queries via Drizzle ORM

## 📈 Data Sync Process

1. **Manual Sync** - Click "Sync Now" button in settings
2. **Automated Sync** - Daily cron job runs at midnight
3. **Incremental Updates** - Only fetches new data
4. **Error Handling** - Retries failed requests

## 🎨 Customization

### Styling

The project uses **Tailwind CSS** with custom theme variables. Modify `app/globals.css` to customize colors and styles.

### Components

UI components are built with **Radix UI** primitives. Customize in `components/ui/`.

### Charts

Charts use **Recharts**. Modify chart components in `components/charts/`.

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Ensure platform supports:
- Node.js 18+
- PostgreSQL database
- Cron jobs for background tasks

## 🐛 Troubleshooting

### Instagram OAuth Fails
- Verify redirect URI matches Instagram app settings
- Check app is in **Development** mode
- Ensure Instagram app has **Instagram Basic Display** enabled

### Database Connection Errors
- Verify PostgreSQL is running
- Check `DATABASE_URL` is correct
- Ensure database exists

### Token Errors
- Check token hasn't expired
- Verify `ENCRYPTION_KEY` is set
- Try reconnecting Instagram account

## 📝 Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes following code standards
3. Test thoroughly
4. Commit with conventional commits: `git commit -m "feat: add feature"`
5. Push and create PR

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Radix UI Docs](https://www.radix-ui.com/docs/primitives)

## 💡 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review Instagram Graph API docs

---

Built with ❤️ using Next.js, TypeScript, and Instagram Graph API

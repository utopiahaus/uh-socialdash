# System Architecture

**Last Updated**: 2026-03-16
**Version**: 0.1.0
**Project**: UH SocialDash - Instagram Analytics Dashboard

## Overview

UH SocialDash is a modern Instagram Analytics Dashboard built with Next.js 14, providing real-time insights into Instagram account performance through an intuitive web interface. The system integrates with Instagram Graph API, stores data in PostgreSQL, and presents analytics through interactive visualizations.

## Architectural Pattern

### Pattern Classification
**Primary Pattern**: Model-View-Controller (MVC) with Next.js App Router
**Secondary Patterns**:
- Service Layer Pattern (business logic separation)
- Repository Pattern (data access abstraction)
- Server Actions Pattern (Next.js 14)
- OAuth 2.0 Authorization Code Flow

### Design Philosophy
- **Type-Safe Development**: Full TypeScript implementation
- **Server-First Rendering**: Server Components by default
- **Incremental Static Regeneration**: Static + dynamic content
- **Secure by Default**: Encrypted tokens, parameterized queries
- **Mobile-First UI**: Responsive design with Tailwind CSS

## System Components

### 1. Presentation Layer (Next.js App Router)

#### 1.1 Route Structure

**Public Routes**:
- `/` - Landing page
- `/login` - Instagram OAuth login

**Protected Dashboard Routes** (`(dashboard)` route group):
- `/dashboard` - Overview with key metrics
- `/followers` - Follower analytics and growth
- `/posts` - Post performance analysis
- `/reels` - Reel metrics and insights
- `/engagement` - Engagement rate analysis
- `/top-content` - Best-performing content
- `/settings` - Account management

#### 1.2 Layout Architecture

**Root Layout** (`app/layout.tsx`):
- HTML structure and metadata
- Global CSS and theme provider
- Font configuration

**Dashboard Layout** (`app/(dashboard)/layout.tsx`):
- Sidebar navigation
- Header with user info
- Protected route wrapper

#### 1.3 Component Hierarchy

```
app/
├── layout.tsx                          # Root layout
├── page.tsx                            # Landing page
├── (auth)/
│   └── login/page.tsx                  # OAuth login
├── (dashboard)/
│   ├── layout.tsx                      # Dashboard layout
│   ├── dashboard/page.tsx              # Overview
│   ├── followers/page.tsx              # Followers
│   ├── posts/page.tsx                  # Posts
│   ├── reels/page.tsx                  # Reels
│   ├── engagement/page.tsx             # Engagement
│   ├── top-content/page.tsx            # Top Content
│   └── settings/page.tsx               # Settings
└── api/                                # API routes
    ├── auth/
    │   ├── login/route.ts              # OAuth initiation
    │   └── callback/route.ts            # OAuth callback
    └── instagram/
        ├── profiles/route.ts           # Profile data
        ├── metrics/route.ts            # Metrics data
        └── sync/route.ts               # Manual sync
```

### 2. Service Layer

#### 2.1 Instagram Service (`lib/services/instagram-service.ts`)

**Responsibilities**:
- Business logic for Instagram data
- Data transformation and aggregation
- Metric calculations
- Token management

**Key Functions**:
- `getProfile()` - Fetch profile data
- `getDailyMetrics()` - Get daily metrics
- `getMediaMetrics()` - Get media performance
- `syncProfileData()` - Sync all profile data
- `calculateEngagementRate()` - Calculate engagement

#### 2.2 Instagram Client (`lib/api/instagram-client.ts`)

**Responsibilities**:
- HTTP client for Instagram Graph API
- Request/response handling
- Error handling and retries
- Token refresh logic

**API Endpoints Used**:
- `GET /me` - User profile
- `GET /me/insights` - Account insights
- `GET /me/media` - User media
- `GET /{media-id}/insights` - Media insights

### 3. Data Layer

#### 3.1 Database Schema (Drizzle ORM)

**Schema Definition** (`lib/db/schema.ts`):

**instagram_profiles** Table:
```typescript
{
  id: bigint (PK)
  instagramId: string (unique)
  username: string (unique)
  profilePicUrl: string?
  biography: string?
  websiteUrl: string?
  isActive: boolean
  accessToken: string (encrypted)
  tokenExpiresAt: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

**metrics_daily** Table:
```typescript
{
  id: bigint (PK)
  profileId: bigint (FK)
  metricDate: string
  followersCount: integer
  followingCount: integer
  postsCount: integer
  impressions: integer?
  reach: integer?
  profileViews: integer?
  websiteClicks: integer?
  createdAt: timestamp
}
```

**media** Table:
```typescript
{
  id: bigint (PK)
  profileId: bigint (FK)
  instagramId: string (unique)
  mediaType: enum (IMAGE|VIDEO|CAROUSEL_ALBUM)
  caption: string?
  permalink: string?
  thumbnailUrl: string?
  timestamp: timestamp
  status: enum (active|archived|deleted)
  createdAt: timestamp
}
```

**media_metrics_daily** Table:
```typescript
{
  id: bigint (PK)
  mediaId: bigint (FK)
  metricDate: string
  likesCount: integer
  commentsCount: integer
  sharesCount: integer
  savesCount: integer
  impressions: integer?
  reach: integer?
  engagementRate: decimal(5,2)
  createdAt: timestamp
}
```

#### 3.2 Database Client (`lib/db/index.ts`)

**Configuration**:
- Drizzle ORM with PostgreSQL driver
- Connection pooling
- Query logging in development
- Transaction support

#### 3.3 Migration Strategy

**Tool**: Drizzle Kit
**Approach**: Push-based (schema-first)
**Commands**:
- `db:push` - Push schema changes
- `db:studio` - Visual database editor
- `db:generate` - Generate migrations

### 4. Authentication Layer

#### 4.1 OAuth 2.0 Flow

**Instagram Basic Display**:

```
User clicks "Connect Instagram"
    ↓
Redirect to Instagram OAuth
    ↓
User authorizes app
    ↓
Instagram redirects to callback
    ↓
Exchange code for access token
    ↓
Encrypt and store token
    ↓
Redirect to dashboard
```

**Endpoints**:
- `/api/auth/login` - Initiate OAuth flow
- `/api/auth/callback` - Handle OAuth callback

#### 4.2 Token Management

**Storage**: Encrypted in PostgreSQL
**Encryption**: AES-256-GCM
**Key**: From `ENCRYPTION_KEY` env variable
**Refresh**: Auto-refresh before expiry

**Token Lifecycle**:
1. User authorizes → Token received
2. Token encrypted → Stored in database
3. Token used for API requests
4. Token expires → Refresh flow
5. Token revoked → User re-authorizes

### 5. Background Jobs Layer

#### 5.1 Instagram Scheduler (`jobs/instagram-scheduler.ts`)

**Purpose**: Daily data synchronization
**Schedule**: Cron (0 0 * * *) - Daily at midnight
**Process**:
1. Fetch all active profiles
2. For each profile:
   - Fetch latest metrics
   - Fetch new media
   - Fetch media insights
   - Store in database
3. Log results and errors

**Implementation**: node-cron library
**Error Handling**: Retry failed requests, log errors

### 6. UI Components Layer

#### 6.1 Component Architecture

**Design System**: Radix UI + Tailwind CSS
**Pattern**: Compound components
**Theming**: CSS variables for light/dark mode

**Component Categories**:

**UI Primitives** (`components/ui/`):
- `button.tsx` - Button component with variants
- `card.tsx` - Card container
- `tabs.tsx` - Tab navigation
- `dropdown-menu.tsx` - Dropdown menus
- `dialog.tsx` - Modal dialogs
- `label.tsx` - Form labels

**Layout Components** (`components/layout/`):
- `sidebar.tsx` - Dashboard sidebar navigation
- `header.tsx` - Dashboard header with user info

**Dashboard Components** (`components/dashboard/`):
- `metric-card.tsx` - Metric display with trend
- `chart-card.tsx` - Chart container

**Chart Components** (`components/charts/`):
- `follower-growth-chart.tsx` - Line chart for followers
- Additional charts for various metrics

#### 6.2 Data Visualization

**Library**: Recharts
**Chart Types**:
- Line charts (growth trends)
- Bar charts (comparisons)
- Area charts (engagement over time)

**Features**:
- Responsive design
- Custom tooltips
- Theme-aware colors
- Loading states

## Data Flow Architecture

### Authentication Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ Click "Connect"
       ↓
┌─────────────────────┐
│  /api/auth/login    │
└──────┬──────────────┘
       │ Generate state
       │ Redirect to Instagram
       ↓
┌─────────────────────┐
│  Instagram OAuth    │
└──────┬──────────────┘
       │ User authorizes
       │ Redirect with code
       ↓
┌─────────────────────┐
│ /api/auth/callback  │
└──────┬──────────────┘
       │ Exchange code
       │ Encrypt token
       │ Store in DB
       │ Set session
       ↓
┌─────────────────────┐
│   Dashboard         │
└─────────────────────┘
```

### Data Sync Flow

```
┌─────────────────────┐
│  Cron Trigger       │
│  (Daily at 00:00)   │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│ Fetch Active        │
│ Profiles            │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│ For Each Profile:   │
│ - Get metrics       │
│ - Get media         │
│ - Get insights      │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│ Transform & Store   │
│ in PostgreSQL       │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│ Log Results         │
└─────────────────────┘
```

### Dashboard Data Flow

```
┌─────────────────────┐
│ User Visits Page    │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│ Server Component    │
│ Fetches from DB     │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│ Drizzle Query       │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│ PostgreSQL          │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│ Transform Data      │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│ Render Components   │
│ - Metric Cards      │
│ - Charts            │
│ - Tables            │
└─────────────────────┘
```

## Technology Stack

### Frontend Technologies

**Framework**: Next.js 14 (App Router)
- Server Components by default
- Client Components for interactivity
- Server Actions for mutations
- File-based routing

**UI Libraries**:
- React 18.3.1
- Radix UI (headless components)
- Tailwind CSS (styling)
- Recharts (charts)
- Lucide React (icons)
- date-fns (date utilities)

**Styling**:
- Tailwind CSS 3.4.1
- CSS variables for theming
- Dark/light mode support
- Responsive design utilities

### Backend Technologies

**Runtime**: Node.js >= 18.0.0
**Framework**: Next.js API Routes
**Database**: PostgreSQL >= 14
**ORM**: Drizzle ORM 0.36.4
**Scheduling**: node-cron 3.0.3

### Development Tools

**Type Safety**: TypeScript 5
**Linting**: ESLint 8
**Git Hooks**: Husky 8.0.3
**Commit Linting**: Commitlint
**Database Tools**: Drizzle Kit

## Security Architecture

### Security Layers

**Layer 1: Authentication**
- OAuth 2.0 Authorization Code Flow
- State parameter for CSRF protection
- PKCE (Proof Key for Code Exchange)

**Layer 2: Token Storage**
- AES-256-GCM encryption
- Encryption key from environment
- Tokens never exposed to client

**Layer 3: Data Protection**
- Parameterized queries (SQL injection prevention)
- Input validation with Zod
- HTTPS-only in production
- CORS configuration

**Layer 4: Session Management**
- Secure cookie flags
- Session expiration
- Token refresh mechanism

### Token Security

**Encryption Process**:
1. Receive access token from Instagram
2. Encrypt with AES-256-GCM
3. Store encrypted token in database
4. Decrypt only when needed for API calls
5. Never log or expose plaintext tokens

**Key Management**:
- `ENCRYPTION_KEY` from environment
- 32 bytes (256 bits)
- Never commit to version control
- Rotate periodically

### API Security

**Rate Limiting**:
- Instagram API rate limits
- Exponential backoff on errors
- Request queuing for bulk operations

**Input Validation**:
- Zod schemas for all inputs
- Type-safe database queries
- URL parameter validation

## Performance Optimization

### Database Optimization

**Indexing Strategy**:
- Unique indexes on IDs
- Composite indexes on frequent queries
- Timestamp indexes for date range queries

**Query Optimization**:
- Select only needed columns
- Use database aggregates
- Pagination for large datasets
- Connection pooling

### Caching Strategy

**Next.js Cache**:
- Server Component caching
- Data revalidation on demand
- Static generation where possible

**Client Caching**:
- React Query for server state
- Local storage for preferences
- Optimistic updates

### Performance Monitoring

**Metrics to Track**:
- Page load times
- API response times
- Database query times
- Error rates

## Scalability Considerations

### Horizontal Scaling

**Application Layer**:
- Stateless design
- Multiple instances supported
- Load balancer ready

**Database Layer**:
- Connection pooling
- Read replicas for analytics
- Partitioning for time-series data

### Vertical Scaling

**Resource Optimization**:
- Server Components reduce client JS
- Efficient database queries
- Lazy loading for charts
- Code splitting by route

## Deployment Architecture

### Development Environment

```
Local Machine
├── Node.js 18+
├── PostgreSQL (local/Docker)
├── Next.js dev server
└── File-based sessions
```

### Production Environment

**Recommended**: Vercel

```
Vercel
├── Edge Network
├── Serverless Functions
├── Managed PostgreSQL
└── Automatic HTTPS
```

**Alternative**: Self-hosted

```
VPS / Cloud
├── Node.js server (PM2)
├── Nginx reverse proxy
├── PostgreSQL database
└── Cron job for sync
```

### Environment Variables

**Required**:
- `DATABASE_URL` - PostgreSQL connection
- `INSTAGRAM_APP_ID` - Instagram app ID
- `INSTAGRAM_APP_SECRET` - Instagram app secret
- `INSTAGRAM_REDIRECT_URI` - OAuth callback URL
- `ENCRYPTION_KEY` - Token encryption key
- `NEXT_PUBLIC_APP_URL` - App URL

## Monitoring & Observability

### Logging

**Application Logs**:
- API request/response logs
- Error stack traces
- Sync job results
- Performance metrics

**Database Logs**:
- Query logs (development)
- Slow query detection
- Connection pool stats

### Metrics

**Key Performance Indicators**:
- Dashboard load time
- Sync job success rate
- API error rate
- Active user count

## Error Handling

### Error Types

**Authentication Errors**:
- Invalid OAuth tokens
- Expired sessions
- Authorization failures

**API Errors**:
- Rate limit exceeded
- Network timeouts
- Invalid responses

**Database Errors**:
- Connection failures
- Query errors
- Constraint violations

### Error Recovery

**Retry Strategy**:
- Exponential backoff
- Max retry attempts
- Dead letter queue for failed jobs

**User Feedback**:
- Clear error messages
- Suggested actions
- Support contact info

## Future Architecture Evolution

### Planned Enhancements

**Phase 2: Advanced Analytics**:
- Predictive analytics
- AI-powered insights
- Audience demographics
- Best posting times

**Phase 3: Multi-Account**:
- Support multiple Instagram accounts
- Account comparison
- Aggregated analytics

**Phase 4: Export & Reports**:
- PDF report generation
- CSV data export
- Scheduled email reports
- Custom report builder

**Phase 5: Real-Time Features**:
- WebSocket connections
- Live metric updates
- Real-time notifications

### Architecture Improvements

**Microservices**:
- Separate sync service
- Dedicated analytics service
- Background job queue

**Caching Layer**:
- Redis for session storage
- Redis for API response caching
- CDN for static assets

**Database Optimization**:
- Time-series database for metrics
- Read replicas for analytics
- Materialized views for aggregates

## References

### Internal Documentation
- [Project Overview PDR](./project-overview-pdr.md)
- [Codebase Summary](./codebase-summary.md)
- [Code Standards](./code-standards.md)

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Radix UI Docs](https://www.radix-ui.com/docs/primitives)

## Unresolved Questions

1. **Data Retention**: How long should we keep historical metric data?
2. **Rate Limiting**: What's the optimal rate limit for Instagram API?
3. **Caching Strategy**: Should we implement Redis for caching?
4. **Multi-Tenancy**: Should we support multiple users per account?
5. **Analytics Retention**: When should we archive old data?

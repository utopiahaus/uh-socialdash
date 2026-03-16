# Code Standards & Codebase Structure

**Last Updated**: 2026-03-16
**Version**: 0.1.0
**Project**: UH SocialDash - Instagram Analytics Dashboard

## Overview

This document defines coding standards, file organization patterns, naming conventions, and best practices for UH SocialDash. All code must adhere to these standards to ensure consistency, maintainability, and quality.

## Core Development Principles

### YAGNI (You Aren't Gonna Need It)
- Avoid over-engineering and premature optimization
- Implement features only when needed
- Don't build infrastructure for hypothetical future requirements
- Start simple, refactor when necessary

### KISS (Keep It Simple, Stupid)
- Prefer simple, straightforward solutions
- Avoid unnecessary complexity
- Write code that's easy to understand and modify
- Choose clarity over cleverness

### DRY (Don't Repeat Yourself)
- Eliminate code duplication
- Extract common logic into reusable functions/modules
- Use composition and abstraction appropriately
- Maintain single source of truth

## File Organization Standards

### Directory Structure

```
uh-socialdash/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication routes
│   ├── (dashboard)/         # Dashboard routes (protected)
│   ├── api/                 # API routes
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/              # React components
│   ├── ui/                 # UI primitives (Radix UI)
│   ├── layout/             # Layout components
│   ├── dashboard/          # Dashboard-specific components
│   └── charts/             # Chart components
├── lib/                     # Utilities and services
│   ├── db/                 # Database configuration
│   ├── api/                # API clients
│   └── services/           # Business logic
├── jobs/                    # Background jobs
├── types/                   # TypeScript type definitions
├── public/                  # Static assets
├── docs/                    # Documentation
└── tests/                   # Test files
```

### File Naming Conventions

**React Components**:
- Use PascalCase for component files
- Match file name with export name
- Examples: `DashboardLayout.tsx`, `MetricCard.tsx`, `Sidebar.tsx`

**Utility Files**:
- Use kebab-case for utility files
- Descriptive names that indicate purpose
- Examples: `instagram-client.ts`, `instagram-service.ts`, `format-utils.ts`

**API Routes**:
- Use lowercase with hyphens for route directories
- Always include `route.ts` file
- Examples: `api/auth/login/route.ts`, `api/instagram/metrics/route.ts`

**Type Definition Files**:
- Use kebab-case with `-types` suffix
- Examples: `instagram-types.ts`, `api-types.ts`

**Test Files**:
- Match source file name with `.test` or `.spec` suffix
- Examples: `instagram-service.test.ts`, `metric-card.test.tsx`

## Code Style Guidelines

### TypeScript Standards

**Type Safety**:
- Enable strict mode in `tsconfig.json`
- Avoid `any` type - use `unknown` when type is truly unknown
- Use type inference where possible
- Export types for reuse

**Example**:
```typescript
// Good - Type inference
const followers = data.followers_count;

// Good - Explicit type for API responses
interface InstagramProfile {
  id: string;
  username: string;
  followersCount: number;
}

// Bad - Using any
function processProfile(data: any) { }

// Good - Using proper types
function processProfile(data: InstagramProfile) { }
```

**Interface vs Type**:
- Use `interface` for object shapes that can be extended
- Use `type` for unions, intersections, and primitives

**Example**:
```typescript
// Interface - Extensible
interface UserProfile {
  id: string;
  username: string;
}

interface AdminProfile extends UserProfile {
  permissions: string[];
}

// Type - Unions and intersections
type MediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
type MetricData = InstagramMetrics | FacebookMetrics;
```

### React Component Standards

**Component Structure**:
```typescript
// 1. Imports
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

// 2. Types/Interfaces
interface MetricCardProps {
  title: string;
  value: number;
  trend?: 'up' | 'down' | 'neutral';
}

// 3. Component definition
export function MetricCard({ title, value, trend }: MetricCardProps) {
  // 4. Hooks
  const [isLoading, setIsLoading] = useState(false);

  // 5. Effects
  useEffect(() => {
    // Effect logic
  }, []);

  // 6. Event handlers
  const handleClick = () => {
    // Handler logic
  };

  // 7. Derived values
  const formattedValue = value.toLocaleString();

  // 8. Render
  return (
    <Card onClick={handleClick}>
      <h3>{title}</h3>
      <p>{formattedValue}</p>
    </Card>
  );
}
```

**Server vs Client Components**:
- Use Server Components by default (no `'use client'` directive)
- Use Client Components only when:
  - Using React hooks (useState, useEffect, etc.)
  - Using browser APIs (localStorage, window, etc.)
  - Handling user events (onClick, onChange, etc.)

**Example**:
```typescript
// Server Component (default)
import { db } from '@/lib/db';

export async function DashboardPage() {
  const metrics = await db.query.metricsDaily.findMany();
  return <DashboardView metrics={metrics} />;
}

// Client Component
'use client';

import { useState } from 'react';

export function MetricCard({ value }: { value: number }) {
  const [isHovered, setIsHovered] = useState(false);
  return <div onMouseEnter={() => setIsHovered(true)}>{value}</div>;
}
```

### File Size Management

**Maximum File Size**: 200 lines of code

**When file exceeds 200 lines**:
1. Extract utility functions to separate files
2. Split large components into smaller sub-components
3. Extract business logic to services
4. Create dedicated hooks for complex state logic

**Example Refactoring**:
```
Before:
app/dashboard/page.tsx (350 lines)

After:
app/dashboard/page.tsx (80 lines)           # Main component
components/dashboard/metrics-grid.tsx (100 lines)
components/dashboard/chart-section.tsx (120 lines)
lib/services/metrics-service.ts (80 lines)
```

## Naming Conventions

### Variables & Functions

**CamelCase for variables and functions**:
```typescript
const followerCount = 1000;
const isActive = true;
const accessToken = 'token';

function calculateEngagementRate() { }
const getProfileData = () => { };
```

**PascalCase for classes, interfaces, types, and components**:
```typescript
class InstagramService { }
interface UserProfile { }
type MediaType = 'IMAGE' | 'VIDEO';
export function MetricCard() { }
```

**UPPER_SNAKE_CASE for constants**:
```typescript
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://graph.instagram.com';
const DEFAULT_METRIC_DATE = '2024-01-01';
```

**Prefix private members with underscore**:
```typescript
class Database {
  private _connectionPool = null;
  private _connect() { }
}
```

### Database Naming

**Table Names**: snake_case, plural
```typescript
instagram_profiles
metrics_daily
media
media_metrics_daily
```

**Column Names**: snake_case
```typescript
followers_count
profile_pic_url
token_expires_at
```

**Enum Values**: lowercase, separated by underscore
```typescript
export const mediaTypeEnum = pgEnum("media_type", [
  "carousel_album",
  "image",
  "video",
])
```

### API Routes

**Route Structure**: `/api/{resource}/{action}`
```
/api/auth/login
/api/auth/callback
/api/instagram/profiles
/api/instagram/metrics
/api/instagram/sync
```

## Code Quality Standards

### Error Handling

**Always use try-catch for async operations**:
```typescript
export async function getProfileData(profileId: string) {
  try {
    const profile = await db.query.instagramProfiles.findFirst({
      where: eq(instagramProfiles.id, Number(profileId)),
    });

    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    return profile;
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    throw new Error('Unable to fetch profile data');
  }
}
```

**Error Types**:
```typescript
export class InstagramAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InstagramAuthError';
  }
}

export class TokenExpiredError extends Error {
  constructor() {
    super('Access token has expired');
    this.name = 'TokenExpiredError';
  }
}
```

### Input Validation

**Use Zod for runtime validation**:
```typescript
import { z } from 'zod';

export const instagramProfileSchema = z.object({
  instagramId: z.string().min(1),
  username: z.string().min(1).max(30),
  biography: z.string().optional(),
  websiteUrl: z.string().url().optional(),
});

// Usage
const validatedData = instagramProfileSchema.parse(rawData);
```

### Database Query Standards

**Use Drizzle ORM type-safe queries**:
```typescript
// Good - Type-safe with proper error handling
const profiles = await db.query.instagramProfiles.findMany({
  where: eq(instagramProfiles.isActive, true),
  orderBy: [desc(instagramProfiles.createdAt)],
  limit: 10,
});

// Good - Using the schema API
const newProfile = await db.insert(instagramProfiles)
  .values({
    instagramId: '123',
    username: 'example',
  })
  .returning()
  .then(rows => rows[0]);

// Bad - Raw SQL (avoid unless necessary)
const result = await db.execute(sql`SELECT * FROM instagram_profiles`);
```

**Use transactions for multiple operations**:
```typescript
await db.transaction(async (tx) => {
  await tx.insert(instagramProfiles).values(profileData);
  await tx.insert(metricsDaily).values(metricsData);
});
```

### API Client Standards

**Centralize API calls in client files**:
```typescript
// lib/api/instagram-client.ts
export class InstagramClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getUserProfile(): Promise<InstagramProfile> {
    const response = await fetch(
      `https://graph.instagram.com/me?fields=username,account_type&access_token=${this.accessToken}`
    );

    if (!response.ok) {
      throw new InstagramApiError(
        `API request failed: ${response.statusText}`
      );
    }

    return response.json();
  }
}
```

**Handle rate limiting**:
```typescript
async fetchWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.status === 429) {
        // Rate limited - wait and retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
}
```

## Security Standards

### Token Management

**Never expose access tokens to client**:
```typescript
// Good - Server-side only
export async function GET() {
  const profile = await getProfileWithToken();
  return Response.json({
    username: profile.username,
    // Don't send accessToken to client
  });
}

// Bad - Exposing token
export async function GET() {
  const profile = await getProfileWithToken();
  return Response.json({
    username: profile.username,
    accessToken: profile.accessToken // NEVER DO THIS
  });
}
```

**Encrypt sensitive data**:
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const ALGORITHM = 'aes-256-gcm';

export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptToken(encryptedToken: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedToken.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### OAuth Security

**Use state parameter for CSRF protection**:
```typescript
export async function GET() {
  const state = crypto.randomBytes(16).toString('hex');
  // Store state in session/database
  const authUrl = new URL('https://api.instagram.com/oauth/authorize');
  authUrl.searchParams.set('client_id', INSTAGRAM_APP_ID);
  authUrl.searchParams.set('redirect_uri', INSTAGRAM_REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);
  return redirect(authUrl.toString());
}
```

**Validate state on callback**:
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state');
  const code = searchParams.get('code');

  // Validate state
  const savedState = await getState(state);
  if (!savedState) {
    throw new Error('Invalid state parameter');
  }

  // Exchange code for token
  // ...
}
```

### SQL Injection Prevention

**Use parameterized queries**:
```typescript
// Good - Parameterized via Drizzle
const profile = await db.query.instagramProfiles.findFirst({
  where: eq(instagramProfiles.username, userInput),
});

// Bad - String concatenation (DON'T DO THIS)
const result = await db.execute(
  sql`SELECT * FROM instagram_profiles WHERE username = '${userInput}'`
);
```

## Testing Standards

### Test Structure

**Arrange-Act-Assert pattern**:
```typescript
describe('InstagramService', () => {
  describe('calculateEngagementRate', () => {
    it('should calculate engagement rate correctly', async () => {
      // Arrange
      const likes = 1000;
      const comments = 100;
      const followers = 10000;

      // Act
      const rate = calculateEngagementRate(likes, comments, followers);

      // Assert
      expect(rate).toBeCloseTo(11.0); // (1000 + 100) / 10000 * 100
    });
  });
});
```

### Test Coverage

**Target**: > 80% code coverage

**Critical areas to test**:
- API routes
- Service layer functions
- Data transformation logic
- Error handling
- Token encryption/decryption

## Git Standards

### Commit Message Format

**Conventional Commits**:
```
type(scope): description

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Maintenance tasks

**Examples**:
```
feat(dashboard): add follower growth chart

Implements line chart showing follower growth over time.
Includes tooltips and responsive design.

Closes #123

---

fix(auth): resolve token refresh failure

Token refresh was failing due to incorrect timestamp comparison.
Fixed by using Date objects instead of string comparison.

---

docs: update API documentation

Added new endpoints for media metrics.
```

### Branch Naming

**Format**: `type/description`

**Examples**:
```
feature/follower-analytics
fix/token-refresh-error
refactor/database-schema
docs/update-readme
```

## Documentation Standards

### Code Comments

**When to comment**:
- Complex business logic
- Non-obvious algorithms
- Workarounds for bugs/limitations
- Public API functions

**Example**:
```typescript
/**
 * Calculates engagement rate based on Instagram's formula
 *
 * Engagement Rate = ((Likes + Comments) / Followers) * 100
 *
 * @param likes - Number of likes on a post
 * @param comments - Number of comments on a post
 * @param followers - Total follower count
 * @returns Engagement rate as a percentage
 */
export function calculateEngagementRate(
  likes: number,
  comments: number,
  followers: number
): number {
  if (followers === 0) return 0;
  return ((likes + comments) / followers) * 100;
}
```

### README Standards

Every major component/module should have:
1. Purpose description
2. Usage examples
3. API documentation (if applicable)
4. Dependencies

## Performance Standards

### Database Queries

**Use indexes for frequent queries**:
```typescript
// lib/db/schema.ts
export const instagramProfiles = pgTable(
  "instagram_profiles",
  {
    // ... columns
  },
  (table) => ({
    usernameIdx: index("instagram_profiles_username_idx").on(table.username),
    activeIdx: index("instagram_profiles_active_idx").on(table.isActive),
  })
)
```

**Select only needed columns**:
```typescript
// Good - Select specific columns
const profiles = await db
  .select({ username: instagramProfiles.username })
  .from(instagramProfiles);

// Avoid - Select all when not needed
const profiles = await db.query.instagramProfiles.findMany();
```

### Server Components

**Leverage server components for performance**:
```typescript
// Good - Server component (no client JS)
export async function DashboardMetrics() {
  const metrics = await getMetrics();
  return <MetricGrid data={metrics} />;
}

// Client component only when needed
'use client';
export function InteractiveChart({ data }: { data: ChartData }) {
  // Uses React hooks - must be client component
}
```

## Unresolved Questions

None. All code standards are well-defined and documented.

## References

### Internal Documentation
- [Project Overview PDR](./project-overview-pdr.md)
- [Codebase Summary](./codebase-summary.md)
- [System Architecture](./system-architecture.md)

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Radix UI Docs](https://www.radix-ui.com/docs/primitives)
- [Conventional Commits](https://conventionalcommits.org/)

# Literati: Development Best Practices & Guidelines

## Code Quality Standards

### TypeScript & JavaScript Best Practices

#### Code Style & Formatting
- **ESLint + Prettier**: Automated code formatting and linting
- **Strict TypeScript**: Enable strict mode for type safety
- **Naming Conventions**: 
  - camelCase for variables and functions
  - PascalCase for components and classes
  - UPPER_SNAKE_CASE for constants
  - kebab-case for file names

#### Type Safety Guidelines
```typescript
// Use strict types, avoid 'any'
interface BookMetadata {
  title: string;
  author: string;
  isbn?: string;
  publishedYear: number;
}

// Proper error handling with custom types
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Use utility types for maintainability
type PartialBookUpdate = Partial<Pick<BookMetadata, 'title' | 'author'>>;
```

#### Component Architecture (React/Next.js)
```typescript
// Functional components with proper typing
interface ReadingPanelProps {
  bookId: string;
  onQuestionSubmit: (question: string) => Promise<void>;
  isLoading: boolean;
}

export const ReadingPanel: React.FC<ReadingPanelProps> = ({
  bookId,
  onQuestionSubmit,
  isLoading
}) => {
  // Component implementation
};

// Custom hooks for reusable logic
export const useBookData = (bookId: string) => {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Hook implementation
  return { book, loading, refetch };
};
```

### Backend Development (Node.js/Express)

#### API Design Principles
- **RESTful Conventions**: Consistent URL patterns and HTTP methods
- **Request Validation**: Use Joi or Zod for input validation
- **Error Handling**: Consistent error response format
- **Authentication**: JWT with proper middleware

```typescript
// Proper API endpoint structure
router.post('/books/:bookId/questions', 
  authenticate,
  validateRequest(questionSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await aiService.processQuestion(
        req.params.bookId,
        req.body.question,
        req.user.id
      );
      
      res.json({ success: true, data: result });
    } catch (error) {
      next(error); // Let error handler middleware deal with it
    }
  }
);

// Input validation schemas
const questionSchema = z.object({
  question: z.string().min(1).max(1000),
  context: z.string().optional(),
});
```

#### Database Best Practices (PostgreSQL + Prisma)
```typescript
// Proper Prisma schema design
model Book {
  id          String   @id @default(cuid())
  title       String
  author      String
  content     String
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id])
  embeddings  BookEmbedding[]
  questions   Question[]

  @@index([userId])
  @@index([title, author])
}

// Efficient query patterns
const getBookWithRelatedData = async (bookId: string, userId: string) => {
  return await prisma.book.findFirst({
    where: { id: bookId, userId },
    include: {
      embeddings: {
        select: { id: true, chunkText: true }
      },
      questions: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });
};
```

### AI Service Development (Python/FastAPI)

#### Code Organization
```python
# Proper dependency injection and structure
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional

class QuestionRequest(BaseModel):
    question: str
    book_id: str
    context: Optional[str] = None

class AIService:
    def __init__(self, vector_store: VectorStore, llm: LLM):
        self.vector_store = vector_store
        self.llm = llm
    
    async def process_question(self, request: QuestionRequest) -> str:
        # Retrieve relevant context
        context = await self.vector_store.similarity_search(
            request.question, 
            filter={"book_id": request.book_id}
        )
        
        # Generate response with context
        response = await self.llm.generate_response(
            question=request.question,
            context=context
        )
        
        return response

# Dependency injection
def get_ai_service() -> AIService:
    return AIService(
        vector_store=get_vector_store(),
        llm=get_llm_instance()
    )
```

---

## Testing Strategy & Implementation

### Frontend Testing (Jest + React Testing Library)

#### Component Testing
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuestionPanel } from './QuestionPanel';

describe('QuestionPanel', () => {
  const mockOnSubmit = jest.fn();
  
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('should submit question when form is filled', async () => {
    render(<QuestionPanel onSubmit={mockOnSubmit} />);
    
    const input = screen.getByLabelText(/ask a question/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });
    
    fireEvent.change(input, { target: { value: 'Who is the protagonist?' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('Who is the protagonist?');
    });
  });

  it('should show loading state during submission', async () => {
    render(<QuestionPanel onSubmit={mockOnSubmit} isLoading={true} />);
    
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

#### Custom Hook Testing
```typescript
import { renderHook, act } from '@testing-library/react';
import { useBookData } from './useBookData';

describe('useBookData', () => {
  it('should fetch book data on mount', async () => {
    const { result } = renderHook(() => useBookData('book-123'));
    
    expect(result.current.loading).toBe(true);
    
    await act(async () => {
      // Wait for the hook to complete
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.book).toBeDefined();
  });
});
```

### Backend Testing (Jest + Supertest)

#### API Endpoint Testing
```typescript
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../lib/prisma';

describe('Books API', () => {
  beforeEach(async () => {
    await prisma.book.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/books', () => {
    it('should create a new book', async () => {
      const userData = await createTestUser();
      const token = generateTestToken(userData.id);
      
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', 'test-fixtures/sample-book.epub')
        .expect(201);
      
      expect(response.body.data.title).toBeDefined();
      expect(response.body.data.author).toBeDefined();
    });

    it('should reject invalid file types', async () => {
      const userData = await createTestUser();
      const token = generateTestToken(userData.id);
      
      await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', 'test-fixtures/invalid-file.txt')
        .expect(400);
    });
  });
});
```

### AI Service Testing (pytest)

#### AI Processing Tests
```python
import pytest
from unittest.mock import Mock, AsyncMock
from ai_service.core.question_processor import QuestionProcessor

@pytest.fixture
def mock_vector_store():
    store = Mock()
    store.similarity_search = AsyncMock(return_value=[
        {"content": "Sample context", "metadata": {"chapter": 1}}
    ])
    return store

@pytest.fixture
def mock_llm():
    llm = Mock()
    llm.generate_response = AsyncMock(return_value="Sample response")
    return llm

@pytest.mark.asyncio
async def test_question_processing(mock_vector_store, mock_llm):
    processor = QuestionProcessor(mock_vector_store, mock_llm)
    
    result = await processor.process_question(
        question="Who is the main character?",
        book_id="test-book-123"
    )
    
    assert result == "Sample response"
    mock_vector_store.similarity_search.assert_called_once()
    mock_llm.generate_response.assert_called_once()

@pytest.mark.asyncio
async def test_question_processing_with_error_handling(mock_vector_store, mock_llm):
    mock_vector_store.similarity_search.side_effect = Exception("Database error")
    
    processor = QuestionProcessor(mock_vector_store, mock_llm)
    
    with pytest.raises(Exception) as exc_info:
        await processor.process_question("Test question", "test-book")
    
    assert "Database error" in str(exc_info.value)
```

---

## Security Best Practices

### Authentication & Authorization

#### JWT Security
```typescript
// Secure JWT implementation
import jwt from 'jsonwebtoken';
import { promisify } from 'util';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

export const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN, issuer: 'literati' }
  );
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN, issuer: 'literati' }
  );
  
  return { accessToken, refreshToken };
};

export const verifyToken = async (token: string): Promise<{ userId: string }> => {
  try {
    const decoded = await promisify(jwt.verify)(token, JWT_SECRET) as any;
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    return { userId: decoded.userId };
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
};
```

#### Input Validation & Sanitization
```typescript
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Comprehensive input validation
export const bookUploadSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title too long')
    .refine(title => DOMPurify.sanitize(title) === title, 'Invalid characters'),
  
  author: z.string()
    .min(1, 'Author is required')
    .max(100, 'Author name too long'),
  
  file: z.object({
    mimetype: z.enum(['application/epub+zip', 'application/pdf']),
    size: z.number().max(50 * 1024 * 1024, 'File too large (max 50MB)')
  })
});

// SQL injection prevention with Prisma
export const getUserBooks = async (userId: string, search?: string) => {
  return await prisma.book.findMany({
    where: {
      userId: userId, // Prisma handles parameterization
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { author: { contains: search, mode: 'insensitive' } }
        ]
      })
    }
  });
};
```

### Data Protection

#### Encryption at Rest
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes key
const IV_LENGTH = 16; // For AES, this is always 16

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

export const decrypt = (encryptedText: string): string => {
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
```

#### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'redis';

const redis = Redis.createClient();

// Different limits for different endpoints
export const authLimiter = rateLimit({
  store: new RedisStore({ client: redis }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts',
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiQueryLimiter = rateLimit({
  store: new RedisStore({ client: redis }),
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 AI queries per minute
  message: 'Too many AI queries, please slow down',
  keyGenerator: (req) => req.user?.id || req.ip, // Rate limit by user
});
```

---

## Performance Optimization

### Frontend Performance

#### Code Splitting & Lazy Loading
```typescript
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from './components/LoadingSpinner';

// Route-based code splitting
const ReadingInterface = lazy(() => import('./pages/ReadingInterface'));
const Library = lazy(() => import('./pages/Library'));
const Settings = lazy(() => import('./pages/Settings'));

// Component-based code splitting
const AIChat = lazy(() => import('./components/AIChat'));

export const App = () => {
  return (
    <Routes>
      <Route path="/read/:bookId" element={
        <Suspense fallback={<LoadingSpinner />}>
          <ReadingInterface />
        </Suspense>
      } />
      <Route path="/library" element={
        <Suspense fallback={<LoadingSpinner />}>
          <Library />
        </Suspense>
      } />
    </Routes>
  );
};
```

#### Optimized Data Fetching
```typescript
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

// Efficient data fetching with caching
export const useBookData = (bookId: string) => {
  return useQuery({
    queryKey: ['book', bookId],
    queryFn: () => fetchBook(bookId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};

// Memoized expensive calculations
export const useBookAnalytics = (book: Book) => {
  return useMemo(() => {
    if (!book) return null;
    
    return {
      readingTime: calculateReadingTime(book.content),
      complexity: analyzeComplexity(book.content),
      themes: extractThemes(book.content),
    };
  }, [book?.id, book?.content]); // Only recalculate when book changes
};
```

### Backend Performance

#### Database Optimization
```typescript
// Efficient database queries with proper indexing
// In Prisma schema:
// @@index([userId, createdAt])
// @@index([title, author])

export const getPaginatedBooks = async (
  userId: string,
  page: number = 1,
  limit: number = 20
) => {
  const offset = (page - 1) * limit;
  
  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        author: true,
        createdAt: true,
        // Don't select large content field for list view
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.book.count({ where: { userId } })
  ]);
  
  return {
    books,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};
```

#### Caching Strategy
```typescript
import Redis from 'redis';

const redis = Redis.createClient();

// Multilayer caching strategy
export class CacheService {
  // Cache AI responses for common questions
  async cacheAIResponse(key: string, response: string, ttl: number = 3600) {
    await redis.setex(`ai:${key}`, ttl, JSON.stringify(response));
  }
  
  async getCachedAIResponse(key: string): Promise<string | null> {
    const cached = await redis.get(`ai:${key}`);
    return cached ? JSON.parse(cached) : null;
  }
  
  // Cache book metadata
  async cacheBookMetadata(bookId: string, metadata: any) {
    await redis.setex(`book:${bookId}`, 1800, JSON.stringify(metadata));
  }
  
  // Cache user sessions
  async cacheUserSession(userId: string, sessionData: any) {
    await redis.setex(`session:${userId}`, 3600, JSON.stringify(sessionData));
  }
}
```

### AI Service Performance

#### Batch Processing & Caching
```python
import asyncio
from typing import List, Dict
from functools import lru_cache

class AIOptimizer:
    def __init__(self):
        self.response_cache = {}
        self.batch_queue = []
    
    @lru_cache(maxsize=1000)
    def get_cached_embedding(self, text: str) -> List[float]:
        """Cache embeddings for frequently used text chunks"""
        return self.embedding_model.encode(text)
    
    async def batch_process_questions(self, questions: List[Dict]) -> List[str]:
        """Process multiple questions in batch for efficiency"""
        # Group questions by book_id for context efficiency
        grouped_questions = self._group_by_book(questions)
        
        results = []
        for book_id, book_questions in grouped_questions.items():
            # Retrieve context once per book
            context = await self.get_book_context(book_id)
            
            # Process questions for this book
            book_results = await asyncio.gather(*[
                self.process_single_question(q, context)
                for q in book_questions
            ])
            results.extend(book_results)
        
        return results
    
    def _group_by_book(self, questions: List[Dict]) -> Dict[str, List[Dict]]:
        """Group questions by book_id for efficient processing"""
        grouped = {}
        for q in questions:
            book_id = q['book_id']
            if book_id not in grouped:
                grouped[book_id] = []
            grouped[book_id].append(q)
        return grouped
```

---

## Monitoring & Observability

### Application Monitoring

#### **SETUP: Sentry Error Tracking**
**REQUIRED**: Implement comprehensive error tracking and monitoring:

**1. Install Sentry Dependencies:**
```bash
npm install --save @sentry/nextjs @sentry/profiling-node
```

**2. Create `sentry.client.config.ts`:**
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Filter out sensitive information
    if (event.user) {
      delete event.user.email;
    }
    // Remove sensitive request data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.authorization;
    }
    return event;
  },
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ["localhost", /^https:\/\/yourapi\.domain\.com\/api/],
    }),
  ],
});
```

**3. Create `sentry.server.config.ts`:**
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.ProfilingIntegration(),
  ],
  profilesSampleRate: 1.0,
});
```

**4. Create Error Tracking Utilities (`lib/sentry.ts`):**
```typescript
import * as Sentry from '@sentry/nextjs';

// Custom error tracking
export const trackError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('additional_info', context);
      scope.setLevel('error');
    }
    Sentry.captureException(error);
  });
};

// Performance monitoring
export const trackPerformance = (name: string, fn: () => Promise<any>) => {
  return Sentry.startTransaction({ name }, async (transaction) => {
    try {
      const result = await fn();
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      trackError(error as Error, { transactionName: name });
      throw error;
    } finally {
      transaction.finish();
    }
  });
};

// User context tracking
export const setUserContext = (user: { id: string; plan?: string }) => {
  Sentry.setUser({
    id: user.id,
    subscription: user.plan,
  });
};

// AI Query tracking
export const trackAIQuery = (queryData: {
  question: string;
  bookId: string;
  responseTime: number;
  success: boolean;
}) => {
  Sentry.addBreadcrumb({
    message: 'AI Query Processed',
    category: 'ai',
    level: 'info',
    data: {
      bookId: queryData.bookId,
      questionLength: queryData.question.length,
      responseTime: queryData.responseTime,
      success: queryData.success,
    },
  });
};
```

**5. Update `next.config.js` for Sentry:**
```javascript
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  // ... existing config
};

const sentryWebpackPluginOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
```

#### **SETUP: Analytics & Business Metrics**
**REQUIRED**: Implement comprehensive user analytics and business metrics:

**1. Install Analytics Dependencies:**
```bash
npm install --save posthog-js @vercel/analytics @vercel/speed-insights
```

**2. Create Analytics Service (`lib/analytics.ts`):**
```typescript
import posthog from 'posthog-js';
import { analytics } from '@vercel/analytics';

// Initialize PostHog (client-side)
if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
  });
}

export class AnalyticsService {
  // Track user actions
  async trackUserAction(action: string, userId: string, metadata?: any) {
    const event = {
      action,
      userId,
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
    };
    
    // PostHog tracking
    posthog.capture(action, {
      userId,
      ...metadata,
    });
    
    // Vercel Analytics
    analytics.track(action, metadata);
  }
  
  // AI-specific metrics
  async trackAIQueryMetrics(query: string, responseTime: number, userId: string) {
    await this.trackUserAction('ai_query', userId, {
      queryLength: query.length,
      responseTime,
      queryType: this.classifyQuery(query),
      aiModel: 'gpt-4', // or dynamic
    });
  }
  
  // Reading progress tracking
  async trackReadingProgress(bookId: string, userId: string, progress: number) {
    await this.trackUserAction('reading_progress', userId, {
      bookId,
      progress,
      sessionDuration: this.calculateSessionDuration(userId),
      pageCount: Math.floor(progress * 100),
    });
  }
  
  // Business metrics
  async trackSubscriptionEvent(userId: string, plan: string, action: 'upgrade' | 'downgrade' | 'cancel') {
    await this.trackUserAction('subscription_change', userId, {
      plan,
      action,
      mrr_impact: this.calculateMRRImpact(plan, action),
    });
  }
  
  // Feature usage tracking
  async trackFeatureUsage(feature: string, userId: string, success: boolean) {
    await this.trackUserAction('feature_used', userId, {
      feature,
      success,
      timestamp: Date.now(),
    });
  }
  
  // Error tracking for business impact
  async trackBusinessError(error: string, userId: string, impact: 'low' | 'medium' | 'high') {
    await this.trackUserAction('business_error', userId, {
      error,
      impact,
      affectedFeature: this.determineAffectedFeature(error),
    });
  }
  
  private classifyQuery(query: string): string {
    // Classify query types for analytics
    if (query.includes('character') || query.includes('who is')) return 'character_inquiry';
    if (query.includes('theme') || query.includes('meaning')) return 'theme_analysis';
    if (query.includes('summary') || query.includes('summarize')) return 'summary_request';
    return 'general_question';
  }
  
  private calculateSessionDuration(userId: string): number {
    // Implementation for session duration calculation
    return 0; // Placeholder
  }
  
  private calculateMRRImpact(plan: string, action: string): number {
    // Calculate Monthly Recurring Revenue impact
    const planValues = { basic: 9.99, premium: 19.99, enterprise: 49.99 };
    return planValues[plan as keyof typeof planValues] || 0;
  }
  
  private determineAffectedFeature(error: string): string {
    // Map errors to features for business impact analysis
    if (error.includes('upload')) return 'book_upload';
    if (error.includes('ai') || error.includes('query')) return 'ai_assistant';
    if (error.includes('auth')) return 'authentication';
    return 'unknown';
  }
}

// Singleton instance
export const analytics = new AnalyticsService();
```

**3. Create Monitoring Dashboard Hook (`hooks/useAnalytics.ts`):**
```typescript
import { useEffect } from 'react';
import { analytics } from '@/lib/analytics';
import { useUser } from '@clerk/nextjs'; // or your auth solution

export const useAnalytics = () => {
  const { user } = useUser();
  
  useEffect(() => {
    if (user) {
      // Set user context for all tracking
      analytics.trackUserAction('page_view', user.id, {
        path: window.location.pathname,
        referrer: document.referrer,
      });
    }
  }, [user]);
  
  return {
    trackAIQuery: (query: string, responseTime: number) => {
      if (user) {
        analytics.trackAIQueryMetrics(query, responseTime, user.id);
      }
    },
    trackReadingProgress: (bookId: string, progress: number) => {
      if (user) {
        analytics.trackReadingProgress(bookId, user.id, progress);
      }
    },
    trackFeatureUsage: (feature: string, success: boolean) => {
      if (user) {
        analytics.trackFeatureUsage(feature, user.id, success);
      }
    },
  };
};
```

**4. Key Business Metrics to Track:**
```typescript
// Define important KPIs for Literati
export const BUSINESS_METRICS = {
  // User Engagement
  DAILY_ACTIVE_USERS: 'dau',
  WEEKLY_ACTIVE_USERS: 'wau', 
  MONTHLY_ACTIVE_USERS: 'mau',
  SESSION_DURATION: 'session_duration',
  BOOKS_READ_PER_USER: 'books_per_user',
  
  // AI Usage
  AI_QUERIES_PER_SESSION: 'ai_queries_session',
  AI_RESPONSE_SATISFACTION: 'ai_satisfaction',
  AI_RESPONSE_TIME: 'ai_response_time',
  
  // Business Growth
  USER_ACQUISITION_COST: 'cac',
  LIFETIME_VALUE: 'ltv',
  CHURN_RATE: 'churn_rate',
  CONVERSION_RATE: 'conversion_rate',
  
  // Feature Adoption
  EPUB_UPLOAD_SUCCESS_RATE: 'epub_success_rate',
  CROSS_PLATFORM_USAGE: 'cross_platform',
  SHARING_FREQUENCY: 'sharing_rate',
} as const;
```

---

## Deployment Best Practices

### Pre-Commit Validation (MANDATORY)
Always run these THREE commands before any commit:
```bash
npm run build        # Catch build errors locally
npm run type-check   # Catch TypeScript issues  
npm run lint         # Catch syntax problems
```

**Why This Matters:**
- Prevents broken builds from reaching the repository
- Catches type errors early in development
- Maintains consistent code quality standards
- Saves CI/CD resources and time

#### **SETUP: Automated Pre-Commit Hooks**
**REQUIRED**: Install and configure pre-commit validation:

**1. Install Husky for Git Hooks:**
```bash
npm install --save-dev husky
npx husky install
npm set-script prepare "husky install"
```

**2. Create Pre-Commit Hook:**
```bash
npx husky add .husky/pre-commit "npm run pre-commit"
```

**3. Add Pre-Commit Script to package.json:**
```json
{
  "scripts": {
    "pre-commit": "npm run type-check && npm run lint && npm run build"
  }
}
```

**4. Optional: Add Lint-Staged for Performance:**
```bash
npm install --save-dev lint-staged
```

**Add to package.json:**
```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{ts,tsx}": ["tsc --noEmit"]
  },
  "scripts": {
    "pre-commit": "lint-staged && npm run build"
  }
}
```

### Git Workflow Standards

#### Commit Message Format
```bash
# Use conventional commits format
git commit -m "feat(auth): add user registration with email verification

- Implement Clerk integration for secure authentication
- Add email verification flow with templates
- Create user profile setup wizard
- Add proper error handling and validation

Closes #AUTH-001"
```

#### Branch Protection Rules
- **Main branch**: Always protected, requires PR approval
- **Feature branches**: Use descriptive names like `feat/auth-system` or `fix/book-upload-bug`
- **Hotfix branches**: For critical production fixes only

### Environment Management

#### Environment Variables Setup
**REQUIRED**: Create these environment files for proper configuration management:

**1. Create `.env.local` (Development)**
```bash
# Database Configuration
DATABASE_URL="postgresql://localhost:5432/literati_dev"

# Authentication
NEXTAUTH_SECRET="your-dev-secret-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# AI Services
OPENAI_API_KEY="sk-dev-key"
ANTHROPIC_API_KEY="sk-ant-dev-key"

# Clerk Authentication (if using)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Vector Database (Pinecone/Supabase)
PINECONE_API_KEY="your-pinecone-key"
PINECONE_ENVIRONMENT="us-west1-gcp"

# File Storage (AWS S3/Supabase)
AWS_ACCESS_KEY_ID="dev-access-key"
AWS_SECRET_ACCESS_KEY="dev-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="literati-dev-storage"
```

**2. Create `.env.production` (Production)**
```bash
# Database Configuration
DATABASE_URL="postgresql://prod-host:5432/literati_prod"

# Authentication
NEXTAUTH_SECRET="secure-prod-secret-min-32-chars"
NEXTAUTH_URL="https://yourdomain.com"

# AI Services
OPENAI_API_KEY="sk-prod-key"
ANTHROPIC_API_KEY="sk-ant-prod-key"

# Clerk Authentication (if using)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_SECRET_KEY="sk_live_..."

# Vector Database
PINECONE_API_KEY="your-prod-pinecone-key"
PINECONE_ENVIRONMENT="us-west1-gcp"

# File Storage
AWS_ACCESS_KEY_ID="prod-access-key"
AWS_SECRET_ACCESS_KEY="prod-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="literati-prod-storage"

# Monitoring & Analytics
SENTRY_DSN="https://your-sentry-dsn"
SENTRY_ORG="your-org"
SENTRY_PROJECT="literati"
```

**3. Update `.gitignore` to exclude environment files:**
```bash
# Environment files
.env
.env.local
.env.production
.env.*.local
```

#### Configuration Management
- **Never commit secrets** to version control
- Use different API keys for dev/staging/production
- Implement proper secret rotation policies
- Use environment-specific database connections

### CI/CD Pipeline Standards

#### **SETUP: GitHub Actions CI/CD Pipeline**
**REQUIRED**: Create automated testing and deployment pipeline:

**1. Create `.github/workflows/ci.yml`:**
```yaml
name: Literati CI/CD
on: 
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  quality-check:
    name: Quality Checks
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint code
        run: npm run lint:check
      
      - name: Run tests
        run: npm run test:ci
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      
      - name: Build application
        run: npm run build
        env:
          SKIP_ENV_VALIDATION: true
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        if: success()

  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run security audit
        run: npm audit --audit-level high
      
      - name: Scan for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD

  deploy-staging:
    name: Deploy to Staging
    needs: [quality-check, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel (Staging)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}

  deploy-production:
    name: Deploy to Production
    needs: [quality-check, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.VERCEL_ORG_ID }}
```

**2. Required GitHub Secrets:**
Add these secrets in GitHub repository settings:
- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Your Vercel organization ID  
- `VERCEL_PROJECT_ID` - Your Vercel project ID

#### Deployment Gates
- **Quality Gate**: All tests must pass
- **Security Gate**: No high-severity vulnerabilities
- **Performance Gate**: Build size under threshold
- **Manual Approval**: Required for production deployments

### Database Migration Safety

#### Migration Best Practices
```sql
-- Always use transactions for complex migrations
BEGIN;

-- Add new columns as nullable first
ALTER TABLE books ADD COLUMN reading_level INTEGER;

-- Populate data
UPDATE books SET reading_level = 1 WHERE complexity_score < 5;

-- Add constraints after data population
ALTER TABLE books ALTER COLUMN reading_level SET NOT NULL;

COMMIT;
```

#### Rollback Strategy
- **Always test migrations** on staging first
- **Backup production database** before major migrations
- **Have rollback scripts** ready for each migration
- **Monitor application** closely after migrations

### Production Deployment Checklist

#### Pre-Deployment
- [ ] All tests passing in CI/CD
- [ ] Security scan completed with no critical issues
- [ ] Performance benchmarks meet requirements
- [ ] Database migrations tested on staging
- [ ] Monitoring and alerting configured
- [ ] Rollback plan documented and tested

#### During Deployment
- [ ] Use blue-green deployment strategy
- [ ] Monitor error rates and response times
- [ ] Verify critical user journeys work
- [ ] Check database connections and queries
- [ ] Validate AI service integrations

#### Post-Deployment
- [ ] Monitor logs for any errors or warnings
- [ ] Check performance metrics against baseline
- [ ] Verify user authentication and core features
- [ ] Test AI query processing end-to-end
- [ ] Update monitoring dashboards
- [ ] Document any issues or learnings

### Emergency Response Procedures

#### Incident Response
1. **Immediate**: Assess impact and severity
2. **Communicate**: Notify stakeholders and users if needed
3. **Mitigate**: Implement quick fixes or rollback
4. **Investigate**: Root cause analysis
5. **Document**: Post-mortem and preventive measures

#### Rollback Procedures
```bash
# Quick rollback using git
git revert HEAD
git push origin main

# Database rollback (if needed)
npm run db:rollback

# Clear caches
npm run cache:clear
```

### Monitoring & Alerting

#### Key Metrics to Monitor
- **Application Performance**: Response times, error rates
- **Infrastructure**: CPU, memory, disk usage
- **Business Metrics**: User registrations, AI queries
- **Security**: Failed login attempts, API abuse

#### Alert Thresholds
- **Critical**: API error rate > 5%, Response time > 5s
- **Warning**: API error rate > 1%, Response time > 3s
- **Info**: Deployment completed, New user registration

This comprehensive guide ensures high-quality, secure, and performant code throughout the Literati development process.
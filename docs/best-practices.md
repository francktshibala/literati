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

#### Error Tracking (Sentry)
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filter out sensitive information
    if (event.user) {
      delete event.user.email;
    }
    return event;
  },
});

// Custom error tracking
export const trackError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('additional_info', context);
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
      throw error;
    } finally {
      transaction.finish();
    }
  });
};
```

#### Custom Metrics & Analytics
```typescript
// Custom analytics service
export class AnalyticsService {
  async trackUserAction(action: string, userId: string, metadata?: any) {
    const event = {
      action,
      userId,
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
    };
    
    // Send to analytics service (e.g., Mixpanel, PostHog)
    await this.sendEvent(event);
  }
  
  async trackAIQueryMetrics(query: string, responseTime: number, userId: string) {
    await this.trackUserAction('ai_query', userId, {
      queryLength: query.length,
      responseTime,
      queryType: this.classifyQuery(query),
    });
  }
  
  async trackReadingProgress(bookId: string, userId: string, progress: number) {
    await this.trackUserAction('reading_progress', userId, {
      bookId,
      progress,
      sessionDuration: this.calculateSessionDuration(userId),
    });
  }
}
```

This comprehensive guide ensures high-quality, secure, and performant code throughout the Literati development process.
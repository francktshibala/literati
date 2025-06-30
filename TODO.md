# Literati TODO - Current Sprint

## 🎯 Current Focus: Phase 1, Month 1, Week 1-2  
**Sprint Goal**: Core Value Delivery - EPUB Processing & AI Q&A

## 📋 Active Tasks
See detailed breakdown in: **[todos/phase1-month1.md](todos/phase1-month1.md)**

### This Week (Week 1-2) - VALUE-FIRST APPROACH
- [x] **SETUP-001**: Configure Tailwind CSS and development tools ✅ *COMPLETED*
- [x] **AUTH-001**: Initialize Next.js 14 project with TypeScript ✅ *COMPLETED*
- [x] **DB-001**: Set up PostgreSQL database with pgvector extension ✅ *COMPLETED*
- [x] **INFRA-001**: Create README.md and fix Prisma configuration ✅ *COMPLETED*
- [x] **DEPLOY-001**: Deploy working version to Vercel ✅ *COMPLETED*
- [x] **FILE-001**: EPUB upload and processing pipeline 🔥 *PRIORITY*
  - [x] **FILE-001a**: Basic EPUB upload with security validation ✅ *COMPLETED*
  - [x] **FILE-001b**: Metadata extraction and database storage ✅ *COMPLETED*
  - [x] **FILE-001c**: Chapter extraction and text cleaning ✅ *COMPLETED (Backend)*
  - [ ] **FILE-001c-FIX**: Environment variable configuration issue 🔧 *CURRENT ISSUE*
  - [ ] **FILE-001d**: Text chunking for AI processing
- [ ] **AI-001**: Basic AI Q&A without authentication 🔥 *PRIORITY*
- [ ] **UI-001**: Clean reading interface with AI panel 🔥 *PRIORITY*

### Week 3-4 - RETENTION FEATURES
- [ ] **AUTH-002**: Configure Clerk authentication system
- [ ] **LIBRARY-001**: Personal book library management
- [ ] **PROGRESS-001**: Reading progress tracking and analytics

### Sprint Success Criteria
- ✅ Production-ready infrastructure setup
- ✅ Database schema properly configured
- ✅ Live deployment working (https://literati-jade.vercel.app/)
- ✅ Professional GitHub repository with documentation
- 🎯 **Users can upload EPUB files and get AI answers immediately**
- 🎯 **Clean reading experience with contextual AI assistance**
- 🎯 **Demonstrate core value proposition without friction**

## 📊 Sprint Progress
**Completion**: 7/8 tasks (87.5%)  
**Days Remaining**: 10 days  
**Risk Level**: 🟡 Medium (Backend complete, environment variable issue blocking frontend integration)

## 🔧 CURRENT ISSUE: FILE-001c-FIX
**Problem**: Next.js client-side cannot access `NEXT_PUBLIC_EPUB_API_URL` environment variable  
**Impact**: Railway Python API working perfectly, but frontend falls back to basic metadata  
**Status**: Needs Claude AI research for Next.js + Vercel environment variable configuration

### 🔥 PRIORITY SHIFT: Core Value First
**Why**: Users need to experience the AI reading magic before signup friction  
**Impact**: Higher conversion rates, faster user feedback, competitive advantage  
**Timeline**: Core features first, then authentication for retention

## 🔗 Quick Links
- **Current Sprint**: [todos/phase1-month1.md](todos/phase1-month1.md)
- **Full Roadmap**: [docs/development-phases.md](docs/development-phases.md)
- **Tech Specs**: [docs/technical-spec.md](docs/technical-spec.md)

## 📅 Implementation Strategy

### **FILE-001: EPUB Processing - Incremental Breakdown**

**Week 1 - Foundation (FILE-001a & FILE-001b)**
- [ ] **FILE-001a**: Basic EPUB upload with security validation
  - Set up file upload API route (`/api/upload-epub`)
  - File validation (size, type, structure)
  - Security measures (filename sanitization, CSRF protection)
  - **Test**: Upload sample EPUB, verify security checks
  - **Commit**: "feat: Add secure EPUB file upload endpoint"

- [ ] **FILE-001b**: Metadata extraction and database storage
  - Install `epub` library for server-side parsing
  - Extract book metadata (title, author, ISBN, cover)
  - Store in database with proper schema
  - **Test**: Upload EPUB, verify metadata in database
  - **Commit**: "feat: Extract and store EPUB metadata"

**Week 2 - Content Processing (FILE-001c & FILE-001d)**
- [ ] **FILE-001c**: Chapter extraction and text cleaning
  - Extract all chapters from EPUB
  - Clean HTML tags and format text
  - Store chapters in database with proper structure
  - **Test**: Verify chapter content extraction and storage
  - **Commit**: "feat: Extract and store EPUB chapters"

- [ ] **FILE-001d**: Text chunking for AI processing
  - Implement semantic chunking algorithm
  - Create text chunks with overlap for context
  - Prepare for vector embedding (without AI cost yet)
  - **Test**: Verify chunk generation and storage
  - **Commit**: "feat: Implement text chunking for AI processing"

**Success Criteria per Step:**
- ✅ Each commit deployed and verified on live site
- ✅ GitHub Actions pass all tests
- ✅ Feature works end-to-end for that specific step
- ✅ No breaking changes to existing functionality

**Week 1-2**: Core Value Delivery
- ✅ EPUB upload and processing (FILE-001a-d)
- ✅ AI Q&A without accounts (AI-001) 
- ✅ Professional reading interface (UI-001)

**Week 3-4**: User Retention Features
- 🔐 Authentication system (AUTH-002)
- 📚 Personal library management (LIBRARY-001)
- 📊 Reading progress tracking (PROGRESS-001)

**Month 2**: Competitive Advantage
- 🌐 Cross-platform browser extension
- 🎯 Advanced AI features and personalization
- 🏢 Educational institution tools

---

## 🎯 IMPLEMENTATION STATUS REPORT - FILE-001c (December 30, 2025)

### ✅ COMPLETED: Hybrid Python + Node.js EPUB Processing Architecture

**FILE-001c has been successfully implemented with a production-ready hybrid architecture:**

#### **✅ Step 1: Railway Python API Service (WORKING)**
- **Location**: `ai-service/` folder
- **Files**: `api_main.py`, `epub_processor.py`, `requirements-api.txt`, `railway.toml`
- **Deployment**: Railway at `https://literati-production.up.railway.app`
- **Status**: ✅ LIVE and HEALTHY
- **Test**: `https://literati-production.up.railway.app/health` returns healthy status
- **Performance**: Processes Alice in Wonderland (15 chapters, 29,650 words) in 0.216s

#### **✅ Step 2: Node.js HTTP Client Integration (IMPLEMENTED)**
- **Location**: `src/lib/services/`
- **Files**: `python-epub-service.ts`, `epub-service.ts`
- **Method**: Replaced CLI calls with HTTP fetch() to Railway API
- **Features**: FormData upload, error handling, health checks, statistics
- **Status**: ✅ CODE COMPLETE

#### **✅ Step 3: Database Integration (READY)**
- **Schema**: Book and Chapter tables properly configured
- **Storage**: Full chapter extraction with metadata and word counts
- **Status**: ✅ READY FOR DATA

### 🔧 CURRENT BLOCKING ISSUE: Environment Variable Configuration

**Problem**: Next.js frontend cannot access Railway API URL in production
- **Expected**: `https://literati-production.up.railway.app`
- **Actual**: Falls back to `http://localhost:8000` (undefined environment variable)
- **Result**: Frontend uses basic filename parsing instead of Railway API

**Error Symptoms**:
- Browser console shows no debug logs
- EPUB processing shows "Title: pride, Author: prejudice" (filename parsing)
- Should show "Title: Pride and Prejudice, Author: Jane Austen" (API extraction)

**Environment Variable Setup Attempted**:
- Variable name: `NEXT_PUBLIC_EPUB_API_URL` 
- Vercel dashboard: Set to `https://literati-production.up.railway.app`
- Code: `process.env.NEXT_PUBLIC_EPUB_API_URL` in `python-epub-service.ts`
- TypeScript errors: "Cannot find name 'process'"

### 🎯 CLAUDE AI RESEARCH NEEDED

**Research Focus**: Next.js client-side environment variable access in production
**Key Files to Review**: 
- `src/lib/services/python-epub-service.ts` (environment variable access)
- `vercel.json` (deployment configuration)
- Latest commits: `a1e35b2`, `4f31c94`, `15bee9a` (environment variable attempts)

**Expected Solution**: Proper Next.js + Vercel configuration for `NEXT_PUBLIC_` variables

### 📈 IMPACT WHEN FIXED
Once environment variables work, the complete pipeline will be:
1. ✅ User uploads EPUB to Vercel Next.js frontend
2. ✅ Frontend sends file to Railway Python API via HTTP
3. ✅ Railway extracts 15 chapters + metadata in 0.2s 
4. ✅ Results stored in PostgreSQL database
5. ✅ User sees: "Pride and Prejudice by Jane Austen, 17 chapters, 130,255 words"

**This completes FILE-001c and enables AI-001 (Q&A with extracted chapter content)**

---
*Updated: December 30, 2025*  
*Phase: Foundation (1/3) | Month: 1/3 | Week: 1-2/4*  
*Current Task: FILE-001c-FIX (Environment Variables)*
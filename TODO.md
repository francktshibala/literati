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
- [ ] **FILE-001**: EPUB upload and processing pipeline 🔥 *PRIORITY*
  - [ ] **FILE-001a**: Basic EPUB upload with security validation
  - [ ] **FILE-001b**: Metadata extraction and database storage  
  - [ ] **FILE-001c**: Chapter extraction and text cleaning
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
**Completion**: 5/8 tasks (62.5%)  
**Days Remaining**: 12 days  
**Risk Level**: 🟢 Low (Strong foundation, pivoting to value-first delivery)

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
*Updated: June 2025*  
*Phase: Foundation (1/3) | Month: 1/3 | Week: 1-2/4*
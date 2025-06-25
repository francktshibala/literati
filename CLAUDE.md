# Literati - AI Reading Companion

## Project Overview
Literati is an AI-powered reading companion that helps users understand and interact with complex literature. It provides contextual AI assistance, character tracking, and historical context for books across multiple platforms.

**Market Opportunity**: $41.6B education apps market growing at 21.5% CAGR  
**Target Users**: Literature students, classical literature enthusiasts, educators  
**Unique Value**: Cross-platform AI reading assistance with literary specialization

## Current Development Phase
**Phase 1: Foundation (Months 1-3)**  
Status: Starting Month 1 - Infrastructure Setup  
Goal: Working MVP with core AI functionality

## Quick Commands
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run test suite
npm run lint         # Run linting
npm run typecheck    # TypeScript checking

# AI Service (Python)
cd ai-service && python -m uvicorn main:app --reload  # Start AI service
cd ai-service && pytest                               # Run AI tests

# Database
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed test data
```

## Architecture Overview
- **Frontend**: Next.js 14+ with TypeScript, Tailwind CSS
- **Backend**: Node.js/Express.js for API, Python/FastAPI for AI processing
- **Database**: PostgreSQL with pgvector for vector storage
- **AI**: LangChain + OpenAI/Anthropic for book understanding
- **Auth**: Clerk for authentication

## Key Features (MVP)
- [x] EPUB upload and processing
- [x] AI Q&A with book context
- [x] Clean reading interface
- [x] User authentication
- [x] Basic library management

## Development Priorities
1. **Cross-platform integration** (browser extension, platform APIs)
2. **AI optimization** (response caching, prompt engineering)
3. **Educational features** (institutional tools, collaboration)
4. **Performance** (sub-2s response times, 99.9% uptime)

## File Structure
```
literati/
├── CLAUDE.md                 # This file
├── docs/                     # Detailed documentation
│   ├── business-context.md   # Market analysis, strategy
│   ├── technical-spec.md     # Complete development plan
│   ├── development-phases.md # Implementation roadmap
│   └── best-practices.md     # Code quality guidelines
├── frontend/                 # Next.js application
├── backend/                  # Express.js API
├── ai-service/              # Python/FastAPI AI processing
├── shared/                  # Shared types and utilities
└── infrastructure/          # Docker, deployment configs
```

## Documentation Index
- **[Business Context](docs/business-context.md)** - Market opportunity, competitive analysis, go-to-market strategy
- **[Technical Specification](docs/technical-spec.md)** - Complete development plan, tech stack, architecture
- **[Development Phases](docs/development-phases.md)** - Detailed implementation roadmap with timelines
- **[Best Practices](docs/best-practices.md)** - Code quality, testing, security guidelines

## Key Success Metrics
- **Technical**: Sub-2s AI response times, 99.9% uptime
- **Business**: 5K users by month 6, 10% free-to-paid conversion
- **User**: 70% weekly retention, 90%+ AI satisfaction rating

## Security & Compliance
- GDPR/COPPA compliance for education market
- Copyright-compliant content handling
- Rate limiting and input validation
- Encryption at rest and in transit

## Next Immediate Steps
1. Set up development environment with authentication
2. Implement EPUB processing pipeline
3. Create vector database for book content
4. Build basic AI Q&A functionality
5. Design clean reading interface

## Support
- For development questions, see technical documentation
- For business strategy, see business context documentation
- For implementation guidance, see development phases documentation

---
*Last Updated: June 2025*
*Current Phase: Foundation Setup*
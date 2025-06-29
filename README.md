# Literati - AI Reading Companion

[![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.0-38B2AC)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.7.1-2D3748)](https://www.prisma.io/)

An AI-powered reading companion that helps users understand and interact with complex literature through contextual AI assistance, character tracking, and historical context.

## 🚀 Current Status

**Phase 1: Foundation Setup (50% Complete)**
- ✅ Next.js 14 with TypeScript and App Router
- ✅ Tailwind CSS with custom design system
- ✅ PostgreSQL database schema with Prisma
- ✅ Testing framework (Jest + React Testing Library)
- ✅ Production build pipeline
- ⏳ Authentication system (Clerk - in progress)
- ⏳ EPUB file processing
- ⏳ AI integration (OpenAI/Anthropic)

## 🛠 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run database migrations
npm run db:studio      # Open Prisma Studio
```

## 📚 Project Structure

```
literati/
├── src/app/              # Next.js App Router pages
├── src/components/       # Reusable UI components
├── src/lib/             # Utility functions and configurations  
├── prisma/              # Database schema and migrations
├── docs/                # Project documentation
└── public/              # Static assets
```

## 🎯 Key Features (Planned)

- **EPUB Upload & Processing**: Upload and extract content from EPUB files
- **AI Q&A**: Ask questions about uploaded books with contextual AI responses
- **Reading Interface**: Clean, focused reading experience
- **Character Tracking**: AI-powered character analysis and tracking
- **Historical Context**: Contextual information about literary works
- **Cross-platform**: Browser extension and platform integrations

## 🏗 Architecture

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Database**: PostgreSQL with pgVector for embeddings
- **AI**: LangChain + OpenAI/Anthropic for book understanding
- **Authentication**: Clerk for user management
- **Deployment**: Vercel with edge functions

## 📖 Documentation

- [Technical Specification](docs/technical-spec.md)
- [Development Phases](docs/development-phases.md)  
- [Business Context](docs/business-context.md)
- [Best Practices](docs/best-practices.md)

## 🤝 Contributing

This project is in early development. See [CLAUDE.md](CLAUDE.md) for development guidelines and current sprint status.

## 📄 License

Private project - All rights reserved.

---

**Market Opportunity**: $41.6B education apps market growing at 21.5% CAGR  
**Target**: Literature students, educators, and classical literature enthusiasts
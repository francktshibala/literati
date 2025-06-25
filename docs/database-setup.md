# Database Setup Guide

## Prerequisites

1. **PostgreSQL 14+** installed locally
2. **pgvector extension** available

## Quick Setup

### 1. Install PostgreSQL (if not already installed)

**macOS (Homebrew):**
```bash
brew install postgresql@14
brew install pgvector
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo apt install postgresql-14-pgvector
```

**Windows:**
- Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
- Install pgvector from [pgvector releases](https://github.com/pgvector/pgvector/releases)

### 2. Create Database and User

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Or on macOS/Windows:
psql -U postgres
```

Then run the setup script:
```sql
-- Create database user
CREATE USER literati_user WITH PASSWORD 'literati_password';

-- Create database
CREATE DATABASE literati_dev OWNER literati_user;

-- Connect to the new database
\c literati_dev

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE literati_dev TO literati_user;
GRANT ALL ON SCHEMA public TO literati_user;
```

### 3. Set Environment Variables

Update `.env.local` with your database connection:
```env
DATABASE_URL="postgresql://literati_user:literati_password@localhost:5432/literati_dev"
```

### 4. Run Migrations and Seed

```bash
# Install dependencies (if not done)
npm install

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with sample data
npm run db:seed
```

## Database Schema

### Core Tables

1. **users** - User accounts and authentication
2. **books** - Uploaded books and metadata
3. **chapters** - Book chapters with content
4. **book_embeddings** - Vector embeddings for AI queries
5. **questions** - User questions and AI responses
6. **reading_sessions** - Reading progress tracking

### Key Features

- **Vector Search**: pgvector extension for semantic search
- **Full-text Search**: PostgreSQL built-in text search
- **Cascade Deletes**: Proper data cleanup on user/book deletion
- **Indexing**: Optimized queries for common access patterns

## Development Commands

```bash
# Database management
npm run db:migrate      # Run new migrations
npm run db:generate     # Generate Prisma client
npm run db:seed         # Seed with sample data
npm run db:studio       # Open Prisma Studio GUI
npm run db:reset        # Reset database (WARNING: deletes all data)

# Production deployment
npm run db:migrate:prod # Deploy migrations to production
```

## Troubleshooting

### pgvector Extension Not Found
```bash
# Check if pgvector is installed
SELECT * FROM pg_available_extensions WHERE name = 'vector';

# If not available, install pgvector for your PostgreSQL version
```

### Connection Issues
```bash
# Test connection
psql "postgresql://literati_user:literati_password@localhost:5432/literati_dev"

# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgresql  # macOS
```

### Permission Errors
```sql
-- Grant all permissions to user
GRANT ALL PRIVILEGES ON DATABASE literati_dev TO literati_user;
GRANT ALL ON SCHEMA public TO literati_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO literati_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO literati_user;
```

## Production Setup

For production deployment, use a managed PostgreSQL service:

- **Supabase** (recommended for pgvector support)
- **Railway** 
- **PlanetScale** (MySQL alternative)
- **AWS RDS** with pgvector
- **Google Cloud SQL**

Update the `DATABASE_URL` environment variable accordingly.
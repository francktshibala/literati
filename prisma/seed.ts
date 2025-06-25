import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create a test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@literati.app' },
    update: {},
    create: {
      email: 'test@literati.app',
      name: 'Test User',
    },
  })

  console.log('✅ Created test user:', testUser)

  // Create a sample book
  const sampleBook = await prisma.book.upsert({
    where: { id: 'sample-book-1' },
    update: {},
    create: {
      id: 'sample-book-1',
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      isbn: '9780141439518',
      description: 'A romantic novel of manners written by Jane Austen in 1813.',
      language: 'en',
      pageCount: 432,
      publishedAt: new Date('1813-01-28'),
      originalFileName: 'pride-and-prejudice.epub',
      fileSize: 1024000,
      mimeType: 'application/epub+zip',
      processingStatus: 'COMPLETED',
      userId: testUser.id,
    },
  })

  console.log('✅ Created sample book:', sampleBook)

  // Create sample chapters
  const chapter1 = await prisma.chapter.create({
    data: {
      title: 'Chapter 1',
      content: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
      chapterNum: 1,
      wordCount: 2500,
      startPage: 1,
      endPage: 8,
      bookId: sampleBook.id,
    },
  })

  console.log('✅ Created sample chapter:', chapter1)

  // Create a sample question
  const sampleQuestion = await prisma.question.create({
    data: {
      question: 'What is the opening line of Pride and Prejudice?',
      answer: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
      context: 'This is the famous opening line of Jane Austen\'s novel.',
      aiModel: 'gpt-4',
      responseTime: 1200,
      tokens: 45,
      userId: testUser.id,
      bookId: sampleBook.id,
    },
  })

  console.log('✅ Created sample question:', sampleQuestion)

  console.log('🎉 Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
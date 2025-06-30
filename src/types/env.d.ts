declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_EPUB_API_URL?: string;
    DATABASE_URL?: string;
    NEXTAUTH_SECRET?: string;
    NEXTAUTH_URL?: string;
    NODE_ENV: 'development' | 'production' | 'test';
  }
}
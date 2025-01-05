declare global {
    namespace NodeJS {
      interface ProcessEnv {
        DATABASE_URL: string;
        OPENAI_API_KEY?: string;
        ANTHROPIC_API_KEY?: string;
      }
    }
  }
  
  export {}
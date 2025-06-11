import dotenv from 'dotenv';

// Load environment variables from .env file in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

export const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

if (!BRAVE_API_KEY) {
  console.error("FATAL ERROR: BRAVE_API_KEY environment variable is not set.");
  process.exit(1); // Exit if the key is missing
}

// Basic logging configuration (can be expanded)
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info'; // e.g., 'debug', 'info', 'warn', 'error'

console.log(`Configuration loaded. Log level: ${LOG_LEVEL}`); // Log successful load
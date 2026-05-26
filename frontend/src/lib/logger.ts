/**
 * Universal structured logger bridge for Next.js environments.
 * 
 * - Server-side (SSR, API Routes): Leverages Winston to generate structured JSON logs
 *   that are ideal for log ingestion systems (Elastic, Datadog).
 * - Client-side (Browser): Safe, non-blocking console-wrapper that prints a matching
 *   JSON metadata schema, completely eliminating bundler errors or require() crashes in browsers.
 */

let logger: {
  info: (message: string, meta?: Record<string, any>) => void;
  warn: (message: string, meta?: Record<string, any>) => void;
  error: (message: string, meta?: Record<string, any>) => void;
  debug: (message: string, meta?: Record<string, any>) => void;
};

if (typeof window === "undefined") {
  // Node.js server context: Dynamically load Winston to avoid bundling issues in browsers
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const winston = require("winston");
  logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [new winston.transports.Console()],
  });
} else {
  // Browser context: Fallback safely to a formatted JSON console outputs
  logger = {
    info: (message: string, meta?: Record<string, any>) => {
      console.log(
        JSON.stringify({
          level: "info",
          message,
          timestamp: new Date().toISOString(),
          ...meta,
        })
      );
    },
    warn: (message: string, meta?: Record<string, any>) => {
      console.warn(
        JSON.stringify({
          level: "warn",
          message,
          timestamp: new Date().toISOString(),
          ...meta,
        })
      );
    },
    error: (message: string, meta?: Record<string, any>) => {
      console.error(
        JSON.stringify({
          level: "error",
          message,
          timestamp: new Date().toISOString(),
          ...meta,
        })
      );
    },
    debug: (message: string, meta?: Record<string, any>) => {
      console.debug(
        JSON.stringify({
          level: "debug",
          message,
          timestamp: new Date().toISOString(),
          ...meta,
        })
      );
    },
  };
}

export default logger;

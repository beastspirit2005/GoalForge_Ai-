/**
 * Universal structured logger bridge for Next.js environments.
 */

const logger = {
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

export default logger;

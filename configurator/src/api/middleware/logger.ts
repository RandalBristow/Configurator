import morgan from "morgan";

// Add :id token for request correlation
morgan.token("id", (req) => (req as any).id ?? "-");

export const httpLogger = morgan(
  ':id :method :url :status :res[content-length] - :response-time ms',
);

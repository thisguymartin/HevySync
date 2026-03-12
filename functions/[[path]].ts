import app from "../src/server/index.js";

interface PagesContext {
  request: Request;
  env: Record<string, unknown>;
  params: Record<string, string>;
  next: () => Promise<Response>;
}

export const onRequest = (context: PagesContext) => {
  return app.fetch(context.request, context.env);
};

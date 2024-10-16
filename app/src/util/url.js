export const u = (path) =>
  process.env.NODE_ENV === "development"
    ? `http://localhost:3000${path}`
    : path;

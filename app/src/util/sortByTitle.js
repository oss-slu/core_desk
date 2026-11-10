export const sortByTitle = (items = []) =>
  [...items].sort((a, b) =>
    (a.title || "").localeCompare(b.title || "", undefined, {
      sensitivity: "base",
    }),
  );
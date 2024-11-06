export const flatten = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([_, value]) => typeof value !== "object" || value === null
    )
  );
};

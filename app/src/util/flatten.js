export const flatten = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(
      // eslint-disable-next-line no-unused-vars
      ([_, value]) => typeof value !== "object" || value === null
    )
  );
};

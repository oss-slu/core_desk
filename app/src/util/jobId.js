export const formatJobId = (id) => {
  const numericSuffix = [...id.slice(-6)].reduce(
    (value, character) => value * 36n + BigInt(parseInt(character, 36)),
    0n,
  );

  return String(numericSuffix % 1_000_000n).padStart(6, "0");
};

/*
A function that forces an error to be thrown. This is used for tesing error handling.
*/

export const forceTestError = (req) => {
  if (
    process.env.NODE_ENV === "test" &&
    (req.headers.forceError || req.headers.forceerror)
  ) {
    throw new Error("Test error");
  }
};

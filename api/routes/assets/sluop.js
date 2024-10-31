export const get = (req, res) => {
  res.sendFile("/routes/assets/sluop-logo.png", {
    root: process.cwd(),
    headers: {
      "Content-Type": "image/png",
    },
  });
};

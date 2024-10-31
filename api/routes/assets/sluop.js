export const get = (req, res) => {
  console.log(process.cwd());
  res.sendFile("/routes/assets/sluop-logo.png", {
    root: process.cwd(),
    headers: {
      "Content-Type": "image/png",
    },
  });
};

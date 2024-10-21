import { prisma } from "../../util/prisma.js";

export const post = async (req, res) => {
  console.log("upload completed", req.body);
  const scope = req.body.metadata.scope;
};

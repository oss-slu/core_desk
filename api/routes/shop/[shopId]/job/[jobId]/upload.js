import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { upload } from "#upload";

export const post = [
  verifyAuth,
  upload(),
  async (req, res) => {
    console.log(req.file, req.fileLog);
  },
];

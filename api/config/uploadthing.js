import { createUploadthing } from "uploadthing/express";
import { verifyAuthAlone } from "../util/verifyAuth.js";
import { prisma } from "../util/prisma.js";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

export const uploadRouter = {
  files: f({
    blob: {
      maxFileSize: "128MB",
      maxFileCount: 150,
    },
  })
    .middleware(async ({ req, res }) => {
      let user = null;

      try {
        user = await verifyAuthAlone(req.headers.authorization);
      } catch (error) {
        throw new UploadThingError("You must be logged in to upload files");
      }

      const { shopId, jobId } = JSON.parse(req.headers["x-scope"]);
      if (!req.headers["x-scope"]) {
        throw new UploadThingError("Missing x-scope header");
      }
      if (!user) {
        throw new UploadThingError("You must be logged in to upload files");
      }
      if (user.suspended) {
        throw new UploadThingError("Your account has been suspended");
      }
      if (user.admin) {
        return { scope: { jobId, shopId }, userId: user.id };
      }
      const userShop = await prisma.userShop.findFirst({
        where: {
          userId: user.id,
          shopId,
        },
      });
      console.log(userShop, user.id, shopId);
      if (!userShop) {
        throw new UploadThingError("You do not have access to this shop");
      }
      if (userShop.accountType === "CUSTOMER") {
        const job = await prisma.job.findFirst({
          where: {
            id: jobId,
            shopId,
            userId: user.id,
          },
        });
        if (!job) {
          throw new UploadThingError("You do not have access to this job");
        }
      }
      const scope = JSON.parse(req.headers["x-scope"]);
      return { scope, userId: user.id };
    })
    .onUploadComplete((data) => {
      // console.log("upload completed!", data);
    }),
};

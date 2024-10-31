import { LogType } from "@prisma/client";
import { prisma } from "../../../../../../util/prisma.js";
import { verifyAuth } from "../../../../../../util/verifyAuth.js";
import { utapi } from "../../../../../../config/uploadthing.js";

export const del = [
  verifyAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { resourceId, shopId, imageId } = req.params;

      const userShop = await prisma.userShop.findFirst({
        where: {
          shopId,
          userId,
          active: true,
        },
      });

      if (!userShop) {
        return res.status(403).send("You are not a member of this shop");
      }

      if (userShop.accountType !== "ADMIN" && !req.user.admin) {
        return res
          .status(403)
          .send("You do not have permission to delete images");
      }

      const resource = await prisma.resource.findFirst({
        where: {
          id: resourceId,
          shopId,
        },
      });

      if (!resource) {
        return res.status(404).send("Resource not found");
      }

      if (!resource) {
        return res.status(404).send("Resource not found");
      }

      const image = await prisma.resourceImage.findFirst({
        where: {
          id: imageId,
          resourceId,
          active: true,
        },
      });

      if (!image) {
        return res.status(404).send("Image not found");
      }

      await prisma.resourceImage.update({
        where: {
          id: imageId,
        },
        data: {
          active: false,
        },
      });

      await prisma.logs.create({
        data: {
          type: LogType.RESOURCE_IMAGE_DELETED,
          userId,
          resourceId,
          shopId,
          resourceImageId: imageId,
        },
      });

      const newResource = await prisma.resource.findFirst({
        where: {
          id: resourceId,
          shopId,
        },
        include: {
          images: {
            where: {
              active: true,
            },
          },
        },
      });

      await utapi.deleteFiles(image.fileKey);

      res.json({ resource: newResource });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: "An error occurred",
      });
    }
  },
];

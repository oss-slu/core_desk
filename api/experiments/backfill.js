import { prisma } from "#prisma";
import { utapi } from "../config/uploadthing.js";
import { renderStl } from "../util/renderStl.js";
import NodeStl from "node-stl";

export const fixIncompleteStlFiles = async () => {
  const items = await prisma.jobItem.findMany({
    where: {
      fileType: "stl",
      OR: [
        { fileThumbnailKey: null },
        { fileThumbnailUrl: null },
        { stlVolume: null },
        { stlIsWatertight: null },
        { stlBoundingBoxX: null },
        { stlBoundingBoxY: null },
        { stlBoundingBoxZ: null },
      ],
    },
  });

  console.log(`Found ${items.length} items with incomplete STL data`);

  let idx = 0;
  for (const item of items) {
    console.log(`Updating jobItem ${item.id} (${idx + 1}/${items.length})`);
    idx++;

    try {
      const [pngData, stlData] = await renderStl(item.fileUrl);

      const upload = await utapi.uploadFiles([
        new File([pngData], `${item.fileName}.preview.png`, {
          type: "image/png",
        }),
      ]);

      const stlStats = new NodeStl(Buffer.from(stlData));

      await prisma.jobItem.update({
        where: { id: item.id },
        data: {
          fileThumbnailKey: upload[0].data.key,
          fileThumbnailName: upload[0].data.name,
          fileThumbnailUrl: upload[0].data.url,
          stlVolume: stlStats.volume,
          stlIsWatertight: stlStats.isWatertight,
          stlBoundingBoxX: stlStats.boundingBox[0] / 10,
          stlBoundingBoxY: stlStats.boundingBox[1] / 10,
          stlBoundingBoxZ: stlStats.boundingBox[2] / 10,
        },
      });

      console.log(`Updated jobItem ${item.id}`);
    } catch (err) {
      console.error(`Error updating jobItem ${item.id}:`, err.message);
      if (err.message.includes("404")) {
        // Delete the incomplete file
        await utapi.deleteFiles([item.fileKey]);
        await prisma.jobItem.delete({ where: { id: item.id } });
        console.log(`Deleted jobItem ${item.id}`);
      }
    }
  }
};

fixIncompleteStlFiles();

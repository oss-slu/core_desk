import { createUploadthing } from "uploadthing/express";

const f = createUploadthing();

export const uploadRouter = {
  files: f({
    blob: {
      maxFileSize: "128MB",
      maxFileCount: 50,
    },
  }).onUploadComplete((data) => {
    console.log("upload completed", data);
  }),
};

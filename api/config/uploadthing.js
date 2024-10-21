import { createUploadthing } from "uploadthing/express";

const f = createUploadthing();

export const uploadRouter = {
  files: f({
    blob: {
      maxFileSize: "128MB",
      maxFileCount: 150,
    },
  })
    .middleware(async ({ req, res }) => {
      console.log("middleware", req.body, req.headers["x-scope"]);
      return { scope: JSON.parse(req.headers["x-scope"]) };
    })
    .onUploadComplete((data) => {
      // console.log("upload completed!", data);
    }),
};

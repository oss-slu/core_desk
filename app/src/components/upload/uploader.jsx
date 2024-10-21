import React from "react";
import { generateUploadDropzone } from "@uploadthing/react";
import { u } from "../../util/url.js";
import "@uploadthing/react/styles.css";

const _UploadDropzone = generateUploadDropzone({
  url: u("/api/files/upload"),
  metadata: { hello: "WORLD1" },
  headers: { hello: "WORLD2" },
});

export const UploadDropzone = (scope) => {
  return (
    <_UploadDropzone
      endpoint="files"
      headers={{
        "x-scope": scope,
      }}
      metadata={{
        hello: "WORLD3",
      }}
    />
  );
};

import React from "react";
import { generateUploadDropzone } from "@uploadthing/react";
import { u } from "../../util/url.js";
import "@uploadthing/react/styles.css";

const _UploadDropzone = generateUploadDropzone({
  url: u("/api/files/upload"),
});

export const UploadDropzone = (scope) => {
  return (
    <_UploadDropzone
      endpoint="files"
      headers={{
        "x-scope": JSON.stringify(scope),
      }}
    />
  );
};

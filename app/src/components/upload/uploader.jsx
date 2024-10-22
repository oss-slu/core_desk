import React from "react";
import { generateUploadDropzone } from "@uploadthing/react";
import { u } from "../../util/url.js";
import "@uploadthing/react/styles.css";
import { Util } from "tabler-react-2";
import { Alert } from "tabler-react-2/dist/alert/index.js";
import toast from "react-hot-toast";

const _UploadDropzone = generateUploadDropzone({
  url: u("/api/files/upload"),
});

export const UploadDropzone = ({ scope }) => {
  return (
    <>
      <_UploadDropzone
        endpoint="files"
        headers={{
          "x-scope": JSON.stringify(scope),
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }}
        onUploadError={(error) => {
          toast.error("Upload error: " + error);
        }}
        onClientUploadComplete={(f) => {
          f.forEach((file) =>
            toast.success(`File ${file.name} uploaded successfully`)
          );
        }}
      />
    </>
  );
};

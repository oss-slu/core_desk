import React from "react";
import { Dropzone } from "../Dropzone/Dropzone";

export const UploadDropzone = ({ onUploadComplete, endpoint }) => {
  return (
    <>
      <Dropzone onSuccessfulUpload={onUploadComplete} endpoint={endpoint} />
    </>
  );
};

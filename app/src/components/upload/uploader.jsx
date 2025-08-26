import React from "react";
import { Dropzone } from "../Dropzone/Dropzone";

export const UploadDropzone = ({ onUploadComplete, endpoint }) => {
  <>
    <Dropzone onSuccessfulUpload={onUploadComplete} endpoint={endpoint} />
  </>;
};

import useSWRMutation from "swr/mutation";
import { authFetchWithoutContentType } from "../util/url";
import toast from "react-hot-toast";
import { useState } from "react";

const uploadFiles = async (url, { arg }) => {
  const { files, onProgress } = arg;

  if (!files || files.length === 0) {
    return [];
  }

  const results = [];

  for (let i = 0; i < files.length; i++) { //use a for loop 
    const file = files[i];
    const formData = new FormData();
    formData.append("files", file);

    try {
      const response = await authFetchWithoutContentType(url, {
        method: "POST",
        body: formData,
      });

      const data = await response.text();

      if (!response.ok) {
        toast.error(`Error uploading ${file.name}`);
        console.error(`Upload error for file ${file.name}:`, data);
        continue;
      }

      results.push(data);

      //update the progress, have to manually do this, since fetch doesnt provide a built in progress like axios
      if (onProgress) {
        const percent = Math.round(((i + 1) / files.length) * 100);
        onProgress(percent);
      }
    } catch (err) {
      console.error(`Unexpected error uploading file ${file.name}:`, err);
    }
  }

  return results;
};

export const useFileUploader = (endpoint, options) => {
  const { onSuccessfulUpload } = options || {};
  const [progress, setProgress] = useState(0); //state

  const { trigger, data, error, isMutating } = useSWRMutation(
    endpoint,
    uploadFiles,
    { throwOnError: false }
  );

  const upload = async (files) => {
    if (!files || (Array.isArray(files) && files.length === 0)) {
      throw { message: "No files provided", status: 400 };
    }

    setProgress(0); //reset

    return trigger({ files, onProgress: setProgress })
      .catch((err) => {
        console.error("Upload failed in hook:", err);
        throw err;
      })
      .finally(() => {
        if (!error) {
          toast.success("File uploaded successfully");
          if (onSuccessfulUpload) onSuccessfulUpload(data);
        }
      });
  };

  return {
    upload,
    data,
    loading: isMutating,
    progress, //export progress
    error,
  };
};

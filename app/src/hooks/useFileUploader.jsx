import useSWRMutation from "swr/mutation";
import { authFetchWithoutContentType } from "../util/url";
import toast from "react-hot-toast";

const uploadFiles = async (url, { arg }) => {

  if (!arg || arg.length === 0) { //if the length of the file array is zero
    return []; 
  }

  const results = []; //create empty array to store each backend resposnse

  for (const file of arg) { //loop over each file

    const formData = new FormData();
    formData.append("files", file);

    try {
      const response = await authFetchWithoutContentType(url, { //create a network response for each file
        method: "POST",
        body: formData,
      });

      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (jsonError) {
        data = rawText;
      
      }

      if (!response.ok) {
        const errorMessage = (data && data.message) || "Upload failed";
        console.error(`Upload error for file ${file.name}:`, errorMessage);
        continue;
      }

      results.push(data);
    } catch (err) {
      console.error(`Unexpected error uploading file ${file.name}:`, err);
    }
  }

  return results; //return the array
};
export const useFileUploader = (endpoint, options) => {
  const { onSuccessfulUpload } = options || {};

  const { trigger, data, error, isMutating } = useSWRMutation(
    endpoint,
    uploadFiles,
    {
      throwOnError: false,
    }
  );

  const upload = async (fileOrFiles) => {
    if (
      !fileOrFiles ||
      (Array.isArray(fileOrFiles) && fileOrFiles.length === 0)
    ) {
      throw { message: "No files provided", status: 400 };
    }

    return trigger(fileOrFiles)
      .catch((err) => {
        console.error("Upload failed in hook:", err);
        throw err; // Ensure error propagates correctly
      })
      .finally(() => {
        if (!error) {
          toast.success("File uploaded successfully");
          if (onSuccessfulUpload) {
            onSuccessfulUpload(data);
          }
        }
      });
  };

  return {
    upload,
    data,
    loading: isMutating,
    error,
  };
};

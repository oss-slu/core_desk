import useSWRMutation from "swr/mutation";
import { authFetchWithoutContentType } from "../util/url";
import toast from "react-hot-toast";
import { useState } from "react";

//eslint-disable-next-line no-unused-vars
const uploadFiles = async (url, { arg, addOrUpdateKey, deleteAllKeys }) => {
  const { files } = arg;

  if (!files || files.length === 0) {
    return [];
  }
  const results = [];

  for (let i = 0; i < files.length; i++) { //use a for loop 
    const file = files[i];
    const formData = new FormData();
    formData.append("files", file);

    addOrUpdateKey(file.name, 0) //set progress to zero

    try {
      const response = await authFetchWithoutContentType(url, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(`Error uploading ${file.name}`);
        console.error(`Upload error for file ${file.name}:`, data);
        continue;
      }
      else{
        results.push(data);
        addOrUpdateKey(file.name, 100); //set to 100
        
      }
    } catch (err) {
      console.error(`Unexpected error uploading file ${file.name}:`, err);
    }
  }

  return results;
};

export const useProgressMap = () => { //we could have this as its own file?
  const [progress, setProgress] = useState({});

  // Add or update a key
  const addOrUpdateKey = (key, value) => { //file.name : progress
    setProgress(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Reset all keys
  const deleteAllKeys = () => {
    setProgress({});
  };

  return { progress, addOrUpdateKey, deleteAllKeys };
};

export const useFileUploader = (endpoint, options) => {
  const { onSuccessfulUpload } = options || {};
   const { progress, addOrUpdateKey, deleteAllKeys } = useProgressMap();

  const { trigger, data, error, isMutating } = useSWRMutation(
    endpoint,
    (url, args) => uploadFiles(url, { ...args, addOrUpdateKey, deleteAllKeys}), // pass it here
    { throwOnError: false }
  );

  const upload = async (files) => {
    if (!files || (Array.isArray(files) && files.length === 0)) {
      throw { message: "No files provided", status: 400 };
    }


    return trigger({ files })
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
    progress, //return 
    loading: isMutating,
    error,
    deleteAllKeys
  };
};

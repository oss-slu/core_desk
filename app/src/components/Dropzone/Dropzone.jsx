import React, { useEffect, useState } from "react";
import { Input, Button } from "tabler-react-2";
import { Row } from "../../util/Flex";
import { useFileUploader } from "../../hooks/useFileUploader";
import { ImageUploadProgress } from "../imageUploadProgress/ImageUploadProgress";
import ErrorBoundaries from "../ErrorBoundaries/ErrorBoundaries";
import * as Sentry from "@sentry/react";

export const Dropzone = ({ onSuccessfulUpload = () => {}, endpoint }) => {
  const [files, setFiles] = useState([]);
  const [inputKey, setInputKey] = useState(Date.now()); // state

  useEffect(() => {
    console.log(files);
  }, [files]);

  const { loading, upload, progress, deleteAllKeys } = useFileUploader(endpoint, {
    onSuccessfulUpload,
  });

  useEffect(() => {
    const allComplete = Object.values(progress).every((value) => value === 100); //uf they are all 100
    if (allComplete) {
      setInputKey(Date.now()); //update the input 
    }
  }, [progress]);

  return (
    <>
      <Sentry.ErrorBoundary fallback={<ErrorBoundaries></ErrorBoundaries>}>
      <Row gap={1}>
        <Input
          key={inputKey} // creates a new input when the files progress is 100, this is the only way to update or remove the text / clear 
          style={{ flex: 1 }}
          type="file"
          name="file"
          inputProps={{
            multiple: true,
          }}
          onRawChange={(e) => {
            setFiles(e.target.files);
          }}
        />
        {files.length > 0 && (
          <Button
            onClick={() => {
              upload(files);
            }}
            className="mb-3"
            loading={loading}
          >
            Upload
          </Button>
        )}
      </Row>
      <ImageUploadProgress
        files={files}
        setFiles={setFiles}
        progress={progress}
        deleteAllKeys = {deleteAllKeys}
      />
    </Sentry.ErrorBoundary>
    </>
  );
};

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

  const { loading, upload, progress, deleteAllKeys } = useFileUploader(
    endpoint,
    {
      onSuccessfulUpload,
    },
  );

  useEffect(() => {
    const values = Object.values(progress);

    if (values.length === 0) return;
    if (!values.every((v) => v === 100)) return;

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [progress]);

  const inputRef = React.useRef(null);

  return (
    <>
      <Sentry.ErrorBoundary
        fallback={({ error }) => <ErrorBoundaries error={error} />}
      >
        <Row gap={1}>
          <Input
            ref={inputRef}
            style={{ flex: 1 }}
            type="file"
            name="file"
            inputProps={{
              multiple: true,
            }}
            onRawChange={(e) => {
              setFiles(Array.from(e.target.files));
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
          deleteAllKeys={deleteAllKeys}
        />
      </Sentry.ErrorBoundary>
    </>
  );
};

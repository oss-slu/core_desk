import React, { useEffect } from "react";
import { Input, Button, Alert } from "tabler-react-2";
import { useState } from "react";
import { Row } from "../../util/Flex";
import { useFileUploader } from "../../hooks/useFileUploader";

export const Dropzone = ({ onSuccessfulUpload = () => {} }) => {
  const [files, setFiles] = useState([]);
  useEffect(() => {
    console.log(files);
  }, [files]);

  const { data, error, loading, upload } = useFileUploader("/api/file", {
    onSuccessfulUpload,
  });

  return (
    <>
      {error && (
        <Alert variant="danger" className="mb-3" title="Error">
          {error}
        </Alert>
      )}
      <Row gap={1}>
        <Input
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
    </>
  );
};

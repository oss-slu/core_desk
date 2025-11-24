import React, { useState, useEffect } from "react";

export const ImageUploadProgress = ({ files, setFiles, progress, deleteAllKeys }) => {
  const [previews, setPreviews] = useState([]);

  // Generate previews for images or PDFs
  useEffect(() => {
    if (!files || files.length === 0) {
      setPreviews([]);
      return;
    }

    const urls = [];

    Array.from(files).forEach((file) => {
      if (file.name.toLowerCase().endsWith(".pdf")) {
        // For PDFs, just push a placeholder string
        urls.push({ name: file.name, url: "PDF" });
        if (urls.length === files.length) setPreviews(urls);
        return; // skip FileReader
      }

      // For images, generate a base64 preview
      const reader = new FileReader();
      reader.onload = (e) => {
        urls.push({ name: file.name, url: e.target.result });
        if (urls.length === files.length) setPreviews(urls);
      };
      reader.readAsDataURL(file);
    });
  }, [files]);

  // Clear files when upload is complete
  useEffect(() => {
    if (!progress || Object.keys(progress).length === 0) return;

    const allComplete = Object.values(progress).every((value) => value === 100);
    if (allComplete) {
      setFiles([]);
      setTimeout(() => deleteAllKeys(), 2000);
    }
  }, [progress, setFiles, deleteAllKeys]);

  return (
    <div className="image-upload-progress">
      {previews.map((file, idx) => (
        <div
          key={idx}
          className="file-row"
          style={{ display: "flex", alignItems: "center", marginBottom: "10px", gap: "10px" }}
        >
          {file.url === "PDF" ? (
            <div
              style={{
                width: "60px",
                height: "60px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "0.8rem",
                fontWeight: "bold",
                backgroundColor: "#f0f0f0",
              }}
            >
              PDF
            </div>
          ) : (
            <img
              src={file.url}
              alt={`preview-${idx}`}
              style={{
                width: "60px",
                height: "60px",
                objectFit: "cover",
                borderRadius: "4px",
                border: "1px solid #ddd",
              }}
            />
          )}

          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: "4px", fontSize: "0.9rem" }}>{file.name}</div>
            <div className="progress" style={{ height: "10px", borderRadius: "5px" }}>
              <div
                className="progress-bar bg-primary"
                role="progressbar"
                style={{ width: `${progress[file.name] || 0}%` }}
                aria-valuenow={progress[file.name] || 0}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

import React, { useState, useEffect } from "react";

export const ImageUploadProgress = ({ files, setFiles, progress, setProgress }) => {
  const [previews, setPreviews] = useState([]);

  useEffect(() => { //anytime new files are added display them
    if (!files || files.length === 0) {
      setPreviews([]);
      return;
    }

    const urls = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        urls.push({ name: file.name, url: e.target.result });
        if (urls.length === files.length) setPreviews(urls);
      };
      reader.readAsDataURL(file);
    });
  }, [files]);

  useEffect(() => {
    if(progress === 100){
        setFiles([]);
        setProgress(0);
    }
  }, [progress])



  //mock version
  return (
    <div className="image-upload-progress">
      {previews.map((file, idx) => (
        <div key={idx} className="file-row" style={{ display: "flex", alignItems: "center", marginBottom: "10px", gap: "10px" }}>
          <img
            src={file.url}
            alt={`preview-${idx}`}
            style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "4px", border: "1px solid #ddd" }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: "4px", fontSize: "0.9rem" }}>{file.name}</div>
            <div className="progress" style={{ height: "10px", borderRadius: "5px" }}>
              <div
                className={`progress-bar ${status === "error" ? "bg-danger" : "bg-primary"}`}
                role="progressbar"
                style={{ width: `${progress}%` }}
                aria-valuenow={progress}
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

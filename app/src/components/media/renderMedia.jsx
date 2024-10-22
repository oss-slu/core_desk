import React from "react";
import styles from "./renderMedia.module.css";
import { StlViewer } from "react-stl-viewer";

export const RenderMedia = ({ mediaUrl, fileType }) => {
  if (fileType === "png") {
    return <img src={mediaUrl} className={styles.image} alt="media" />;
  }

  if (fileType === "stl") {
    return (
      <StlViewer
        className={styles.image}
        orbitControls
        shadows
        url={mediaUrl}
        modelProps={{
          color: "rgb(83, 195, 238)",
        }}
        cameraProps={{
          initialPosition: {
            distance: 1,
          },
        }}
      />
    );
  }

  return (
    <div className={styles.unsupported}>
      {fileType}
      <i>Rendering is not supported for this file type</i>
    </div>
  );
};

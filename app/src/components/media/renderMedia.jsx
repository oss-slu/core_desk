import React from "react";
import styles from "./renderMedia.module.css";
import { StlViewer } from "react-stl-viewer";
import classNames from "classnames";

export const RenderMedia = ({ mediaUrl, fileType, big = false }) => {
  if (
    fileType === "png" ||
    fileType === "jpg" ||
    fileType === "jpeg" ||
    fileType === "webp"
  ) {
    return (
      <img
        src={mediaUrl}
        className={classNames(styles.image, big ? styles.big : "")}
        alt="media"
      />
    );
  }

  if (fileType === "stl") {
    return (
      <StlViewer
        className={classNames(styles.image, big ? styles.big : "")}
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

  if (fileType === "pdf") {
    return (
      <iframe
        src={mediaUrl}
        className={classNames(styles.image, big ? styles.big : "")}
        title="PDF"
      />
    );
  }

  return (
    <div className={classNames(styles.unsupported, big ? styles.big : "")}>
      {fileType}
      <i>Rendering is not supported for this file type</i>
    </div>
  );
};

import React, { useState, useEffect, useRef } from "react";
import styles from "./renderMedia.module.css";
import { StlViewer } from "react-stl-viewer";
import classNames from "classnames";

export const RenderMedia = ({
  mediaUrl,
  thumbnailUrl,
  fileType: originalFileType,
  big = false,
  small = false,
}) => {
  const [preview, setPreview] = useState(true);
  const timeoutRef = useRef(null);
  const stlObjectUrlRef = useRef(null);
  const fileType = originalFileType?.toLowerCase();
  const isStl = fileType === "stl";
  const [stlReadyUrl, setStlReadyUrl] = useState(null);
  const [stlLoading, setStlLoading] = useState(false);
  const [stlError, setStlError] = useState(null);

  const handleMouseOut = () => {
    timeoutRef.current = setTimeout(() => {
      setPreview(true);
    }, 5 * 1000); // 10 seconds
  };

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setPreview(false);
  };

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    if (!isStl || !mediaUrl) {
      setStlReadyUrl(null);
      setStlLoading(false);
      setStlError(null);
      if (stlObjectUrlRef.current) {
        URL.revokeObjectURL(stlObjectUrlRef.current);
        stlObjectUrlRef.current = null;
      }
      return;
    }

    let cancelled = false;

    const prepare = async () => {
      setStlReadyUrl(null);
      setStlLoading(true);
      setStlError(null);

      try {
        const response = await fetch(mediaUrl);
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        let resolvedUrl = mediaUrl;
        let createdObjectUrl = null;

        if (buffer.byteLength >= 84) {
          const faceSize = 50; // 12-byte normal, 36-byte vertices, 2-byte attribute
          const reader = new DataView(buffer);
          const faceCount = reader.getUint32(80, true);
          const expectedLength = 84 + faceCount * faceSize;

          if (expectedLength !== buffer.byteLength) {
            const decoder = new TextDecoder("utf-8");
            const withoutBom = decoder.decode(buffer).replace(/^\uFEFF/, "");
            const trimmed = withoutBom.replace(/^\s+/, "");

            if (trimmed.slice(0, 5).toLowerCase() === "solid") {
              const blob = new Blob([trimmed], { type: "model/stl" });
              createdObjectUrl = URL.createObjectURL(blob);
              resolvedUrl = createdObjectUrl;
            }
          }
        }

        if (cancelled) {
          if (createdObjectUrl) URL.revokeObjectURL(createdObjectUrl);
          return;
        }

        if (stlObjectUrlRef.current) {
          URL.revokeObjectURL(stlObjectUrlRef.current);
          stlObjectUrlRef.current = null;
        }

        if (createdObjectUrl) {
          stlObjectUrlRef.current = createdObjectUrl;
        }

        setStlReadyUrl(resolvedUrl);
      } catch (error) {
        if (!cancelled) {
          setStlError(error);
          setStlReadyUrl(null);
        }
      } finally {
        if (!cancelled) {
          setStlLoading(false);
        }
      }
    };

    prepare();

    return () => {
      cancelled = true;
    };
  }, [isStl, mediaUrl]);

  useEffect(
    () => () => {
      if (stlObjectUrlRef.current) {
        URL.revokeObjectURL(stlObjectUrlRef.current);
        stlObjectUrlRef.current = null;
      }
    },
    []
  );

  if (
    fileType === "png" ||
    fileType === "jpg" ||
    fileType === "jpeg" ||
    fileType === "webp"
  ) {
    return (
      <img
        src={mediaUrl}
        className={classNames(
          styles.image,
          big ? styles.big : "",
          small ? styles.small : ""
        )}
        alt="media"
      />
    );
  }

  if (fileType === "stl") {
    if (preview && thumbnailUrl && !big) {
      return (
        <img
          src={thumbnailUrl}
          className={classNames(
            styles.image,
            big ? styles.big : "",
            small ? styles.small : ""
          )}
          alt="media"
          onClick={() => setPreview(false)}
        />
      );
    }

    const stlClasses = classNames(
      styles.image,
      big ? styles.big : "",
      small ? styles.small : ""
    );

    if (stlError) {
      return (
        <div className={classNames(stlClasses, styles.unsupported)}>
          STL preview unavailable
        </div>
      );
    }

    if (!stlReadyUrl) {
      return (
        <div className={stlClasses}>
          {stlLoading ? "Loading model…" : "Preparing model…"}
        </div>
      );
    }

    return (
      <StlViewer
        className={stlClasses}
        orbitControls
        shadows
        url={stlReadyUrl}
        onMouseOut={handleMouseOut}
        onMouseEnter={handleMouseEnter}
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
        className={classNames(
          styles.image,
          big ? styles.big : "",
          small ? styles.small : ""
        )}
        title="PDF"
      />
    );
  }

  return (
    <div
      className={classNames(
        styles.unsupported,
        big ? styles.big : "",
        small ? styles.small : ""
      )}
    >
      {fileType}
      <i>Rendering is not supported for this file type</i>
    </div>
  );
};

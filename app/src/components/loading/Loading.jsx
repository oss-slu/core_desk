import React from "react";
import { Typography, Spinner } from "tabler-react-2";

export const Loading = ({ message }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        justifyContent: "center",
        alignItems: "center",
        height: "70vh",
      }}
    >
      <Typography.H3>{message || "Loading..."}</Typography.H3>
      <Spinner />
    </div>
  );
};

import React from "react";

function ErrorBoundaries({ error }) {
  const message =
    typeof error?.message === "string"
      ? error.message
      : typeof error === "string"
      ? error
      : "An unexpected error occurred.";

  return (
    <div style={{ padding: "1rem", color: "#b71c1c" }}>
      <h3>Oops! Something went wrong.</h3>
      <p>{message}</p>
    </div>
  );
}

export default ErrorBoundaries;

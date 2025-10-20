import React from "react";


function ErrorBoundaries({ error, stackTrace }) {
  return (
    <div style={{ padding: "1rem", color: "#b71c1c" }}>
      <h2>Oops! Something went wrong. A bug report has automatically been sent.</h2>

      {/* Display the error message safely */}
      <p>
        <strong>Error:</strong>{" "}
        {error?.message || (typeof error === "string" ? error : JSON.stringify(error, null, 2))}
      </p>

      {/* Display the stack trace safely */}
      {stackTrace && (
        <pre style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "6px" }}>
          {typeof stackTrace === "string"
            ? stackTrace
            : JSON.stringify(stackTrace, null, 2)}
        </pre>
      )}
    </div>
  );
}


export default ErrorBoundaries;
import React from "react";
import { Button } from "tabler-react-2";

export const CheckEmailScreen = ({ setMode }) => {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f6f8fb",
      }}
    >
      <div
        style={{
          width: "450px",
          padding: "40px",
          borderRadius: "12px",
          backgroundColor: "#ffffff",
          boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <h1 style={{ marginBottom: "15px" }}>Check Your Email</h1>

        <p style={{ color: "#6c757d", marginBottom: "30px", fontSize: "14px" }}>
          Please check your inbox and follow the instructions. The link is valid for a single use.
        </p>

        <Button
          variant="primary"
          style={{ width: "100%", marginBottom: "15px" }}
          onClick={() => setMode("login")}
        >
          Back to Login
        </Button>
      </div>
    </div>
  );
};

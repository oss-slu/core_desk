import React, { useState } from "react";
import { Input, Button } from "tabler-react-2";
import { useAuth } from "#useAuth";

export const ForgotPasswordForm = ({ setMode }) => {
  const { sendPasswordResetEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await sendPasswordResetEmail({ email });
      setMode("check-email"); 
    } catch (err) {
      setError(err.message || "Failed to send reset link");
    }
  };

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
        }}
      >
        <h1 style={{ marginBottom: "15px", textAlign: "center" }}>
          Reset Password
        </h1>

        <p
          style={{
            marginBottom: "30px",
            color: "#6c757d",
            textAlign: "center",
            fontSize: "14px",
          }}
        >
          Enter your email address below and we’ll send you a link to reset your
          password.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(val) => setEmail(val)}
              required
            />
          </div>


          <Button
            type="submit"
            variant="primary"
            style={{ width: "100%" }}
          >
            Send Reset Link
          </Button>

          <Button
            type="button"
            variant="secondary"
            style={{ width: "100%", marginTop: "15px" }}
            onClick={() => setMode("login")}
          >
            Back to Login
          </Button>
        </form>
      </div>
    </div>
  );
};

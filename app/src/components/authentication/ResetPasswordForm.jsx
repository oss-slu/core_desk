import React, { useState } from "react";
import { Input, Button } from "tabler-react-2";
import { useAuth } from "#useAuth";

export const ResetPasswordForm = ({ token, setMode }) => {
  const { resetPassword } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");

    try {
      const success = await resetPassword({ newPassword, token });
      setSuccess(success);
    } catch (err) {
      setError("This reset link is no longer valid.");
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
          textAlign: "center",
        }}
      >
        {!success ? (
          <>
            <h1 style={{ marginBottom: "15px" }}>Reset Your Password</h1>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "10px" }}>
                <Input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(value) => setNewPassword(value)}
                  required
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(value) => setConfirmPassword(value)}
                  required
                />
              </div>

              {error && (
                <p style={{ color: "red", marginBottom: "15px" }}>{error}</p>
              )}

              <Button variant="primary" type="submit" style={{ width: "100%" }}>
                Reset Password
              </Button>

              <Button
                variant="secondary"
                style={{ width: "100%", marginTop: "15px" }}
                onClick={() => setMode("login")}
              >
                Cancel
              </Button>
            </form>
          </>
        ) : (
          <>
            <h1 style={{ marginBottom: "15px" }}>Password Reset Successful!</h1>
            <p style={{ color: "#6c757d", marginBottom: "30px" }}>
              Your password has been reset successfully. You can now log in with
              your new password.
            </p>
            <Button
              variant="primary"
              style={{ width: "100%" }}
              onClick={() => setMode("login")}
            >
              Continue to Login
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

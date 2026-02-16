import React, { useState, useEffect } from "react";
import { useAuth } from "#useAuth";
import { Input, Button } from "tabler-react-2";

export const Login = () => {
  const { standardLogin, loginWithOkta, sendPasswordResetEmail, resetPassword } =
    useAuth();

  const [token, setToken] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotMode, setForgotMode] = useState(false);


  //reset password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isResetMode = !!token;

  useEffect(() => {
    const url = new URL(window.location.href);
    const resetTok = url.searchParams.get("reset_tok");
    url.searchParams.delete("reset_tok");
    setToken(resetTok);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    standardLogin({ email, password });
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    sendPasswordResetEmail({ email });
  };

  const handleResetPassword =  (e) => {
    e.preventDefault();
    resetPassword({ password, token });

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
        <h1 style={{ marginBottom: "11px", textAlign: "center" }}>
          Welcome to CoreDesk
        </h1>

        <p
          style={{
            marginBottom: "30px",
            color: "#6c757d",
            textAlign: "center",
          }}
        >
          {isResetMode
            ? "Enter your new password"
            : forgotMode
            ? "Enter your email to reset your password"
            : "Please log in to continue"}
        </p>

        <form
          onSubmit={
            isResetMode
              ? handleResetPassword
              : forgotMode
              ? handleForgotPassword
              : handleSubmit
          }
        >
          {isResetMode ? (
            <>
              <div style={{ marginBottom: "20px" }}>
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
            </>
          ) : (
            <>
              <div style={{ marginBottom: "20px" }}>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(value) => setEmail(value)}
                  required
                />
              </div>

              {!forgotMode && (
                <div style={{ marginBottom: "20px" }}>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(value) => setPassword(value)}
                    required
                  />
                </div>
              )}
            </>
          )}

          <Button variant="primary" type="submit" style={{ width: "100%" }}>
            {isResetMode
              ? "Reset Password"
              : forgotMode
              ? "Send Reset Link"
              : "Login"}
          </Button>

          {!forgotMode && !isResetMode && (
            <>
              <div
                style={{
                  textAlign: "center",
                  margin: "20px 0",
                  fontSize: "13px",
                  color: "#6c757d",
                }}
              >
                — OR —
              </div>

              <Button
                variant="secondary"
                type="button"
                onClick={loginWithOkta}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                Login with SSO
              </Button>
            </>
          )}
        </form>

        {!isResetMode && (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <a
              href="/#"
              onClick={(e) => {
                e.preventDefault();
                setForgotMode(!forgotMode);
              }}
              style={{
                fontSize: "14px",
                color: "#206bc4",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              {forgotMode ? "Back to Login" : "Forgot Password?"}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

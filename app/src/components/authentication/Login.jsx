import React, { useState } from "react";
import { useAuth } from "#useAuth";
import { Input, Button } from "tabler-react-2";

export const Login = () => {
  const { standardLogin, loginWithOkta, forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotMode, setForgotMode] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    standardLogin({ email, password });
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    forgotPassword({ email });

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
          {forgotMode
            ? "Enter your email to reset your password"
            : "Please log in to continue"}
        </p>

        <form onSubmit={forgotMode ? handleForgotPassword : handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {!forgotMode && (
            <div style={{ marginBottom: "20px" }}>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          <Button variant="primary" type="submit" style={{ width: "100%" }}>
            {forgotMode ? "Send Reset Link" : "Login"}
          </Button>

          {!forgotMode && (
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
      </div>
    </div>
  );
};

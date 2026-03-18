import React, { useState } from "react";
import { Input, Button } from "tabler-react-2";
import { useAuth } from "#useAuth";

export const LoginForm = ({ setMode }) => {
  const { standardLogin, loginWithOkta } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      return;
    }

    try {
      await standardLogin({ email, password });
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
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
          Please log in to continue
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

          <div style={{ marginBottom: "20px" }}>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(val) => setPassword(val)}
              required
            />
          </div>

          {error && (
            <p
              style={{
                color: "red",
                marginBottom: "15px",
                textAlign: "center",
              }}
            >
              {error}
            </p>
          )}

          <Button variant="primary" type="submit" style={{ width: "100%" }}>
            Login
          </Button>

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
        </form>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <a
            href="/#"
            onClick={(e) => {
              e.preventDefault();
              setMode("forgot");
            }}
            style={{
              fontSize: "14px",
              color: "#206bc4",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            Forgot Password?
          </a>
        </div>
      </div>
    </div>
  );
};

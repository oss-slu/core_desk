import React from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";

export default () => {
  const { login } = useAuth();

  return (
    <>
      <h1>Welcome to React Vite Micro App!</h1>
      <p>Hard to get more minimal than this React app.</p>
      <button onClick={login}>Login</button>
    </>
  );
};

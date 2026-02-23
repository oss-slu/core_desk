import React, { useState, useEffect } from "react";

import { LoginForm } from "./LoginForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { CheckEmailScreen } from "./CheckEmailScreen";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const Login = () => {
  const [mode, setMode] = useState("login"); // five differint states : login, forgot, check-email, reset, reset-success
  const [token, setToken] = useState(null);

  useEffect(() => { //remove and save token for reset
    const url = new URL(window.location.href);
    const resetTok = url.searchParams.get("reset_tok");
    url.searchParams.delete("reset_tok");
    window.history.replaceState({}, document.title, "/");
    if (resetTok) {
      setToken(resetTok);
      setMode("reset");
    }
  }, []);

  // render based off the differint views
  const renderScreen = () => {
    switch (mode) {
      case "login":
        return <LoginForm setMode={setMode} />;

      case "forgot":
        return <ForgotPasswordForm setMode={setMode} />;

      case "check-email":
        return <CheckEmailScreen setMode={setMode} />;

      case "reset":
        return <ResetPasswordForm token={token} setMode={setMode} />;

      default:
        return <LoginForm setMode={setMode} />;
    }
  };

  return <>{renderScreen()}</>;
};

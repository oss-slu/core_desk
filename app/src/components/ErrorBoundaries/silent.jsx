import React from "react";
import * as Sentry from "@sentry/react";

export class SilentBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.log("Reporting sentry error");
    Sentry.captureException(error, {
      extra: info,
      tags: { component: "StlViewer" },
    });
  }

  render() {
    if (this.state.hasError) {
      console.log("Error caught");
      return this.props.fallback;
    }
    return this.props.children;
  }
}

import React from "react";

export const Icon = ({ i, size, color, ...props }) => (
  <i
    style={{
      fontSize: size,
      color: color,
    }}
    className={`ti ti-${i}`}
    {...props}
  >
    {JSON.stringify(size)}
  </i>
);

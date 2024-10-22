import React from "react";

export const Icon = ({ i, size, color }) => (
  <i
    style={{
      fontSize: size,
      color: color,
    }}
    className={`ti ti-${i}`}
  >
    {JSON.stringify(size)}
  </i>
);

import React from "react";

export const Icon = ({ i, size }) => (
  <i
    style={{
      fontSize: size,
    }}
    className={`ti ti-${i}`}
  ></i>
);

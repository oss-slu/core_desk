import React from "react";

export const Icon = ({ i, size }) => (
  <i
    style={{
      fontSize: size,
    }}
    class={`ti ti-${i}`}
  ></i>
);

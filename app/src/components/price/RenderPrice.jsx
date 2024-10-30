import React from "react";
import { Util } from "tabler-react-2";
import { Icon } from "../../util/Icon";

export const Price = ({ value = 0, icon, size }) => {
  return (
    <Util.Row gap={0} align="center">
      {/* {icon && <Icon i="currency-dollar" size={size ? size * 1.25 : 16} />} */}

      <span
        style={{
          fontSize: size ? size : 14,
          color: parseFloat(value) < 0 ? "var(--tblr-danger)" : "inherit",
        }}
      >
        {icon && "$"}
        {(parseFloat(value) || 0).toFixed(2)}
      </span>
    </Util.Row>
  );
};

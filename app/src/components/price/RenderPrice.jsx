import React from "react";
import { Util } from "tabler-react-2";
import { Icon } from "../../util/Icon";

export const Price = ({ value = 0, icon }) => {
  return (
    <Util.Row gap={0} align="center">
      {icon && <Icon i="currency-dollar" size={16} />}
      <span>{(parseFloat(value) || 0).toFixed(2)}</span>
    </Util.Row>
  );
};

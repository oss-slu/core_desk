import React from "react";
import { Util } from "tabler-react-2";
import { Icon } from "#icon";

export const Time = ({ value = 0, icon }) => {
  // Integer value is hours, decimals is in fraction of hour
  const hours = Math.floor(value);
  const minutes = Math.round((value % 1) * 60);

  return (
    <Util.Row gap={0} align="center">
      {icon && <Icon i="clock" size={16} />}
      <span>
        {hours}:{minutes.toString().padStart(2, "0")}
      </span>
    </Util.Row>
  );
};

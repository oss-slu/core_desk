import React from "react";

export const PieProgressChart = ({
  complete,
  inProgress,
  notStarted,
  exclude,
}) => {
  // Calculate percentages
  const completePercent = complete * 100;
  const inProgressPercent = inProgress * 100;
  const notStartedPercent = notStarted * 100;
  const excludePercent = exclude * 100;

  // Calculate cumulative percentages for hard stops
  const hardStopComplete = completePercent;
  const hardStopInProgress = hardStopComplete + inProgressPercent;
  const hardStopNotStarted = hardStopInProgress + notStartedPercent;
  const hardStopExclude = hardStopNotStarted + excludePercent;

  return (
    <div
      style={{
        backgroundImage: `radial-gradient(
          circle at 50% 50%,
          rgba(241,245,249,1) 0%,
          rgba(241,245,249,1) 50%,
          rgba(255,255,255,0) 50%
        ), conic-gradient(
          var(--tblr-success) 0% ${hardStopComplete}%,
          var(--tblr-yellow) ${hardStopComplete}% ${hardStopInProgress}%,
          var(--tblr-danger) ${hardStopInProgress}% ${hardStopNotStarted}%,
          var(--tblr-gray-400) ${hardStopNotStarted}% ${hardStopExclude}%
        )`,
        width: 24,
        height: 24,
        borderRadius: "50%",
      }}
    />
  );
};

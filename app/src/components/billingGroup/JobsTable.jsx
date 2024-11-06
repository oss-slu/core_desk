import React from "react";
import { useParams } from "react-router-dom";
import { useAuth, useJobs } from "../../hooks";
import { Table } from "tabler-react-2/dist/table";
import moment from "moment";
import { MOMENT_FORMAT } from "../../util/constants";
import { switchStatusForBadge } from "../../routes/shops/[shopId]/jobs";
import { Util, Switch, Typography } from "tabler-react-2";
import { Spinner } from "tabler-react-2/dist/spinner";
import { Button } from "tabler-react-2/dist/button";

export const JobsTable = () => {
  const { shopId, groupId } = useParams();
  const { jobs, loading, updateJob, opLoading, microLoading } = useJobs(shopId);
  const { user } = useAuth();

  if (loading) return <div>Loading...</div>;

  const jobsToRender = jobs.filter(
    (job) =>
      job.userId === user.id &&
      (job.status === "NOT_STARTED" || job.status === "IN_PROGRESS") &&
      (job.groupId === null || job.groupId === groupId)
  );

  return (
    <>
      <Util.Row align="center" justify="between">
        <Typography.H3>Pick an existing job</Typography.H3>
      </Util.Row>
      <Util.Spacer size={1} />
      <Table
        columns={[
          {
            label: "Selected",
            accessor: "groupId",
            render: (_groupId, context) =>
              opLoading || microLoading ? (
                <Spinner size="sm" />
              ) : (
                <Switch
                  value={_groupId === groupId}
                  onChange={(value) => {
                    updateJob(context.id, { groupId: value ? groupId : null });
                  }}
                />
              ),
          },
          { label: "Title", accessor: "title" },
          {
            label: "Status",
            accessor: "status",
            render: (status) => switchStatusForBadge(status),
          },
          {
            label: "Created At",
            accessor: "createdAt",
            render: (createdAt) => moment(createdAt).format(MOMENT_FORMAT),
          },
          {
            label: "Due Date",
            accessor: "dueDate",
            render: (dueDate) =>
              moment(dueDate).format("MM/DD/YY") +
              " (" +
              moment(dueDate).fromNow() +
              ")",
          },
        ]}
        data={jobsToRender}
      />
      <Util.Spacer size={1} />
      <i className="text-secondary">
        Only jobs that are not started or in progress are shown here and are
        eligible to be added to the billing group.
      </i>
    </>
  );
};

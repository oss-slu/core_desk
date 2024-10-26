import React from "react";
import { Link, useParams } from "react-router-dom";
import { Page } from "../../../../components/page/page";
import { useShop } from "../../../../hooks/useShop";
import { shopSidenavItems } from "../../[shopId]/index";
import { useAuth } from "../../../../hooks/useAuth";
import { Typography, Util } from "tabler-react-2";
const { H1, H3 } = Typography;
import { useJobs } from "../../../../hooks/useJobs";
import { Button } from "tabler-react-2/dist/button";
import { Table } from "tabler-react-2/dist/table";
import Badge from "tabler-react-2/dist/badge";
import moment from "moment";
import { Loading } from "../../../../components/loading/loading";
import { PieProgressChart } from "../../../../components/piechart/PieProgressChart";
import { Icon } from "../../../../util/Icon";
import { Avatar } from "tabler-react-2/dist/avatar";

const switchStatusForBadge = (status) => {
  switch (status) {
    case "IN_PROGRESS":
      return (
        <Badge color="yellow" soft>
          In Progress
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge color="green" soft>
          Completed
        </Badge>
      );
    case "NOT_STARTED":
      return (
        <Badge color="red" soft>
          Not Started
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge color="secondary" soft>
          Cancelled
        </Badge>
      );
    case "WONT_DO":
      return (
        <Badge color="secondary" soft>
          Won't Do
        </Badge>
      );
    case "WAITING":
      return (
        <Badge color="blue" soft>
          Waiting
        </Badge>
      );
    default:
      return "primary";
  }
};

export const Jobs = () => {
  const { user, loading } = useAuth();
  const { shopId } = useParams();
  const { shop, userShop } = useShop(shopId);
  const {
    jobs,
    loading: jobsLoading,
    ModalElement,
    createJob,
  } = useJobs(shopId);

  if (jobsLoading) {
    return (
      <Page
        sidenavItems={shopSidenavItems(
          "Jobs",
          shopId,
          user.admin,
          userShop.accountType
        )}
      >
        <Loading />
      </Page>
    );
  }

  return (
    <Page
      sidenavItems={shopSidenavItems(
        "Jobs",
        shopId,
        user.admin,
        userShop.accountType
      )}
    >
      <Util.Row justify="between" align="center">
        <div>
          <H1>Jobs</H1>
          <H3>{shop.name}</H3>
        </div>
        <Button onClick={createJob}>Create Job</Button>
      </Util.Row>
      {jobs.length === 0 ? (
        <i>
          No jobs found. Click the "Create Job" button above to create a new
          job.
        </i>
      ) : (
        <Table
          columns={[
            {
              label: "Title",
              accessor: "title",
              render: (title, context) => (
                <Link to={`/shops/${shopId}/jobs/${context.id}`}>{title}</Link>
              ),
              sortable: true,
            },
            {
              label: "Submitter",
              accessor: "user.name",
              render: (name, context) => (
                <Util.Row gap={0.5} align="center">
                  <Avatar size="sm" dicebear initials={context.user.id} />
                  <Util.Col align="start">
                    {name}
                    {context.user.id === user.id && (
                      <Badge color="green" soft>
                        You
                      </Badge>
                    )}
                  </Util.Col>
                </Util.Row>
              ),
            },
            // {
            //   label: "Description",
            //   accessor: "description",
            //   render: (d) => d.slice(0, 35).concat(d.length > 35 ? "..." : ""),
            // },
            {
              label: "Items",
              accessor: "itemsCount",
            },
            {
              label: "Progress",
              accessor: "progress",
              render: (d, _) => (
                <Util.Row gap={1} align="center">
                  <Util.Col justify="between" gap={1}>
                    {/* Prevent line break at all */}
                    <span
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      <Icon i="sum" size={14} />
                      {_.itemsCount}
                    </span>
                    {_.itemsCount === 0 ? (
                      <PieProgressChart
                        complete={0}
                        inProgress={0}
                        notStarted={0}
                        exclude={1}
                      />
                    ) : (
                      <PieProgressChart
                        complete={d.completedCount / _.itemsCount}
                        inProgress={d.inProgressCount / _.itemsCount}
                        notStarted={d.notStartedCount / _.itemsCount}
                        exclude={d.excludedCount / _.itemsCount}
                      />
                    )}
                    <div className="sos-600">
                      <span className="text-success">{d.completedCount}</span>
                      <span className="text-yellow">{d.inProgressCount}</span>
                      <span className="text-danger">{d.notStartedCount}</span>
                      <span className="text-gray-400">{d.excludedCount}</span>
                    </div>
                  </Util.Col>
                  <div style={{ fontSize: 10 }} className="hos-600">
                    <span className="text-success">
                      <Icon i="circle-check" size={10} /> {d.completedCount} /{" "}
                      {_.itemsCount}
                      <span className="hos-900"> Completed</span>
                    </span>
                    <br />
                    <span className="text-yellow">
                      <Icon i="progress" size={10} /> {d.inProgressCount} /{" "}
                      {_.itemsCount}
                      <span className="hos-900"> In Progress</span>
                    </span>
                    <br />
                    <span className="text-danger">
                      <Icon i="minus" size={10} /> {d.notStartedCount} /{" "}
                      {_.itemsCount}
                      <span className="hos-900"> Not Started</span>
                    </span>
                    <br />
                    <span className="text-gray-400">
                      <Icon i="x" size={10} /> {d.excludedCount} /{" "}
                      {_.itemsCount}
                      <span className="hos-900"> Excluded</span>
                    </span>
                  </div>
                </Util.Row>
              ),
            },
            {
              label: "Status",
              accessor: "status",
              render: (d) => switchStatusForBadge(d),
              sortable: true,
            },
            {
              label: "Due Date",
              accessor: "dueDate",
              render: (d) => (
                <>
                  {moment(d).format("MM/DD/YYYY")} ({moment(d).fromNow()}){" "}
                  {/* Overdue warning */}
                  {new Date(d) < new Date() &&
                    !(
                      new Date(d).toDateString() === new Date().toDateString()
                    ) && <Badge color="red">Overdue</Badge>}
                  {/* Today warning */}{" "}
                  {new Date(d).toDateString() === new Date().toDateString() && (
                    <Badge color="yellow">Due Today</Badge>
                  )}
                </>
              ),
              sortable: true,
            },
          ]}
          data={jobs}
        />
      )}
      {ModalElement}
    </Page>
  );
};

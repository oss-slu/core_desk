import React from "react";
import { Link, useParams } from "react-router-dom";
import { Page } from "../../components/page/page";
import { useShop } from "../../hooks/useShop";
import { shopSidenavItems } from "./[shopId]";
import { useAuth } from "../../hooks/useAuth";
import { Typography, Util } from "tabler-react-2";
const { H1, H3 } = Typography;
import { useJobs } from "../../hooks/useJobs";
import { Button } from "tabler-react-2/dist/button";
import { Table } from "tabler-react-2/dist/table";
import Badge from "tabler-react-2/dist/badge";
import moment from "moment";

const switchStatusForBadge = (status) => {
  switch (status) {
    case "IN_PROGRESS":
      return (
        <Badge color="blue" soft>
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
        <Badge color="grey" soft>
          Cancelled
        </Badge>
      );
    case "WONT_DO":
      return (
        <Badge color="grey" soft>
          Won't Do
        </Badge>
      );
    case "WAITING":
      return (
        <Badge color="yellow" soft>
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

  return (
    <Page
      sidenavItems={shopSidenavItems(
        "Jobs",
        shopId,
        user.admin,
        userShop.accountType
      )}
    >
      <Util.Row style={{ justifyContent: "space-between" }}>
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
                <Link to={`/shops/${shopId}/job/${context.id}`}>{title}</Link>
              ),
              sortable: true,
            },
            {
              label: "Description",
              accessor: "description",
              render: (d) => d.slice(0, 35).concat(d.length > 35 ? "..." : ""),
            },
            {
              label: "Items",
              accessor: "itemsCount",
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
              render: (d) => moment(d).format("MM/DD/YYYY"),
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

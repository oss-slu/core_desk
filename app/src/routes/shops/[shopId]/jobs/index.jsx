import React, { useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Page } from "#page";
import { useShop } from "../../../../hooks/useShop";
import { shopSidenavItems } from "../../[shopId]/index";
import { useAuth } from "#useAuth";
import {
  Typography,
  Util,
  Input,
  Badge,
  Dropdown,
  SegmentedControl,
} from "tabler-react-2";
const { H1, H3, H4 } = Typography;
import { useJobs } from "../../../../hooks/useJobs";
import { useUser } from "../../../../hooks/useUser";
import { Button } from "#button";
import moment from "moment";
import { Loading } from "#loading";
import { PieProgressChart } from "../../../../components/piechart/PieProgressChart";
import { Icon } from "#icon";
import { ShopUserPicker } from "#shopUserPicker";
import { Price } from "#renderPrice";
import { SearchBar } from "../../../../components/searchBar/SearchBar";
import { TableV2 } from "tabler-react-2";

export const switchStatusForBadge = (status) => {
  switch (status) {
    case "IN_PROGRESS":
      return (
        // <Badge color="yellow" soft>
        //   In Progress
        // </Badge>
        <p style={{ marginBottom: 0 }}>In Progress</p>
      );
    case "COMPLETED":
      return (
        // <Badge color="green" soft>
        //   Completed
        // </Badge>
        <p style={{ marginBottom: 0 }}>Completed</p>
      );
    case "NOT_STARTED":
      return (
        // <Badge color="red" soft>
        //   Not Started
        // </Badge>
        <p style={{ marginBottom: 0 }}>Not Started</p>
      );
    case "CANCELLED":
      return (
        // <Badge color="secondary" soft>
        //   Cancelled
        // </Badge>
        <p style={{ marginBottom: 0 }}>Cancelled</p>
      );
    case "WONT_DO":
      return (
        // <Badge color="secondary" soft>
        //   Won't Do
        // </Badge>
        <p style={{ marginBottom: 0 }}>Won't Do</p>
      );
    case "WAITING":
      return (
        // <Badge color="blue" soft>
        //   Waiting
        // </Badge>
        <p style={{ marginBottom: 0 }}>Waiting</p>
      );
    case "WAITING_FOR_PICKUP":
      return (
        // <Badge color="teal" soft>
        //   Waiting for Pickup
        // </Badge>
        <p style={{ marginBottom: 0 }}>Waiting for Pickup</p>
      );
    case "WAITING_FOR_PAYMENT":
      return (
        // <Badge color="orange" soft>
        //   Waiting for Payment
        // </Badge>
        <p style={{ marginBottom: 0 }}>Waiting for Payment</p>
      );
    default:
      return "primary";
  }
};

/*
{ id: "IN_PROGRESS", label: "In Progress" },
{ id: "COMPLETED", label: "Completed" },
{ id: "NOT_STARTED", label: "Not Started" },
{ id: "CANCELLED", label: "Cancelled" },
{ id: "WONT_DO", label: "Won't Do" },
{ id: "WAITING", label: "Waiting" },
*/

const NEWFilters = ({
  statusOptions,
  handleStatusToggle,
  statusFilter,
  activeUser,
  userShop,
  submitterFilter,
  setSubmitterFilter,
  startDateFilter,
  setStartDateFilter,
  endDateFilter,
  setEndDateFilter,
  columnsOptions,
  handleColumnToggle,
  columnsToShow,
  handleFinalizedToggle,
  finalizedFilter,
  finalizedOptions,
}) => (
  <div>
    <Util.Row justify="between" align="start">
      <Util.Row gap={1}>
        <Util.Col gap={0}>
          <H4>Status</H4>
          <Dropdown
            prompt="Select Status"
            items={statusOptions.map(({ id, label }) => ({
              text: (
                <div key={id} onClick={() => handleStatusToggle(id)}>
                  <Util.Row justify="between" gap={0.5}>
                    {statusFilter.includes(id) ? (
                      <Icon i="square-check" />
                    ) : (
                      <Icon i="square" />
                    )}
                    {label}
                  </Util.Row>
                </div>
              ),
            }))}
            showSearch={false}
          />
        </Util.Col>
        {(activeUser?.admin ||
          userShop.accountType === "ADMIN" ||
          userShop.accountType === "OPERATOR") && (
          <Util.Col gap={0}>
            <H4>Submitter</H4>
            <ShopUserPicker
              value={submitterFilter}
              onChange={setSubmitterFilter}
              includeNone={true}
            />
          </Util.Col>
        )}
        <Util.Col gap={0}>
          <H4>Due Date Range</H4>
          <Util.Row gap={0.5}>
            <Input
              type="date"
              onChange={(e) => setStartDateFilter(e + "T00:00:00")}
              value={startDateFilter?.split("T")[0]}
              icon={startDateFilter && <Icon i="x" />}
              iconPos="trailing"
              separated={!!startDateFilter}
              appendedLinkOnClick={() => setStartDateFilter(null)}
            />
            <h2> - </h2>
            <Input
              type="date"
              onChange={(e) => setEndDateFilter(e + "T00:00:00")}
              value={endDateFilter?.split("T")[0]}
              icon={endDateFilter && <Icon i="x" />}
              iconPos="trailing"
              separated={!!endDateFilter}
              appendedLinkOnClick={() => setEndDateFilter(null)}
            />
          </Util.Row>
        </Util.Col>
        <Util.Col gap={0}>
          <h4>Columns</h4>
          <Dropdown
            prompt="Select Columns"
            items={columnsOptions.map((id) => ({
              text: (
                <div
                  key={id}
                  onClick={() => {
                    handleColumnToggle(id);
                  }}
                >
                  <Util.Row justify="between" gap={0.5}>
                    {columnsToShow.includes(id) ? (
                      <Icon i="square-check" />
                    ) : (
                      <Icon i="square" />
                    )}
                    {id}
                  </Util.Row>
                </div>
              ),
            }))}
            showSearch={false}
            multiple={true}
            selectedItems={columnsToShow.map((id) => ({
              text: id,
              label: id,
            }))}
          />
        </Util.Col>
      </Util.Row>
    </Util.Row>
    <Util.Col>
      <>
        <SegmentedControl
          value={finalizedFilter}
          items={finalizedOptions.map(({ id, label, style }) => ({
            id,
            label,
            style,
          }))}
          onChange={(newFilter) => handleFinalizedToggle(newFilter.id)}
          style={{
            minWidth: 150,
            marginBottom: -17,
            alignSelf: "flex-end",
          }}
          buttonStyle={{
            color: "black",
            fontFamily: "inherit",
            fontWeight: "inherit",
            borderRadius: 0,
            borderBottom: "1px solid rgb(218 223 228)",
          }}
          buttonClassName="btn"
        />
      </>
    </Util.Col>
  </div>
);

export const Jobs = () => {
  const { user: activeUser } = useAuth();
  const { shopId } = useParams();
  const { userShop } = useShop(shopId);
  const {
    jobs,
    loading: jobsLoading,
    ModalElement,
    CreateSimpleSubPage,
    createJob,
  } = useJobs(shopId);
  const { user } = useUser(activeUser.id);

  // State variables for filters
  const [statusFilter, setStatusFilter] = useState([
    "NOT_STARTED",
    "IN_PROGRESS",
    "WAITING",
    "WAITING_FOR_PICKUP",
    "WAITING_FOR_PAYMENT",
  ]);
  const [startDateFilter, setStartDateFilter] = useState(null);
  const [endDateFilter, setEndDateFilter] = useState(null);
  const [submitterFilter, setSubmitterFilter] = useState(null);
  const [finalizedFilter, setFinalizedFilter] = useState("false");

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(25);
  const [sorting, setSorting] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const statusOptions = [
    {
      id: "NOT_STARTED",
      label: "Not Started",
      // color: "red",
    },
    {
      id: "IN_PROGRESS",
      label: "In Progress",
      // color: "yellow"
    },
    {
      id: "COMPLETED",
      label: "Completed",
      // color: "green"
    },
    {
      id: "WAITING",
      label: "Waiting",
      // color: "blue",
    },
    {
      id: "CANCELLED",
      label: "Cancelled",
      // color: "secondary"
    },
    {
      id: "WONT_DO",
      label: "Won't Do",
      // color: "secondary",
    },
    {
      id: "WAITING_FOR_PICKUP",
      label: "Waiting for Pickup",
      // color: "teal",
    },
    {
      id: "WAITING_FOR_PAYMENT",
      label: "Waiting for Payment",
      // color: "orange",
    },
  ];
  const finalizedOptions = [
    {
      id: "true",
      label: "Finalized",
      style: {
        borderColor: finalizedFilter === "true" ? "black" : "lightgray",
        borderTopLeftRadius: 4,
        borderBottom: finalizedFilter === "true" ? "#F8FAFC" : "lightgray",
      },
    },
    {
      id: "false",
      label: "Not Finalized",
      style: {
        borderColor: finalizedFilter === "false" ? "black" : "lightgray",
        borderTopRightRadius: 4,
        borderBottom: finalizedFilter === "false" ? "#F8FAFC" : "lightgray",
      },
    },
  ];

  const handleStatusToggle = (id) => {
    setStatusFilter(
      statusFilter.includes(id)
        ? statusFilter.filter((s) => s !== id)
        : [...statusFilter, id],
    );
  };

  const handleFinalizedToggle = (id) => {
    setFinalizedFilter(id);
  };

  const columnsOptions = [
    "Title",
    "Submitter",
    "Payer",
    "Description",
    "Total Cost",
    "Affordability",
    "Items",
    "Progress",
    "Status",
    "Finalized",
    "Finalized At",
    "Due Date",
    "Created At",
  ];
  const [columnsToShow, setColumnsToShow] = useState([
    "Title",
    "Submitter",
    "Payer",
    "Total Cost",
    "Progress",
    "Status",
    "Due Date",
    "Created At",
  ]);

  const columnLabelToIdMap = {
    Title: "title",
    Submitter: "submitter",
    Payer: "payer",
    Description: "description",
    "Total Cost": "totalCost",
    Affordability: "affordability",
    Items: "items",
    Progress: "progress",
    Status: "status",
    Finalized: "finalized",
    "Finalized At": "finalizedAt",
    "Due Date": "dueDate",
    "Created At": "createdAt",
  };

  const handleColumnToggle = (id) => {
    setColumnsToShow(
      columnsToShow.includes(id)
        ? columnsToShow.filter((s) => s !== id)
        : [...columnsToShow, id],
    );
  };

  // Apply filters to jobs
  const filteredJobs = jobs.filter((job) => {
    const searchMatches =
      !searchTerm ||
      JSON.stringify(job).toLowerCase().includes(searchTerm.toLowerCase());
    // Filter by status
    const statusMatches =
      statusFilter.length === 0 || statusFilter.includes(job.status);

    // Filter by date range
    const dueDate = new Date(job.dueDate);
    const startDateMatches =
      !startDateFilter || dueDate >= new Date(startDateFilter);
    const endDateMatches = !endDateFilter || dueDate <= new Date(endDateFilter);

    // Filter by submitter
    const submitterId = job.user.id;
    const submitterMatches =
      !submitterFilter || submitterId === submitterFilter;
    const finalizedMatches =
      !finalizedFilter ||
      finalizedFilter === (job.finalized ? "true" : "false");

    // Return true if all conditions are met
    return (
      searchMatches &&
      statusMatches &&
      startDateMatches &&
      endDateMatches &&
      submitterMatches &&
      finalizedMatches
    );
  });
  const columns = useMemo(
    () => [
      {
        id: "title",
        header: "Title",
        accessorFn: (row) => row.title,
        cell: ({ row }) => (
          <Link to={`/shops/${shopId}/jobs/${row.original.id}`}>
            {row.original.title}
          </Link>
        ),
        enableSorting: true,
      },
      {
        id: "submitter",
        header: "Submitter",
        accessorFn: (row) => row.user?.name,
        cell: ({ row, getValue }) => {
          const context = row.original;
          return (
            <Util.Row gap={0.5} align="center">
              <Util.Col align="start">
                {getValue()}
                {context.user.id === activeUser?.id && (
                  <Badge color="green" soft>
                    You
                  </Badge>
                )}
              </Util.Col>
            </Util.Row>
          );
        },
        enableSorting: false,
      },
      {
        id: "payer",
        header: "Payer",
        accessorFn: (row) => row.billingAccount?.name,
        cell: ({ row, getValue }) => {
          const context = row.original;
          return (
            <Util.Row gap={0.5} align="center">
              <span>{getValue() || "N/A"}</span>
              {context.billingAccount?.type === "GROUP" && (
                <Badge color="blue" soft>
                  Group
                </Badge>
              )}
            </Util.Row>
          );
        },
        enableSorting: false,
      },
      {
        id: "totalCost",
        header: "Total Cost",
        accessorFn: (row) => row.totalCost,
        cell: ({ row, getValue }) => {
          const context = row.original;
          return (
            <Util.Row gap={0.25}>
              <Price value={getValue()} icon />
              {!context.finalized && "*"}
            </Util.Row>
          );
        },
        enableSorting: true,
      },
      {
        id: "progress",
        header: "Progress",
        accessorFn: (row) => row.progress,
        cell: ({ row, getValue }) => {
          const context = row.original;
          const d = getValue();

          return (
            <Util.Row gap={1} align="center">
              {context.itemsCount === 0 ? (
                <PieProgressChart
                  complete={0}
                  inProgress={0}
                  notStarted={0}
                  exclude={1}
                />
              ) : (
                <PieProgressChart
                  complete={d.completedCount / context.itemsCount}
                  inProgress={d.inProgressCount / context.itemsCount}
                  notStarted={d.notStartedCount / context.itemsCount}
                  exclude={d.excludedCount / context.itemsCount}
                />
              )}
            </Util.Row>
          );
        },
        enableSorting: false,
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (row) => row.status,
        cell: ({ getValue }) => switchStatusForBadge(getValue()),
        enableSorting: true,
      },
      {
        id: "dueDate",
        header: "Due Date",
        accessorFn: (row) => row.dueDate,
        cell: ({ row, getValue }) => {
          const context = row.original;
          const d = getValue();
          const now = new Date();

          return (
            <>
              {moment(d).format("MM/DD/YY")} ({moment(d).fromNow()})
              {new Date(d) < now &&
                new Date(d).toDateString() !== now.toDateString() &&
                !context.finalized && <Badge color="red">Overdue</Badge>}
              {new Date(d).toDateString() === now.toDateString() && (
                <Badge color="yellow">Due Today</Badge>
              )}
            </>
          );
        },
        enableSorting: true,
      },
      {
        id: "createdAt",
        header: "Created At",
        accessorFn: (row) => row.createdAt,
        cell: ({ getValue }) => {
          const value = getValue();
          return value ? moment(value).format("MM/DD/YY hh:mm a") : "-";
        },
        enableSorting: true,
      },
    ],
    [shopId, activeUser],
  );

  const visibleColumns = useMemo(() => {
    const visibleColumnIds = new Set(
      columnsToShow.map((label) => columnLabelToIdMap[label]).filter(Boolean),
    );

    return columns.filter((column) => visibleColumnIds.has(column.id));
  }, [columns, columnsToShow]);

  const ordered = useMemo(() => {
    if (!sorting.length) return filteredJobs;

    const { id, desc } = sorting[0];

    const sorted = [...filteredJobs].sort((a, b) => {
      let aVal;
      let bVal;

      switch (id) {
        case "title":
          aVal = a.title;
          bVal = b.title;
          break;
        case "totalCost":
          aVal = a.totalCost;
          bVal = b.totalCost;
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "dueDate":
          aVal = a.dueDate;
          bVal = b.dueDate;
          break;
        case "createdAt":
          aVal = a.createdAt;
          bVal = b.createdAt;
          break;
        default:
          return 0;
      }

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // dates
      if (["dueDate", "createdAt"].includes(id)) {
        return new Date(aVal) - new Date(bVal);
      }

      // numbers
      if (!isNaN(aVal) && !isNaN(bVal)) {
        return Number(aVal) - Number(bVal);
      }

      // strings
      return String(aVal).localeCompare(String(bVal));
    });

    return desc ? sorted.reverse() : sorted;
  }, [filteredJobs, sorting]);

  const pageData = useMemo(() => {
    const start = (page - 1) * size;
    return ordered.slice(start, start + size);
  }, [ordered, page, size]);

  if (jobsLoading) {
    return <Loading />;
  }

  if (user?.simple === false) {
    return (
      <Page
        sidenavItems={shopSidenavItems(
          "Jobs",
          shopId,
          activeUser?.admin,
          userShop.accountType,
          userShop.balance < 0,
        )}
      >
        <Util.Row justify="between" align="center">
          <div>
            <H1>Jobs</H1>
          </div>
          <Button onClick={createJob}>Create Job</Button>
        </Util.Row>
        <Util.Spacer size={1} />

        <div
          style={{
            padding: 16,
            borderBottom: "1px solid rgb(218 223 228)",
            backgroundColor: "#F8FAFC",
          }}
        >
          <H3>Filters</H3>
          <SearchBar
            onSearch={(value) => {
              setSearchTerm(value);
              setPage(1);
            }}
          />
          <NEWFilters
            {...{
              statusOptions,
              handleStatusToggle,
              statusFilter,
              activeUser,
              userShop,
              submitterFilter,
              setSubmitterFilter,
              startDateFilter,
              setStartDateFilter,
              endDateFilter,
              setEndDateFilter,
              columnsOptions,
              handleColumnToggle,
              columnsToShow,
              handleFinalizedToggle,
              finalizedFilter,
              finalizedOptions,
            }}
          />
        </div>
        {/* <Util.Spacer size={2} /> */}

        {/* Jobs Table */}
        {filteredJobs.length === 0 ? (
          <i>
            No jobs found. Adjust your filters or click the "Create Job" button
            above to create a new job.
          </i>
        ) : (
          <>
            <TableV2
              columns={visibleColumns}
              data={pageData}
              page={page}
              size={size}
              totalRows={filteredJobs.length}
              onPageChange={setPage}
              onSizeChange={(n) => {
                setPage(1);
                setSize(n);
              }}
              sorting={sorting}
              onSortingChange={(next) => {
                setPage(1);
                setSorting(next);
              }}
            />
            <Util.Spacer size={1} />
            <i className="text-secondary">
              * Total cost is an estimate reflecting the current state of the
              job. Because the job is not finalized, the cost may change as the
              job progresses.
            </i>
          </>
        )}
        {ModalElement}
      </Page>
    );
  } else {
    return (
      <div>
        <CreateSimpleSubPage />
      </div>
    );
  }
};

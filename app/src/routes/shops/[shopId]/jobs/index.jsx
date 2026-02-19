import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Page } from "#page";
import { useShop } from "../../../../hooks/useShop";
import { shopSidenavItems } from "../../[shopId]/index";
import { useAuth } from "#useAuth";
import { Typography, Util, Input, Badge, Dropdown, SegmentedControl } from "tabler-react-2";
const { H1, H3, H4 } = Typography;
import { useJobs } from "../../../../hooks/useJobs";
import { useUser } from "../../../../hooks/useUser";
import { Button } from "#button";
import { Table } from "#table";
import moment from "moment";
import { Loading } from "#loading";
import { PieProgressChart } from "../../../../components/piechart/PieProgressChart";
import { Icon } from "#icon";
import { ShopUserPicker } from "#shopUserPicker";
import { Price } from "#renderPrice";

export const switchStatusForBadge = (status) => {
  switch (status) {
    case "IN_PROGRESS":
      return (
        // <Badge color="yellow" soft>
        //   In Progress
        // </Badge>
        <p style={{marginBottom: 0}}>In Progress</p>
      );
    case "COMPLETED":
      return (
        // <Badge color="green" soft>
        //   Completed
        // </Badge>
        <p style={{marginBottom: 0}}>Completed</p>
      );
    case "NOT_STARTED":
      return (
        // <Badge color="red" soft>
        //   Not Started
        // </Badge>
        <p style={{marginBottom: 0}}>Not Started</p>
      );
    case "CANCELLED":
      return (
        // <Badge color="secondary" soft>
        //   Cancelled
        // </Badge>
        <p style={{marginBottom: 0}}>Cancelled</p>
      );
    case "WONT_DO":
      return (
        // <Badge color="secondary" soft>
        //   Won't Do
        // </Badge>
        <p style={{marginBottom: 0}}>Won't Do</p>
      );
    case "WAITING":
      return (
        // <Badge color="blue" soft>
        //   Waiting
        // </Badge>
        <p style={{marginBottom: 0}}>Waiting</p>
      );
    case "WAITING_FOR_PICKUP":
      return (
        // <Badge color="teal" soft>
        //   Waiting for Pickup
        // </Badge>
        <p style={{marginBottom: 0}}>Waiting for Pickup</p>
      );
    case "WAITING_FOR_PAYMENT":
      return (
        // <Badge color="orange" soft>
        //   Waiting for Payment
        // </Badge>
        <p style={{marginBottom: 0}}>Waiting for Payment</p>
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

export const Jobs = () => {
  const { user: activeUser } = useAuth();
  const { shopId } = useParams();
  const { userShop } = useShop(shopId);
  const {
    jobs,
    loading: jobsLoading,
    ModalElement,
    CreateSimpleSubPage,
    CreateTDXJob,
    createJob,
  } = useJobs(shopId);
  const { user } = useUser(activeUser.id);

  // Create Job options
  const jobOptions = [
    <div><Button onClick={createJob}>Create Job</Button><hr className="mt-2 mb-0"/></div>,
    <CreateTDXJob />
  ];

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
    { id: "true", 
      label: "Finalized", 
      style: { borderColor: finalizedFilter === "true" ? "black" : "lightgray", 
        borderTopLeftRadius: 4,
        borderBottom: finalizedFilter === "true" ? "#F8FAFC" : "lightgray" } },
    { id: "false", 
      label: "Not Finalized", 
      style: { borderColor: finalizedFilter === "false" ? "black" : "lightgray", 
        borderTopRightRadius: 4,
        borderBottom: finalizedFilter === "false" ? "#F8FAFC" : "lightgray"  } },
  ];

  const handleStatusToggle = (id) => {
    setStatusFilter(
      statusFilter.includes(id)
        ? statusFilter.filter((s) => s !== id)
        : [...statusFilter, id]
    );
  };

  const handleFinalizedToggle = (id) => {
    setFinalizedFilter(id);
  };

  const columnsOptions = [
    "Title",
    "Submitter",
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
    "Total Cost",
    "Progress",
    "Status",
    "Due Date",
  ]);

  const handleColumnToggle = (id) => {
    setColumnsToShow(
      columnsToShow.includes(id)
        ? columnsToShow.filter((s) => s !== id)
        : [...columnsToShow, id]
    );
  };

  if (jobsLoading) {
    return <Loading />;
  }

  // Apply filters to jobs
  const filteredJobs = jobs.filter((job) => {
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
      finalizedFilter.length === 0 ||
      finalizedFilter.includes(job.finalized ? "true" : "false");

    // Return true if all conditions are met
    return (
      statusMatches &&
      startDateMatches &&
      endDateMatches &&
      submitterMatches &&
      finalizedMatches
    );
  });

  const NEWFilters = () => (
    <div>
      <Util.Row justify="between" align="start">
        <Util.Row gap={1}>
          <Util.Col gap={0}>
            <H4>Status</H4>
            <Dropdown prompt="Select Status" items={statusOptions.map(({id, label}) => ({text:
                <div
                  key={id}
                  onClick={() => handleStatusToggle(id)}
                >
                  <Util.Row justify="between" gap={0.5}>
                      {statusFilter.includes(id) ? (
                      <Icon i="square-check" />
                    ) : (
                      <Icon i="square" />
                    )}
                    {label}
                  </Util.Row>
                </div>}))}
              showSearch={false}/>
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
              items={columnsOptions.map((id) => ({text:
                <div
                  key={id}
                  onClick={() => {handleColumnToggle(id);}}
                >
                  <Util.Row justify="between" gap={0.5}>
                    {columnsToShow.includes(id) ? (
                      <Icon i="square-check" />
                    ) : (
                      <Icon i="square" />
                    )}
                    {id}
                  </Util.Row>
                </div>}))}
              showSearch={false}
              multiple={true}
              selectedItems={columnsToShow.map((id) => ({ text: id, label: id }))}
            />
          </Util.Col>
        </Util.Row>
      </Util.Row>
      <Util.Col>
        <SegmentedControl
          value={finalizedFilter}
          items={finalizedOptions.map(({ id, label, style }) => ({id, label, style}))}
          onChange={(newFilter) => handleFinalizedToggle(newFilter.id)}
          style={{ minWidth: 150, marginBottom: -17, alignSelf: "flex-end" }}
          buttonStyle={{ color: "black", fontFamily: "inherit", fontWeight: "inherit", borderRadius: 0, borderBottom: "1px solid rgb(218 223 228)" }}
          buttonClassName="btn"
        />
      </Util.Col>
      </div>
  );

  if (user?.simple === false) {
    return (
      <Page
        sidenavItems={shopSidenavItems(
          "Jobs",
          shopId,
          activeUser?.admin,
          userShop.accountType,
          userShop.balance < 0
        )}
      >
        <Util.Row justify="between" align="center">
          <div>
            <H1>Jobs</H1>
          </div>
          <Dropdown
            dropdownClassName="hover:bg-white"
            prompt="Create or Import Job"
            items={[
              {type: "item", text: <Button onClick={createJob}>Create Job</Button>},
              {type: "divider"},
              {type: "item", text: <CreateTDXJob />}
            ]}
          >
          </Dropdown>
        </Util.Row>
        <Util.Spacer size={1} />

        <div style={{ padding: 16, borderBottom: "1px solid rgb(218 223 228)", backgroundColor: "#F8FAFC" }}>
          <H3>Filters</H3>
          <NEWFilters />
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
            <Table
              columns={[
                {
                  label: "Title",
                  accessor: "title",
                  render: (title, context) => (
                    <Link to={`/shops/${shopId}/jobs/${context.id}`}>
                      {title}
                    </Link>
                  ),
                  sortable: true,
                },
                {
                  label: "Submitter",
                  accessor: "user.name",
                  render: (name, context) => (
                    <Util.Row gap={0.5} align="center">
                      {/* <Avatar size="sm" dicebear initials={context.user.id} /> */}
                      <Util.Col align="start">
                        {name}
                        {context.user.id === activeUser?.id && (
                          <Badge color="green" soft>
                            You
                          </Badge>
                        )}
                      </Util.Col>
                    </Util.Row>
                  ),
                },
                {
                  label: "Description",
                  accessor: "description",
                  render: (d) =>
                    d.slice(0, 35).concat(d.length > 35 ? "..." : ""),
                },
                {
                  label: "Total Cost",
                  accessor: "totalCost",
                  render: (d, context) => (
                    <Util.Row gap={0.25}>
                      <Price value={d} icon />
                      {!context.finalized && "*"}
                    </Util.Row>
                  ),
                  sortable: true,
                },
                {
                  label: "Affordability",
                  accessor: "totalCost",
                  render: (d) =>
                    d > userShop.balance ? (
                      <Badge color="red" soft>
                        Insufficient Funds
                      </Badge>
                    ) : (
                      <Badge color="green" soft>
                        Sufficient Funds
                      </Badge>
                    ),
                },
                {
                  label: "Items",
                  accessor: "itemsCount",
                  sortable: true,
                },
                // {
                //   label: "Progress",
                //   accessor: "progress",
                //   render: (d, _) => (
                //     <Util.Row gap={1} align="center">
                //       <Util.Col justify="between" gap={1}>
                //         {/* Prevent line break at all */}
                //         <span
                //           style={{
                //             whiteSpace: "nowrap",
                //             overflow: "hidden",
                //             textOverflow: "ellipsis",
                //           }}
                //         >
                //           <Icon i="sum" size={14} />
                //           {_.itemsCount}
                //         </span>
                //         {_.itemsCount === 0 ? (
                //           <PieProgressChart
                //             complete={0}
                //             inProgress={0}
                //             notStarted={0}
                //             exclude={1}
                //           />
                //         ) : (
                //           <PieProgressChart
                //             complete={d.completedCount / _.itemsCount}
                //             inProgress={d.inProgressCount / _.itemsCount}
                //             notStarted={d.notStartedCount / _.itemsCount}
                //             exclude={d.excludedCount / _.itemsCount}
                //           />
                //         )}
                //         <div className="sos-600">
                //           <span className="text-success">{d.completedCount}</span>
                //           <span className="text-yellow">{d.inProgressCount}</span>
                //           <span className="text-danger">{d.notStartedCount}</span>
                //           <span className="text-gray-400">{d.excludedCount}</span>
                //         </div>
                //       </Util.Col>
                //       <div style={{ fontSize: 10 }} className="hos-600">
                //         <span className="text-success">
                //           <Icon i="circle-check" size={10} /> {d.completedCount} /{" "}
                //           {_.itemsCount}
                //           <span className="hos-900"> Completed</span>
                //         </span>
                //         <br />
                //         <span className="text-yellow">
                //           <Icon i="progress" size={10} /> {d.inProgressCount} /{" "}
                //           {_.itemsCount}
                //           <span className="hos-900"> In Progress</span>
                //         </span>
                //         <br />
                //         <span className="text-danger">
                //           <Icon i="minus" size={10} /> {d.notStartedCount} /{" "}
                //           {_.itemsCount}
                //           <span className="hos-900"> Not Started</span>
                //         </span>
                //         <br />
                //         <span className="text-gray-400">
                //           <Icon i="x" size={10} /> {d.excludedCount} /{" "}
                //           {_.itemsCount}
                //           <span className="hos-900"> Excluded</span>
                //         </span>
                //       </div>
                //     </Util.Row>
                //   ),
                // },
                {
                  label: "Progress",
                  accessor: "progress",
                  render: (d, _) => (
                    <Util.Row gap={1} align="center">
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
                  label: "Finalized",
                  accessor: "finalized",
                  render: (d) =>
                    d ? (
                      <Badge color="green" soft>
                        Yes
                      </Badge>
                    ) : (
                      <Badge color="red" soft>
                        No
                      </Badge>
                    ),
                  sortable: true,
                },
                {
                  label: "Finalized At",
                  accessor: "finalizedAt",
                  render: (d) => <>{d ? moment(d).format("MM/DD/YY") : "N/A"}</>,
                  sortable: true,
                },
                {
                  label: "Due Date",
                  accessor: "dueDate",
                  render: (d, context) => (
                    <>
                      {moment(d).format("MM/DD/YY")} ({moment(d).fromNow()}){" "}
                      {/* Overdue warning */}
                      {new Date(d) < new Date() &&
                        !(
                          new Date(d).toDateString() === new Date().toDateString()
                        ) &&
                        !context.finalized && <Badge color="red">Overdue</Badge>}
                      {/* Today warning */}{" "}
                      {new Date(d).toDateString() ===
                        new Date().toDateString() && (
                        <Badge color="yellow">Due Today</Badge>
                      )}
                    </>
                  ),
                  sortable: true,
                },
                {
                  label: "Created At",
                  accessor: "createdAt",
                  render: (d) => (
                    <>
                      {moment(d).format("MM/DD/YY")} ({moment(d).fromNow()})
                    </>
                  ),
                },
              ].filter((c) => columnsToShow.includes(c.label))}
              data={filteredJobs}
            />
            <Util.Spacer size={1} />
            <i className="text-secondary">
              * Total cost is an estimate reflecting the current state of the job.
              Because the job is not finalized, the cost may change as the job
              progresses.
            </i>
          </>
        )}
        {ModalElement}
      </Page>
    );
  } else {
    return (
      <div>
        <CreateSimpleSubPage/>
      </div>
    );
  }
};
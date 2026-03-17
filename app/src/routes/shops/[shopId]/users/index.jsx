import React, { useState, useMemo } from "react";
import { Page } from "#page";
import { shopSidenavItems } from "..";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "#useAuth";
import { useShop, useUser } from "#hooks";
import { Loading } from "#loading";
import { Typography, Util, Badge, Button, DropdownInput } from "tabler-react-2";
import { Table } from "#table";
import moment from "moment";
import { Price } from "#renderPrice";
import { Icon } from "#icon";
import { PieProgressChart } from "../../../../components/piechart/PieProgressChart";
import { NotFound } from "../../../../components/404/404";
import { Avatar } from "#avatar";
import { SearchBar } from "../../../../components/searchBar/SearchBar";
const { H1 } = Typography;

const switchAccountTypeForBadge = (type) => {
  switch (type) {
    case "ADMIN":
      return (
        <Badge color="orange" soft>
          Admin
        </Badge>
      );
    case "OPERATOR":
      return (
        <Badge color="yellow" soft>
          Operator
        </Badge>
      );
    case "GROUP_ADMIN":
      return (
        <Badge color="pink" soft>
          Group Admin
        </Badge>
      );
    default:
      return (
        <Badge color="blue" soft>
          Customer
        </Badge>
      );
  }
};

export const ShopUsersPage = () => {
  const { shopId } = useParams();
  const { user } = useAuth();
  const { userShop, loading, users } = useShop(shopId, {
    includeUsers: true,
  });
  const { user: activeUser } = useUser(user?.id);



  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });



  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(
      (u) =>
        JSON.stringify(u).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);


  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };
  const sortedUsers = useMemo(() => {
    if (!filteredUsers) return [];
    if (!sortConfig.key) return filteredUsers;

    const sorted = [...filteredUsers].sort((a, b) => {
      let aVal;
      let bVal;

      switch (sortConfig.key) { //these are within a key value pair 
        case "balance":
          aVal = a.user?.balance;
          bVal = b.user?.balance;
          break;
        case "totalJobs":
          aVal = a.user?.totalJobs;
          bVal = b.user?.totalJobs;
          break;
        case "shopMemberSince":
          aVal = a.createdAt;
          bVal = b.createdAt;
          break;
        default:
          aVal = a[sortConfig.key];
          bVal = b[sortConfig.key];
      }

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // date
      if (sortConfig.key === "shopMemberSince") {
        const aTime = new Date(aVal).getTime();
        const bTime = new Date(bVal).getTime();
        return sortConfig.direction === "asc"
          ? aTime - bTime
          : bTime - aTime;
      }

      // number
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc"
          ? aVal - bVal
          : bVal - aVal;
      }

      // string fallback
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return sorted;
  }, [filteredUsers, sortConfig]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return sortedUsers.slice(start, end);
  }, [sortedUsers, currentPage, rowsPerPage]);

  const totalPages = Math.ceil((filteredUsers?.length || 0) / rowsPerPage);

  if (loading)
    return (
      <Page
        sidenavItems={shopSidenavItems(
          "Users",
          shopId,
          user.admin,
          userShop.accountType,
          userShop.balance < 0
        )}
      >
        <Loading />
      </Page>
    );

  if (activeUser?.simple === true) return <NotFound />;


  const renderSortableHeader = (label, key) => (
    <span
      onClick={() => handleSort(key)}
      style={{ cursor: "pointer", userSelect: "none" }}
    >
      {label}{" "}
      {sortConfig.key === key ? (
        sortConfig.direction === "asc" ? (
          <span>▲</span>
        ) : (
          <span>▼</span>
        )
      ) : (
        ""
      )}
    </span>
  );

  return (
    <Page
      sidenavItems={shopSidenavItems(
        "Users",
        shopId,
        user.admin,
        userShop.accountType,
        userShop.balance < 0
      )}
    >
      <H1>Shop Users</H1>
      <Util.Spacer size={2} />
      <SearchBar
        onSearch={(value) => {
          setSearchTerm(value);
          setCurrentPage(1);
        }}
      />

      <Util.Spacer size={2} />
      <Table
        columns={[
          {
            label: "Name",
            accessor: "user.name",
            render: (name, context) => (
              <Util.Row gap={0.5} align="center">
                <Avatar size="sm" dicebear initials={context.user.id} />
                <Util.Col align="start">
                  <Link to={`/shops/${shopId}/users/${context.user.id}`}>
                    {name}
                  </Link>
                  {context.user.id === user.id && (
                    <Badge color="green" soft>
                      You
                    </Badge>
                  )}
                </Util.Col>
              </Util.Row>
            ),
          },
          {
            label: renderSortableHeader("Balance", "balance"),
            accessor: "user.balance",
            render: (balance) => <Price value={balance} icon />,
          },
          {
            label: renderSortableHeader("Total Jobs", "totalJobs"),
            accessor: "user.totalJobs",
          },
          {
            label: "Jobs",
            accessor: "user.jobCounts",
            render: (counts, _) => (
              <Util.Row gap={1} align="center" data-dash={JSON.stringify(_)}>
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
                    {_.user.totalJobs}
                  </span>
                  {_.user.totalJobs === 0 ? (
                    <PieProgressChart
                      complete={0}
                      inProgress={0}
                      notStarted={0}
                      exclude={1}
                    />
                  ) : (
                    <PieProgressChart
                      complete={counts.completedCount / _.user.totalJobs}
                      inProgress={counts.inProgressCount / _.user.totalJobs}
                      notStarted={counts.notStartedCount / _.user.totalJobs}
                      exclude={counts.excludedCount / _.user.totalJobs}
                    />
                  )}
                  <div className="sos-600">
                    <span className="text-success">
                      {counts.completedCount}
                    </span>
                    <span className="text-yellow">
                      {counts.inProgressCount}
                    </span>
                    <span className="text-danger">
                      {counts.notStartedCount}
                    </span>
                    <span className="text-gray-400">
                      {counts.excludedCount}
                    </span>
                  </div>
                </Util.Col>
                <div style={{ fontSize: 10 }} className="hos-600">
                  <span className="text-success">
                    <Icon i="circle-check" size={10} /> {counts.completedCount}{" "}
                    / {_.user.totalJobs}
                    <span className="hos-900"> Completed</span>
                  </span>
                  <br />
                  <span className="text-yellow">
                    <Icon i="progress" size={10} /> {counts.inProgressCount} /{" "}
                    {_.user.totalJobs}
                    <span className="hos-900"> In Progress</span>
                  </span>
                  <br />
                  <span className="text-danger">
                    <Icon i="minus" size={10} /> {counts.notStartedCount} /{" "}
                    {_.user.totalJobs}
                    <span className="hos-900"> Not Started</span>
                  </span>
                  <br />
                  <span className="text-gray-400">
                    <Icon i="x" size={10} /> {counts.excludedCount} /{" "}
                    {_.user.totalJobs}
                    <span className="hos-900"> Excluded</span>
                  </span>
                </div>
              </Util.Row>
            ),
          },
          {
            label: "Account Type",
            accessor: "accountType",
            render: (type) => switchAccountTypeForBadge(type),
          },
          {
            label: renderSortableHeader("Shop Member Since", "shopMemberSince"),
            accessor: "createdAt",
            render: (createdAt) => moment(createdAt).format("MM/DD/YY"),
          },
        ]}
        data={paginatedUsers}
      />

      <Util.Row
        justify="center"
        align="center"
        gap={1}
        style={{ marginTop: "1rem" }}
      >
        <Button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
        >
          Previous
        </Button>
        <span>
          Page {currentPage} of {totalPages || 1}
        </span>
        <Button
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() =>
            setCurrentPage((p) => Math.min(p + 1, totalPages))
          }
        >
          Next
        </Button>

        <DropdownInput
          value={rowsPerPage}
          onChange={(item) => {
            setRowsPerPage(Number(item.id));
            setCurrentPage(1);
          }}
          items={[
            { id: 5, label: "5 per page" },
            { id: 25, label: "25 per page" },
            { id: 50, label: "50 per page" },
            { id: 100, label: "100 per page" },
          ]}
          prompt="Rows per page"
          showSearch={false}
          style={{ marginLeft: "1rem" }}
        />
      </Util.Row>
    </Page>
  );
};

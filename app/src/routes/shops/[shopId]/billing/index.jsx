import React from "react";
import { Page } from "../../../../components/page/page";
import { shopSidenavItems } from "..";
import { Link, useParams } from "react-router-dom";
import { useAuth, useShop } from "../../../../hooks";
import { useLedger } from "../../../../hooks/useLedger";
import { Loading } from "../../../../components/loading/Loading";
import { Card, Typography, Util } from "tabler-react-2";
import { Table } from "tabler-react-2/dist/table";
import Badge from "tabler-react-2/dist/badge";
import { Price } from "../../../../components/price/RenderPrice";
import moment from "moment";
import { downloadFile } from "../../../../components/jobitem/JobItem";
import { Alert } from "tabler-react-2/dist/alert";
const { H1 } = Typography;

/*
enum LedgerItemType {
  INITIAL
  JOB
  AUTOMATED_TOPUP
  AUTOMATED_DEPOSIT
  MANUAL_TOPUP
  MANUAL_DEPOSIT
  FUNDS_PURCHASED
  REFUND
}
*/

const switchTypeForBadge = (type) => {
  switch (type) {
    case "INITIAL":
      return (
        <Badge color="green" soft>
          Starting Account Balance
        </Badge>
      );
    case "JOB":
      return (
        <Badge color="red" soft>
          Job
        </Badge>
      );
    case "AUTOMATED_TOPUP":
      return (
        <Badge color="green" soft>
          Automated Topup
        </Badge>
      );
    case "AUTOMATED_DEPOSIT":
      return (
        <Badge color="green" soft>
          Automated Deposit
        </Badge>
      );
    case "MANUAL_TOPUP":
      return (
        <Badge color="green" soft>
          Manual Topup
        </Badge>
      );
    case "MANUAL_DEPOSIT":
      return (
        <Badge color="green" soft>
          Manual Deposit
        </Badge>
      );
    case "FUNDS_PURCHASED":
      return (
        <Badge color="green" soft>
          Funds Purchased
        </Badge>
      );
    case "REFUND":
      return (
        <Badge color="green" soft>
          Refund
        </Badge>
      );
    default:
      return type;
  }
};

export const Billing = () => {
  const { shopId } = useParams();
  const { user } = useAuth();
  const { userShop, shop } = useShop(shopId);
  const { ledger, loading } = useLedger(shopId, user.id);

  if (loading)
    return (
      <Page
        sidenavItems={shopSidenavItems(
          "Billing",
          shopId,
          user.admin,
          userShop.accountType,
          userShop.balance < 0
        )}
      >
        <Loading />
      </Page>
    );

  return (
    <Page
      sidenavItems={shopSidenavItems(
        "Billing",
        shopId,
        user.admin,
        userShop.accountType,
        userShop.balance < 0
      )}
    >
      <Util.Responsive threshold={800} justify="between" gap={1}>
        <div style={{ flex: 1 }}>
          <H1>Billing</H1>
          <p>
            This is your billing history. It includes all transactions between
            you and {shop.name}.
          </p>
        </div>
        <Card title="Balance" style={{ flex: 1 }}>
          Current balance:
          <Price value={userShop.balance} icon size={24} />
        </Card>
      </Util.Responsive>
      <Util.Spacer size={1} />
      {userShop.balance < 0 && (
        <Alert variant="danger" title="Your balance is negative">
          Your account balance is negative. Please reach out to {shop.name}{" "}
          {shop.email ? (
            <span>
              at <Link to={"mailto:" + shop.email}>{shop.email}</Link>
            </span>
          ) : (
            ""
          )}{" "}
          to resolve this issue.
        </Alert>
      )}
      <Util.Spacer size={1} />
      <Table
        columns={[
          {
            label: "Date",
            accessor: "createdAt",
            render: (date) => moment(date).format("MM/DD/YY h:mm a"),
            sortable: true,
          },
          {
            label: "Amount",
            accessor: "value",
            render: (amount) => <Price value={amount} icon />,
            sortable: true,
          },
          {
            label: "Job",
            accessor: "job",
            render: (job, context) => (
              <>
                {job ? (
                  <Link to={`/shops/${shopId}/jobs/${context.jobId}`}>
                    {job.title}
                  </Link>
                ) : (
                  "N/A"
                )}
              </>
            ),
          },
          {
            label: "Invoice",
            accessor: "invoiceUrl",
            render: (url, context) =>
              url ? (
                <Link
                  onClick={() =>
                    downloadFile(url, `invoice-${context.jobId}.pdf`)
                  }
                >
                  Download
                </Link>
              ) : (
                "N/A"
              ),
          },
          {
            label: "Type",
            accessor: "type",
            render: (type) => <>{switchTypeForBadge(type)}</>,
            sortable: true,
          },
        ]}
        data={ledger}
      />
      <Util.Spacer size={1} />
      <Util.Row justify="end">
        Total balance: <Price value={userShop.balance} icon size={18} />
      </Util.Row>
    </Page>
  );
};

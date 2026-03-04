import React from "react";
import { useParams } from "react-router-dom";
import { Typography, Util } from "tabler-react-2";
import { Button } from "#button";
import { Table } from "#table";
import { Icon } from "#icon";
import { Loading } from "#loading";
import { Page } from "#page";
import { NotFound } from "#notFound";
import { Price } from "#renderPrice";
import { useAuth, useShop, useShopLedger, useUser } from "#hooks";
import { shopSidenavItems } from "..";

const { H1 } = Typography;

const csvEscape = (value) => {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const downloadCsv = (rows, shopId) => {
  const csv = [
    "Payer,Value",
    ...rows.map((row) => `${csvEscape(row.payer)},${Number(row.value).toFixed(2)}`),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateString = new Date().toISOString().slice(0, 10);
  link.href = href;
  link.download = `ledger-${shopId}-${dateString}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
};

export const ShopLedgerPage = () => {
  const { shopId } = useParams();
  const { user } = useAuth();
  const { user: activeUser } = useUser(user?.id);
  const { userShop, shop, loading: shopLoading } = useShop(shopId);

  const userIsStaff =
    user?.admin ||
    userShop?.accountType === "ADMIN" ||
    userShop?.accountType === "OPERATOR";
  const {
    rows: debtRows,
    loading: ledgerLoading,
    opLoading,
    refetch,
    rectify,
  } = useShopLedger(shopId, {
    enabled: userIsStaff,
  });

  if (shopLoading || (userIsStaff && ledgerLoading)) {
    return (
      <Page
        sidenavItems={shopSidenavItems(
          "Ledger",
          shopId,
          user?.admin,
          userShop?.accountType,
          userShop?.balance < 0
        )}
      >
        <Loading />
      </Page>
    );
  }

  if (!shop || activeUser?.simple === true || !userIsStaff) return <NotFound />;

  return (
    <Page
      sidenavItems={shopSidenavItems(
        "Ledger",
        shopId,
        user?.admin,
        userShop?.accountType,
        userShop?.balance < 0
      )}
    >
      <Util.Row justify="between" align="center">
        <Util.Col gap={0.5}>
          <H1>Ledger</H1>
          <p>
            This shows everyone who currently owes {shop.name} money (debts and
            manually posted User Purchased ledger items), including individual
            users and billing groups.
          </p>
        </Util.Col>
        <Button
          onClick={() => downloadCsv(debtRows, shopId)}
          disabled={debtRows.length === 0}
        >
          <Icon i="download" size={16} />
          Download CSV
        </Button>
      </Util.Row>
      <Util.Spacer size={1} />
      {debtRows.length === 0 ? (
        <i>No users or billing groups currently owe money.</i>
      ) : (
        <Table
          columns={[
            {
              label: "Payer",
              accessor: "payer",
              sortable: true,
            },
            {
              label: "Value",
              accessor: "value",
              render: (value) => <Price value={value} icon />,
              sortable: true,
            },
            {
              label: "Actions",
              accessor: "targetId",
              render: (_, context) => (
                <Button
                  size="sm"
                  loading={opLoading}
                  onClick={async () => {
                    if (
                      !window.confirm(
                        `Mark ${context.payer} as paid/rectified?`
                      )
                    ) {
                      return;
                    }
                    const success = await rectify({
                      targetType: context.targetType,
                      targetId: context.targetId,
                    });
                    if (success) {
                      await refetch(false);
                    }
                  }}
                >
                  Mark as paid/rectified
                </Button>
              ),
            },
          ]}
          data={debtRows}
        />
      )}
    </Page>
  );
};

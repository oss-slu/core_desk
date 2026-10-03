import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Input, Typography, Util } from "tabler-react-2";
import { Button } from "#button";
import { Table } from "#table";
import { Icon } from "#icon";
import { Loading } from "#loading";
import { Page } from "#page";
import { NotFound } from "#notFound";
import { Price } from "#renderPrice";
import { useAuth, useShop, useShopLedger } from "#hooks";
import { authFetch } from "#url";
import toast from "react-hot-toast";
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
    ...rows.map(
      (row) => `${csvEscape(row.payer)},${Number(row.value).toFixed(2)}`,
    ),
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
  const { userShop, shop, loading: shopLoading } = useShop(shopId);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [excelLoading, setExcelLoading] = useState(false);

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

  const isDateRangeValid = Boolean(
    startDate &&
    endDate &&
    new Date(startDate) <= new Date(endDate)
  );

  const handleExportExcel = async () => {
    if (!startDate || !endDate) {
      toast.error("Please provide both a start date and an end date.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date must be before or equal to end date.");
      return;
    }

    try {
      setExcelLoading(true);
      const res = await authFetch(
        `/api/shop/${shopId}/ledger/excel?startDate=${encodeURIComponent(
          startDate
        )}&endDate=${encodeURIComponent(endDate)}`
      );

      if (!res.ok) {
        let errMsg = "Failed to generate Excel export";
        try {
          const errData = await res.json();
          if (errData?.error) errMsg = errData.error;
        } catch (jsonErr) {
          console.error("Failed to parse error response JSON:", jsonErr);
        }
        toast.error(errMsg);
        return;
      }

      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = `billing-export-${shopId}-${startDate}-to-${endDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(href), 1000);
      toast.success("Excel export downloaded successfully.");
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while exporting to Excel.");
    } finally {
      setExcelLoading(false);
    }
  };

  if (shopLoading || (userIsStaff && ledgerLoading)) {
    return (
      <Page
        sidenavItems={shopSidenavItems(
          "Ledger",
          shopId,
          user?.admin,
          userShop?.accountType,
          userShop?.balance < 0,
        )}
      >
        <Loading />
      </Page>
    );
  }

  if (!shop || !userIsStaff) return <NotFound />;

  return (
    <Page
      sidenavItems={shopSidenavItems(
        "Ledger",
        shopId,
        user?.admin,
        userShop?.accountType,
        userShop?.balance < 0,
      )}
    >
      <Util.Col gap={0.5}>
        <H1 title="ledger? i hardly know 'er">Ledger</H1>
        <p>
          This shows everyone who currently owes {shop.name} money (debts and
          manually posted User Purchased ledger items), including individual
          users and billing groups.
        </p>
      </Util.Col>
      <Util.Spacer size={1} />
      <Util.Row gap={1} align="center" wrap="wrap">
        <div style={{ minWidth: 160 }}>
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(val) => setStartDate(val)}
          />
        </div>
        <div style={{ minWidth: 160 }}>
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(val) => setEndDate(val)}
          />
        </div>
      </Util.Row>
      <Util.Spacer size={1} />
      <Util.Row gap={1} align="center" wrap="wrap">
        <Button
          onClick={handleExportExcel}
          disabled={!isDateRangeValid || excelLoading}
          loading={excelLoading}
        >
          <Icon i="file-spreadsheet" size={16} />
          Export to Excel
        </Button>
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
                        `Mark ${context.payer} as paid/rectified?`,
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

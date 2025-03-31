import React from "react";
import { Page } from "../../../../components/page/page";
import { shopSidenavItems } from "..";
import { Link, useParams } from "react-router-dom";
import { useAuth, useShop } from "../../../../hooks";
import { useLedger } from "../../../../hooks/useLedger";
import { Loading } from "../../../../components/loading/Loading";
import { Card, Typography, Util } from "tabler-react-2";
import { Price } from "../../../../components/price/RenderPrice";
import { Alert } from "#alert";
import { LedgerTable } from "../../../../components/ledger/LedgerTable";
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
      <LedgerTable data={ledger} shopId={shopId} />
      <Util.Spacer size={1} />
      <Util.Row justify="end">
        Total balance: <Price value={userShop.balance} icon size={18} />
      </Util.Row>
    </Page>
  );
};

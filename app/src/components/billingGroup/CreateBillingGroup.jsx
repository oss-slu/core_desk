import React, { useState } from "react";
import { Input, Button, Util, Switch } from "tabler-react-2";
import { ShopUserPicker } from "#shopUserPicker";

export const CreateBillingGroup = ({
  userShop,
  user,
  createBillingGroup,
  opLoading,
}) => {
  const [data, setData] = useState({
    title: "",
    adminUserId: "",
    assignAdminToSelf: true,
  });

  const userIsPrivileged =
    user.admin ||
    userShop.accountType === "ADMIN" ||
    userShop.accountType === "OPERATOR";

  return (
    <div>
      <Input
        label="Title"
        placeholder="e.g. MENG 3200 Project, Simpson's lab"
        value={data.title}
        onChange={(e) => setData({ ...data, title: e })}
      />

      {userIsPrivileged && (
        <>
          <Switch
            label="Auto-assign self as admin"
            value={data.assignAdminToSelf}
            onChange={(assignAdminToSelf) =>
              setData({ ...data, assignAdminToSelf })
            }
          />
          {!data.assignAdminToSelf && (
            <>
              <label className="form-label">Admin User</label>
              <ShopUserPicker
                label="asdf"
                shopId={userShop.shopId}
                value={data.adminUserId}
                onChange={(adminUserId) => setData({ ...data, adminUserId })}
              />
            </>
          )}
        </>
      )}

      <Util.Spacer size={2} />

      <Button loading={opLoading} onClick={() => createBillingGroup(data)}>
        Create Billing Group
      </Button>
    </div>
  );
};

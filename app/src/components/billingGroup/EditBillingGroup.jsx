import React, { useEffect, useState } from "react";
import { Input, Util, Button, Typography, Switch } from "tabler-react-2";
import { flatten } from "../../util/flatten";
import { MarkdownEditor } from "../markdown/MarkdownEditor";
import { JobsTable } from "./JobsTable";
const { H2 } = Typography;

export const EditBillingGroup = ({
  billingGroup,
  opLoading,
  updateBillingGroup,
  onFinish,
}) => {
  const [newBillingGroup, setNewBillingGroup] = useState(flatten(billingGroup));
  useEffect(() => {
    setNewBillingGroup(flatten(billingGroup));
  }, [billingGroup]);

  return (
    <>
      <Input
        label="Billing Group Title"
        placeholder="Title"
        value={newBillingGroup.title}
        onChange={(e) => setNewBillingGroup({ ...newBillingGroup, title: e })}
      />
      <label className="form-label">Description</label>
      <MarkdownEditor
        value={newBillingGroup.description}
        onChange={(value) =>
          setNewBillingGroup({ ...newBillingGroup, description: value })
        }
      />
      <Util.Spacer size={2} />
      <H2>Jobs</H2>
      <Switch
        value={newBillingGroup.membersCanCreateJobs}
        onChange={(e) => {
          setNewBillingGroup({
            ...newBillingGroup,
            membersCanCreateJobs: e,
          });
        }}
        label="Allow members to create new jobs"
      />
      <JobsTable />
      <Util.Spacer size={2} />
      <Button
        onClick={async () => {
          await updateBillingGroup(newBillingGroup);
          onFinish();
        }}
        loading={opLoading}
        variant="primary"
      >
        Update Billing Group
      </Button>
    </>
  );
};

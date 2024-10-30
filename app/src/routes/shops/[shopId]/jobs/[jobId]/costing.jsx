import React from "react";
import { Page } from "../../../../../components/page/page";
import { sidenavItems } from ".";
import { Link, useParams } from "react-router-dom";
import { useJob, useJobItem } from "../../../../../hooks";
import { Loading } from "../../../../../components/loading/Loading";
import { Card, Typography, Util } from "tabler-react-2";
import { ProjectWideEditCosting } from "../../../../../components/jobitem/ProjectWideEditCosting";
import { EditCosting } from "../../../../../components/jobitem/EditCosting";
const { H1, H2 } = Typography;
import styles from "./costing.module.css";
import { Price } from "../../../../../components/price/RenderPrice";
import { calculateTotalCostOfJob } from "../../../../../util/totalCost";
import { Spinner } from "tabler-react-2/dist/spinner";
import { Button } from "tabler-react-2/dist/button";
import { useConfirm } from "tabler-react-2/dist/modal/confirm";
import { Alert } from "tabler-react-2/dist/alert";
import { Icon } from "../../../../../util/Icon";
import { downloadFile } from "../../../../../components/jobitem/JobItem";

export const JobCostingPage = () => {
  const { shopId, jobId } = useParams();
  const {
    loading: jobLoading,
    job,
    refetch: refetchJob,
    updateJob,
    opLoading,
    ConfirmModal,
  } = useJob(shopId, jobId);

  const { confirm, ConfirmModal: ConfirmFinalizeModal } = useConfirm({
    title: "Finalize job",
    text: "Are you sure you want to finalize this job? The customer will immediately be charged for the job. You can still modify the job in the future, but you cannot re-charge the customer.",
    commitText: "Finalize",
    cancelText: "Cancel",
  });

  if (jobLoading)
    return (
      <Page sidenavItems={sidenavItems("costing", shopId, jobId)}>
        <Loading />
      </Page>
    );

  return (
    <Page sidenavItems={sidenavItems("costing", shopId, jobId)}>
      {ConfirmModal} {ConfirmFinalizeModal}
      {job.finalized && (
        <Alert
          variant="danger"
          title="Job finalized"
          icon={<Icon i="alert-triangle" />}
        >
          This job has already been finalized. You can still update it, but you
          cannot re-charge the customer.
        </Alert>
      )}
      <Util.Responsive threshold={500} gap={1}>
        <H1 style={{ flex: 1 }}>{job.title}</H1>
        <Card title="Total job cost" style={{ flex: 1 }}>
          <Util.Row justify="between" align="center">
            {opLoading ? (
              <Spinner />
            ) : (
              <Price value={calculateTotalCostOfJob(job)} icon />
            )}
            {!job.finalized && (
              <Button
                color="primary"
                onClick={async () => {
                  const result = await confirm();
                  if (result) updateJob({ finalized: true });
                }}
              >
                Finalize job
              </Button>
            )}
          </Util.Row>
          {job.finalized && (
            <>
              <Link
                onClick={() =>
                  downloadFile(
                    job.ledgerItems[0].invoiceUrl,
                    `invoice-${jobId}.pdf`
                  )
                }
              >
                <Icon i="download" /> Download invoice
              </Link>
            </>
          )}
        </Card>
      </Util.Responsive>
      <Util.Spacer size={2} />
      <Util.Responsive threshold={1200} gap={1}>
        <div className={styles.section}>
          <ProjectWideEditCosting
            job={job}
            loading={jobLoading}
            updateJob={updateJob}
          />
        </div>
        <div className={styles.section}>
          <H2>Item-based costing</H2>
          {job.items?.map((item) => {
            if (!item) return null;
            if (!item.resourceTypeId) return null;
            if (!item.resourceId) return null;
            if (!item.material) return null;
            return (
              <ItemCostCard key={item.id} item={item} refetchJob={refetchJob} />
            );
          })}
        </div>
      </Util.Responsive>
    </Page>
  );
};

const ItemCostCard = ({ item, refetchJob }) => {
  const { shopId } = useParams();
  const { updateJobItem, loading, opLoading } = useJobItem(
    shopId,
    item.jobId,
    item.id,
    {
      initialValue: item,
      shouldFetchJobItem: true,
    }
  );

  return (
    <>
      <Card key={item.id} title={item.fileName}>
        <EditCosting
          key={item.id}
          item={item}
          readOnly
          onChange={async (v) => {
            await updateJobItem(v);
            refetchJob(false);
          }}
          loading={opLoading}
        />
      </Card>
      <Util.Spacer size={1} />
    </>
  );
};

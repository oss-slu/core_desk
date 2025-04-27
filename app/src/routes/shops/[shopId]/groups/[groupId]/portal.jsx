import React, { useState } from "react";
import { Card, Typography, Util } from "tabler-react-2";
import { useBillingGroup, useJob, useShop } from "#hooks";
import { useParams } from "react-router-dom";
import { Loading } from "#loading";
import { MarkdownRender } from "#markdownRender";
import styles from "./portal.module.css";
import { JobPicker } from "../../../../../components/jobPicker/JobPicker";
import { UploadDropzone } from "../../../../../components/upload/uploader";
import { MicroJobItem } from "../../../../../components/jobitem/MicroJobItem";

export const BillingGroupPortal = () => {
  const { shopId, groupId } = useParams();
  const { loading, billingGroup } = useBillingGroup(shopId, groupId);
  const { shop, loading: shopLoading } = useShop(shopId);

  const [jobId, setJobId] = useState(null);
  const { job, loading: jobLoading, refetch } = useJob(shopId, jobId);

  if (loading || shopLoading) return <Loading />;

  return (
    <Util.Responsive threshold={800} gap={2}>
      <div className={styles.box}>
        <Card className={styles.card}>
          <Typography.H1>{billingGroup.title}</Typography.H1>
          {/* {JSON.stringify(job)} */}
          <p>
            Welcome to the group portal for {billingGroup.title}. Here you can
            upload your files to to your group and it will be fulfilled by{" "}
            {shop.name} and be billed to your group.
          </p>
          <p>
            This portal has extremely basic functionality. If you need more
            advanced functionality, contact your group administrator.
          </p>
          <Typography.H2>Pick a job</Typography.H2>
          <p>
            SLU Open Project uses jobs to organize work. You should pick the job
            that is most relevant to your request or as instructed by your group
            administrator.
          </p>
          <JobPicker
            value={jobId}
            onChange={setJobId}
            opLoading={false}
            groupId={groupId}
            showLabel={false}
          />
          <Util.Spacer size={2} />
          {jobId && (
            <>
              <Typography.H2>Files</Typography.H2>
              <UploadDropzone
                scope="group.fileUpload"
                metadata={{ jobId, shopId, groupId }}
                onUploadComplete={() => {
                  setTimeout(() => {
                    refetch(false);
                  }, 1000);
                }}
                dropzoneAppearance={{
                  container: {
                    height: 130,
                    padding: 10,
                  },
                  uploadIcon: {
                    display: "none",
                  },
                  label: {
                    margin: 0,
                    marginTop: 0,
                    padding: 0,
                    paddingTop: 0,
                  },
                  button: {
                    marginTop: 10,
                    backgroundColor: "var(--tblr-primary)",
                  },
                }}
              />
              <Util.Spacer size={2} />
              <Typography.H3>Your Files</Typography.H3>
              <p>Here are the files you have uploaded to this job.</p>
              {jobLoading ? (
                <Loading />
              ) : (
                <>
                  {job.items?.length === 0 && (
                    <i>You have not uploaded any files to this job yet.</i>
                  )}
                  <Util.Col gap={1}>
                    {job.items?.map((item) => (
                      <MicroJobItem key={item.id} item={item} />
                    ))}
                  </Util.Col>
                </>
              )}
            </>
          )}
        </Card>
      </div>
      <div style={{ flex: 1, opacity: 0.8 }}>
        <MarkdownRender markdown={billingGroup.description} />
      </div>
    </Util.Responsive>
  );
};

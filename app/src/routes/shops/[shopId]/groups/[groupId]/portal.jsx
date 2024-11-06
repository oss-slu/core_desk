import React, { useState } from "react";
import { Card, Typography, Util } from "tabler-react-2";
import { useBillingGroup, useShop } from "../../../../../hooks";
import { useParams } from "react-router-dom";
import { Loading } from "../../../../../components/loading/Loading";
import { MarkdownRender } from "../../../../../components/markdown/MarkdownRender";
import styles from "./portal.module.css";
import { JobPicker } from "../../../../../components/jobPicker/JobPicker";
import { UploadDropzone } from "../../../../../components/upload/uploader";

export const BillingGroupPortal = () => {
  const { shopId, groupId } = useParams();
  const { loading, billingGroup } = useBillingGroup(shopId, groupId);
  const { shop, loading: shopLoading } = useShop(shopId);

  const [jobId, setJobId] = useState(null);

  if (loading || shopLoading) return <Loading />;

  return (
    <Util.Responsive threshold={800} gap={2}>
      <div className={styles.box}>
        <Card className={styles.card}>
          <Typography.H1>{billingGroup.title}</Typography.H1>
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
                onUploadComplete={console.log}
              />
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

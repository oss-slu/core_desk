import React from "react";
import { Page } from "../../../../../components/page/page";
import { Icon } from "../../../../../util/Icon";
import { sidenavItems } from ".";
import { useParams } from "react-router-dom";
import { useJob } from "../../../../../hooks";
import { Loading } from "../../../../../components/loading/Loading";
import { Card, Typography, Util } from "tabler-react-2";
import { ProjectWideEditCosting } from "../../../../../components/jobitem/ProjectWideEditCosting";
import { EditCosting } from "../../../../../components/jobitem/EditCosting";
const { H1, H2, H3 } = Typography;
import styles from "./costing.module.css";

export const JobCostingPage = () => {
  const { shopId, jobId } = useParams();
  const { loading: jobLoading, job } = useJob(shopId, jobId);

  if (jobLoading)
    return (
      <Page sidenavItems={sidenavItems("costing", shopId, jobId)}>
        <Loading />
      </Page>
    );

  return (
    <Page sidenavItems={sidenavItems("costing", shopId, jobId)}>
      <H1>{job.title}</H1>
      <Util.Spacer size={2} />
      <Util.Responsive threshold={1200} gap={1}>
        <div className={styles.section}>
          <ProjectWideEditCosting job={job} loading={jobLoading} />
        </div>
        <div className={styles.section}>
          <H2>Item-based costing</H2>
          {job.items?.map((item) => {
            if (!item) return null;
            if (!item.resourceTypeId) return null;
            if (!item.resourceId) return null;
            if (!item.material) return null;
            return (
              <>
                <Card key={item.id} title={item.fileName}>
                  <EditCosting key={item.id} item={item} readOnly />
                </Card>
                <Util.Spacer size={1} />
              </>
            );
          })}
        </div>
      </Util.Responsive>
    </Page>
  );
};

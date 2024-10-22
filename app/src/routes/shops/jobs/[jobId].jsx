import React from "react";
import { Page } from "../../../components/page/page";
import { Icon } from "../../../util/Icon";
import { useParams } from "react-router-dom";
import { Typography, Util } from "tabler-react-2";
import { useJob } from "../../../hooks/useJob";
import { Loading } from "../../../components/loading/loading";
import { UploadDropzone } from "../../../components/upload/uploader";
import { Table } from "tabler-react-2/dist/table";
import { RenderMedia } from "../../../components/media/renderMedia";
import { JobItem } from "../../../components/jobitem/JobItem";
const { H1, H2 } = Typography;

export const JobPage = () => {
  const { shopId, jobId } = useParams();
  const { job, loading, refetch: refetchJobs } = useJob(shopId, jobId);

  if (loading) return <Loading />;

  return (
    <Page
      sidenavItems={[
        {
          type: "item",
          href: `/shops/${shopId}/jobs`,
          text: `Back to jobs`,
          active: false,
          icon: <Icon i={"arrow-left"} size={18} />,
        },
        {
          type: "item",
          href: `/shops/${shopId}/jobs/${jobId}`,
          text: `Home`,
          active: true,
          icon: <Icon i={"robot"} size={18} />,
        },
      ]}
    >
      <H1>{job.title}</H1>
      <p>{job.description}</p>
      <UploadDropzone
        scope={{
          jobId,
          shopId,
        }}
        onUploadComplete={() => {
          refetchJobs();
        }}
      />
      <Util.Spacer size={1} />
      <H2>Items</H2>
      <Util.Col gap={0.5}>
        {job.items.map((item) => (
          <JobItem key={item.id} item={item} />
        ))}
      </Util.Col>
    </Page>
  );
};

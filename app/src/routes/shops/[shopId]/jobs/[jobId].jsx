import React, { useEffect, useState } from "react";
import { Page } from "../../../../components/page/page";
import { Icon } from "../../../../util/Icon";
import { useParams } from "react-router-dom";
import { Typography, Util, Input } from "tabler-react-2";
import { useJob } from "../../../../hooks/useJob";
import { Loading } from "../../../../components/loading/loading";
import { UploadDropzone } from "../../../../components/upload/uploader";
import { JobItem } from "../../../../components/jobitem/JobItem";
import { Button } from "tabler-react-2/dist/button";
const { H1, H2, H3 } = Typography;
import moment from "moment";
import Badge from "tabler-react-2/dist/badge";
import { NotFound } from "../../../../components/404/404";
import { LoadableDropdownInput } from "../../../../components/loadableDropdown/LoadableDropdown";

export const JobPage = () => {
  const { shopId, jobId } = useParams();
  const {
    job: uncontrolledJob,
    loading,
    refetch: refetchJobs,
    opLoading,
    updateJob,
  } = useJob(shopId, jobId);

  const [editing, setEditing] = useState(false);
  const [job, setJob] = useState(uncontrolledJob);

  useEffect(() => {
    setJob(uncontrolledJob);
  }, [uncontrolledJob]);

  if (loading) return <Loading />;

  if (!job) return <NotFound />;

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
      <Util.Responsive gap={1} align="start" threshold={800}>
        <div style={{ flex: 1, width: "100%" }}>
          <Util.Row justify="between" align="center" gap={1} wrap>
            {editing ? (
              <Input
                value={job.title}
                label="Title"
                onChange={(e) => setJob({ ...job, title: e })}
              />
            ) : (
              <H1>{job.title}</H1>
            )}
            {editing ? (
              <Button
                loading={opLoading}
                onClick={async () => {
                  await updateJob(job);
                  setEditing(false);
                }}
                variant="primary"
              >
                Save
              </Button>
            ) : (
              <Button loading={opLoading} onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}
          </Util.Row>
          {editing ? (
            <>
              <Input
                value={job.description}
                label="Description"
                onChange={(e) => setJob({ ...job, description: e })}
              />
              <Input
                type="date"
                value={job.dueDate.split("T")[0]}
                label="Due Date"
                onChange={(e) =>
                  setJob({
                    ...job,
                    dueDate: new Date(e + "T00:00:00").toISOString(),
                  })
                }
              />
            </>
          ) : (
            <>
              <p>{job.description}</p>
              <H3>Upcoming Deadline</H3>
              <p>
                {moment(job.dueDate).format("MM/DD/YY")} (
                {moment(job.dueDate).fromNow()}) {/* Overdue warning */}
                {new Date(job.dueDate) < new Date() &&
                  !(
                    new Date(job.dueDate).toDateString() ===
                    new Date().toDateString()
                  ) && <Badge color="red">Overdue</Badge>}
                {/* Today warning */}{" "}
                {new Date(job.dueDate).toDateString() ===
                  new Date().toDateString() && (
                  <Badge color="yellow">Due Today</Badge>
                )}
              </p>
              <H3>Status</H3>
              <LoadableDropdownInput
                loading={opLoading}
                prompt={"Select a status"}
                values={[
                  { id: "IN_PROGRESS", label: "In Progress" },
                  { id: "COMPLETED", label: "Completed" },
                  { id: "NOT_STARTED", label: "Not Started" },
                  { id: "CANCELLED", label: "Cancelled" },
                  { id: "WONT_DO", label: "Won't Do" },
                  { id: "WAITING", label: "Waiting" },
                  { id: "WAITING_FOR_PICKUP", label: "Waiting for Pickup" },
                  { id: "WAITING_FOR_PAYMENT", label: "Waiting for Payment" },
                ]}
                value={job.status}
                onChange={(value) => {
                  updateJob({ status: value.id });
                }}
                doTheColorThing={true}
              />
            </>
          )}
        </div>
        <div style={{ flex: 1, width: "100%" }}>
          <UploadDropzone
            scope={"job.fileupload"}
            metadata={{
              jobId,
              shopId,
            }}
            onUploadComplete={() => {
              refetchJobs();
            }}
          />
        </div>
      </Util.Responsive>
      <Util.Spacer size={1} />
      <H2>Items</H2>
      {job.items?.length === 0 ? (
        <i>This job has no items. You can attach files in the dropzone above</i>
      ) : (
        <Util.Col gap={0.5}>
          {job.items?.map((item) => (
            <JobItem key={item.id} item={item} refetchJobs={refetchJobs} />
          ))}
        </Util.Col>
      )}
    </Page>
  );
};

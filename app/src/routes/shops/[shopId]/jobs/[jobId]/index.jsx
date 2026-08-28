import React, { useEffect, useState } from "react";
import { Page } from "#page";
import { Icon } from "#icon";
import { Link, useParams } from "react-router-dom";
import {
  Typography,
  Util,
  Input,
  Button,
  Badge,
} from "tabler-react-2";
import { Loading } from "#loading";
import { UploadDropzone } from "../../../../../components/upload/uploader";
import {
  JobItem,
  switchStatusToUI,
} from "../../../../../components/jobitem/JobItem";
const { H1, H2, H3 } = Typography;
import moment from "moment";
import { NotFound } from "#notFound";
import { LoadableDropdownInput } from "../../../../../components/loadableDropdown/LoadableDropdown";
import { useAuth, useShop, useJob } from "#hooks";
import { ResourceTypePicker } from "../../../../../components/resourceTypePicker/ResourceTypePicker";
import { MaterialPicker } from "../../../../../components/materialPicker/MaterialPicker";
import { ResourcePicker } from "../../../../../components/resourcePicker/ResourcePicker";
import { Comments } from "../../../../../components/comments/Comments";
import { RenderMedia } from "../../../../../components/media/renderMedia";
import { Alert } from "#alert";
import { ShopUserPicker } from "#shopUserPicker";
import { BillingGroupPicker } from "../../../../../components/billingGroupPicker/BillingGroupPicker";
import { useModal } from "#modal";
import { authFetch } from "../../../../../util/url";
import styles from "./index.module.css";
import toast from "react-hot-toast";

export const sidenavItems = (activePage, shopId, jobId) => [
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
    active: activePage === "jobs",
    icon: <Icon i={"robot"} size={18} />,
  },
  {
    type: "item",
    href: `/shops/${shopId}/jobs/${jobId}/costing`,
    text: `Costing`,
    active: activePage === "costing",
    icon: <Icon i={"currency-dollar"} size={18} />,
  },
];

const AddItemModalContent = ({
  noFilePreviewDataUri,
  onCreateItem,
  createItemLoading,
}) => {
  const [itemTitle, setItemTitle] = useState("");

  return (
    <Util.Col gap={0.75} align="start">
      <Util.Col gap={0.25} align="start" style={{ width: "100%" }}>
        <label className="form-label mb-0">Preview</label>
        <RenderMedia mediaUrl={noFilePreviewDataUri} fileType="png" />
      </Util.Col>
      <Input
        label="Item Name"
        value={itemTitle}
        onChange={(value) => setItemTitle(value)}
        placeholder="e.g. Front panel revision A"
        required
      />
      <Button
        onClick={async () => {
          const created = await onCreateItem(itemTitle);
          if (created) setItemTitle("");
        }}
        loading={createItemLoading}
        disabled={createItemLoading}
      >
        Create Item
      </Button>
    </Util.Col>
  );
};

export const JobPage = () => {
  const { shopId, jobId } = useParams();
  const {
    job: uncontrolledJob,
    loading,
    refetch: refetchJobs,
    opLoading,
    updateJob,
    ConfirmModal,
  } = useJob(shopId, jobId);
  const { user: activeUser, loading: userLoading } = useAuth();
  const { userShop, loading: shopLoading } = useShop(shopId);
  const [editing, setEditing] = useState(false);
  const [job, setJob] = useState(uncontrolledJob);

  const [createItemLoading, setCreateItemLoading] = useState(false);

  const userIsPrivileged =
    activeUser.admin ||
    userShop.accountType === "ADMIN" ||
    userShop.accountType === "OPERATOR";

  const noFilePreviewDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="280" viewBox="0 0 700 280">
      <rect width="700" height="280" fill="#f6f8fb" stroke="#dce1e7"/>
      <text x="350" y="145" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" fill="#6c757d">No file uploaded</text>
    </svg>`,
  )}`;

  const handleCreateItem = async (itemTitleValue) => {
    const title = itemTitleValue.trim();
    if (!title) return;

    setCreateItemLoading(true);
    try {
      const r = await authFetch(`/api/shop/${shopId}/job/${jobId}/upload`, {
        method: "POST",
        body: JSON.stringify({ title }),
      });

      if (!r.ok) {
        throw new Error("Failed to create item");
      }

      closeAddItemModal?.();
      await refetchJobs(false);
      toast.success("Item created successfully");
      return true;
    } catch (err) {
      toast.error("Failed to create item");
      console.error(err);
      return false;
    } finally {
      setCreateItemLoading(false);
    }
  };

  const {
    modal: openAddItemModal,
    ModalElement: AddItemModal,
    close: closeAddItemModal,
    update: updateAddItemModal,
  } = useModal({
    title: "Add Item Without File",
    text: (
      <AddItemModalContent
        noFilePreviewDataUri={noFilePreviewDataUri}
        onCreateItem={handleCreateItem}
        createItemLoading={createItemLoading}
      />
    ),
  });

  const handleOpenAddItemModal = () => {
    updateAddItemModal({
      title: "Add Item Without File",
      text: (
        <AddItemModalContent
          noFilePreviewDataUri={noFilePreviewDataUri}
          onCreateItem={handleCreateItem}
          createItemLoading={createItemLoading}
        />
      ),
    });
    openAddItemModal();
  };

  useEffect(() => {
    setJob(uncontrolledJob);
  }, [uncontrolledJob]);

  if (loading || userLoading || shopLoading) return <Loading />;

  if (!job)
    return (
      <Page sidenavItems={sidenavItems("jobs", shopId, jobId)}>
        <NotFound />
      </Page>
    );

  return (
    <Page sidenavItems={sidenavItems("jobs", shopId, jobId)}>
      {ConfirmModal}
      {AddItemModal}
      {job.finalized && (
        <Alert
          variant="danger"
          title="Job finalized"
          icon={<Icon i="alert-triangle" />}
        >
          This job has already been finalized. You can still update it, but
          you cannot re-charge the customer.
        </Alert>
      )}
      <Util.Responsive gap={1} align="start" threshold={800}>
        <div className={styles.pageSection}>
          {editing ? (
            <Input
              value={job.title}
              label="Title"
              onChange={(e) => setJob({ ...job, title: e })}
            />
          ) : (
            <></>
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
            <Util.Row
              align="start"
              className={styles.jobHeader}
              gap={1.5}
              wrap
            >
              <Util.Col gap={1} align="start" className={styles.jobOverview}>
                <H1>{job.title}</H1>
                <p>{job.description}</p>
              </Util.Col>
              <Util.Col gap={0.5} align="start" className={styles.jobMeta}>
                <Util.Row gap={1} align="center" wrap className={styles.statusRow}>
                  <H3 className={styles.statusHeading}>Status</H3>
                  {userIsPrivileged ? (
                    <div className={styles.statusControl}>
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
                          {
                            id: "WAITING_FOR_PICKUP",
                            label: "Waiting for Pickup",
                          },
                          {
                            id: "WAITING_FOR_PAYMENT",
                            label: "Waiting for Payment",
                          },
                        ]}
                        value={job.status}
                        onChange={(value) => {
                          updateJob({ status: value.id });
                        }}
                        doTheColorThing={true}
                      />
                    </div>
                  ) : (
                    <Badge color={switchStatusToUI(job.status)[1]} soft>
                      {switchStatusToUI(job.status)[0]}
                    </Badge>
                  )}
                </Util.Row>
                <Util.Row
                  gap={1}
                  align="end"
                  wrap
                  className={styles.deadlineRow}
                >
                  <H3 className={styles.deadlineHeading}>Upcoming Deadline</H3>
                  <Util.Col gap={0}>
                    <span className={styles.deadlineText}>
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
                    </span>
                    <span className={styles.deadlineText}>
                      Created At:{" "}
                      {job.createdAt
                        ? moment(job.createdAt).format("MM/DD/YY hh:mm a")
                        : "-"}
                    </span>
                  </Util.Col>
                </Util.Row>
              </Util.Col>
              <div className={styles.editAction}>
                <Button
                  loading={opLoading}
                  onClick={() => setEditing(true)}
                >
                  Edit
                </Button>
              </div>
            </Util.Row>
          )}
          <hr />
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
              <H2 style={{ marginTop: -10 }}>Project Defaults</H2>
              <Util.Row gap={1} wrap className={styles.defaultsRow}>
                <div className={styles.pickerField}>
                  <ResourceTypePicker
                    loading={opLoading}
                    value={job.resourceTypeId}
                    onChange={(value) => {
                      updateJob({ resourceTypeId: value });
                    }}
                    shopId={shopId}
                    opLoading={opLoading}
                    includeNone={true}
                  />
                </div>
                {job.resourceTypeId ? (
                  <>
                    <div className={styles.pickerField}>
                      <MaterialPicker
                        value={job.materialId}
                        onChange={(value) => {
                          updateJob({ materialId: value });
                        }}
                        resourceTypeId={job.resourceTypeId}
                        opLoading={opLoading}
                        includeNone={true}
                        materialType={"Primary"}
                      />
                    </div>
                    <div className={styles.pickerField}>
                      <MaterialPicker
                        value={job.secondaryMaterialId}
                        onChange={(value) => {
                          updateJob({ secondaryMaterialId: value });
                        }}
                        resourceTypeId={job.resourceTypeId}
                        opLoading={opLoading}
                        includeNone={true}
                        materialType={"Secondary"}
                      />
                    </div>
                    {userIsPrivileged ? (
                      <div className={styles.pickerField}>
                        <ResourcePicker
                          value={job.resourceId}
                          onChange={(value) => {
                            updateJob({ resourceId: value });
                          }}
                          resourceTypeId={job.resourceTypeId}
                          opLoading={opLoading}
                          includeNone={true}
                        />
                      </div>
                    ) : (
                      <Util.Col className={styles.pickerField}>
                        <label className="form-label">Resource</label>
                        <Badge color="blue" soft>
                          {job.resource?.title || "Not set"}
                        </Badge>
                      </Util.Col>
                    )}
                  </>
                ) : (
                  <i
                    style={{
                      alignSelf: "center",
                    }}
                  >
                    Select a resource type to see more options
                  </i>
                )}
              </Util.Row>
              <hr />
              <H2 style={{ marginTop: -10 }}>Current Billing Account</H2>
              {job.group ? (
                <Link to={`/shops/${shopId}/billing-groups/${job.group.id}`}>
                  {job.group.title}
                </Link>
              ) : (
                <p>
                  {job.user?.firstName} {job.user?.lastName}
                </p>
              )}
              <Util.Spacer size={1} />
              <Util.Row gap={1} wrap align="end" className={styles.billingRow}>
                <Util.Col gap={0} className={styles.pickerField}>
                  <label className="form-label">Requested By</label>
                  {userIsPrivileged ? (
                    <ShopUserPicker
                      value={job.userId}
                      onChange={(value) => {
                        updateJob({ userId: value });
                      }}
                      includeNone={false}
                    />
                  ) : (
                    <p>
                      {job.user?.firstName} {job.user?.lastName}
                    </p>
                  )}
                </Util.Col>
                <Util.Col gap={0} className={styles.pickerField}>
                  <label className="form-label">Billing Group</label>
                  {userIsPrivileged ? (
                    <BillingGroupPicker
                      value={job.groupId}
                      onChange={(value) => {
                        updateJob({ groupId: value });
                      }}
                      includeNone={true}
                    />
                  ) : job.group ? (
                    <Link to={`/shops/${shopId}/billing-groups/${job.group.id}`}>
                      {job.group.title}
                    </Link>
                  ) : (
                    <Badge color="secondary" soft>
                      None
                    </Badge>
                  )}
                </Util.Col>
              </Util.Row>
            </>
          )}
        </div>
      </Util.Responsive>
      <hr />

      <H2 style={{ marginTop: -10 }}> Add Item Without File</H2>
      <Util.Col gap={0.5} align="start">
        <Button style={{ marginTop: 5 }} onClick={handleOpenAddItemModal}>
          Add Item
        </Button>
        <i style={{ marginTop: 5 }}>Create a job item now and attatch a file later</i>
      </Util.Col>

      <hr />
      <H2 style={{ marginTop: -10 }}>Items</H2>
      <UploadDropzone
        scope={"job.fileupload"}
        metadata={{
          jobId,
          shopId,
        }}
        onUploadComplete={() => {
          refetchJobs(false);
        }}
        useNewDropzone={true}
        endpoint={`/api/shop/${shopId}/job/${jobId}/upload`}
      />
      {job.items?.length === 0 ? (
        <i>
          This job has no items. You can attach files in the dropzone above
        </i>
      ) : (
        <div>
          <Util.Col gap={0.5}>
            {job.items?.map((item) => (
              <JobItem
                key={item.id}
                item={item}
                refetchJobs={refetchJobs}
                userIsPrivileged={userIsPrivileged}
                group={job.group}
              />
            ))}
          </Util.Col>
          <hr />
          <div className={styles.commentsSection}>
            <Comments jobId={jobId} shopId={shopId} />
          </div>
        </div>
      )}
    </Page>
  );
};

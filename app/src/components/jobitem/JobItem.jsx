import React, { useState } from "react";
import { Card, Util, Typography, DropdownInput, Input } from "tabler-react-2";
import { RenderMedia } from "../media/renderMedia";
import { Button } from "tabler-react-2/dist/button";
import { Icon } from "../../util/Icon";
import { useModal } from "tabler-react-2/dist/modal";
import { useJobItem } from "../../hooks/useJobItem";
import { Link, useParams } from "react-router-dom";
import { Spinner } from "tabler-react-2/dist/spinner";
const { H3, H4 } = Typography;
import styles from "./jobItem.module.css";
import { LoadableDropdownInput } from "../loadableDropdown/LoadableDropdown";
import { ResourceTypePicker } from "../resourceTypePicker/ResourceTypePicker";
import Badge from "tabler-react-2/dist/badge";
import { MaterialPicker } from "../materialPicker/MaterialPicker";
import { ResourcePicker } from "../resourcePicker/ResourcePicker";
import { Price } from "../price/RenderPrice";
import { Time } from "../time/RenderTime";
import { EditCosting } from "./EditCosting";
import { useAuth, useBillingGroupUser } from "../../hooks";

export function downloadFile(url, filename) {
  fetch(url)
    .then((response) => response.blob())
    .then((blob) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href); // Clean up
    })
    .catch((error) => {
      console.error("Error downloading file:", error);
    });
}

export const switchStatusToUI = (status) => {
  switch (status) {
    case "IN_PROGRESS":
      return ["In Progress", "yellow"];
    case "COMPLETED":
      return ["Completed", "green"];
    case "NOT_STARTED":
      return ["Not Started", "red"];
    case "CANCELLED":
      return ["Cancelled", "secondary"];
    case "WONT_DO":
      return ["Won't Do", "secondary"];
    case "WAITING":
      return ["Waiting", "blue"];
    case "WAITING_FOR_PICKUP":
      return ["Waiting for Pickup", "teal"];
    case "WAITING_FOR_PAYMENT":
      return ["Waiting for Payment", "orange"];
    default:
      return [status, "secondary"];
  }
};

export const JobItem = ({
  item: _item,
  refetchJobs,
  userIsPrivileged,
  group,
}) => {
  const { shopId, jobId } = useParams();

  const { item, opLoading, updateJobItem, deleteJobItem } = useJobItem(
    shopId,
    jobId,
    _item.id,
    {
      initialValue: _item,
      fetchJobItem: false,
    }
  );

  const { modal, ModalElement } = useModal({
    title: item?.title,
    text: (
      <div>
        <RenderMedia big mediaUrl={item?.fileUrl} fileType={item?.fileType} />
      </div>
    ),
  });

  const { user } = useAuth();
  const { billingGroupUser, loading: billingGroupUserLoading } =
    useBillingGroupUser(shopId, group.id, user.id);
  const [localQty, setLocalQty] = useState(item?.qty);

  if (!item) return null;

  return (
    <Card>
      <Util.Responsive gap={1} align="start" threshold={1200}>
        <div className={styles.modal}>{ModalElement}</div>
        <Util.Responsive gap={1} align="start" threshold={800}>
          <RenderMedia
            mediaUrl={item.fileUrl}
            fileType={item.fileType}
            thumbnailUrl={item.fileThumbnailUrl}
          />
          <Util.Row gap={2} align="start" threshold={1100} style={{ flex: 1 }}>
            <div style={{ maxWidth: 280 }}>
              <Util.Row gap={1}>
                <H3 className="mb-0">{item.title}</H3>
                <Util.Row gap={0.5} align="center" style={{ width: 100 }}>
                  Qty
                  <Input
                    size="sm"
                    placeholder="0"
                    value={localQty}
                    noMargin
                    style={{ float: 1 }}
                    onChange={(e) => setLocalQty(e)}
                  />
                  {item.qty !== parseFloat(localQty) && !isNaN(localQty) && (
                    <Button
                      size="sm"
                      onClick={() =>
                        updateJobItem({ qty: parseFloat(localQty) })
                      }
                      loading={opLoading}
                    >
                      Save
                    </Button>
                  )}
                </Util.Row>
              </Util.Row>
              {item.user?.id && (
                <span>
                  <Icon i="user" />
                  <Link to={`/shops/${shopId}/users/${item.user.id}`}>
                    {item.user.firstName} {item.user.lastName}
                  </Link>
                </span>
              )}
              {item.stlBoundingBoxX ? (
                <>
                  <Util.Row gap={1}>
                    <span>
                      <Icon i="cube-3d-sphere" />
                      {item.stlBoundingBoxX.toFixed(2)} x{" "}
                      {item.stlBoundingBoxY.toFixed(2)} x{" "}
                      {item.stlBoundingBoxZ.toFixed(2)} cm
                    </span>
                    <span>
                      {item.stlIsWatertight ? (
                        <>
                          <Icon i="droplet" color="green" />
                          Watertight
                        </>
                      ) : (
                        <>
                          <Icon i="droplet-off" color="red" />
                          Not Watertight
                        </>
                      )}
                    </span>
                  </Util.Row>
                  <Util.Spacer size={0.5} />
                </>
              ) : (
                <Util.Spacer size={1} />
              )}
              <Util.Row gap={1} align="center">
                <>
                  <Button
                    onClick={modal}
                    style={{
                      padding: "0.4375rem",
                    }}
                  >
                    <Icon i="cube" size={16} />
                  </Button>
                  <Button
                    onClick={() => {
                      downloadFile(item.fileUrl, item.title);
                    }}
                    style={{
                      padding: "0.4375rem",
                    }}
                    download
                  >
                    <Icon i="download" size={16} />
                  </Button>
                  {userIsPrivileged && (
                    <Button
                      onClick={(e) => {
                        deleteJobItem(refetchJobs, e);
                      }}
                      style={{
                        padding: "0.4375rem",
                      }}
                      variant="danger"
                      outline
                    >
                      <Icon i="trash" size={16} />
                    </Button>
                  )}
                </>
                {userIsPrivileged ? (
                  opLoading ? (
                    <Spinner />
                  ) : (
                    <DropdownInput
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
                      value={item.status}
                      onChange={(value) => {
                        updateJobItem({ status: value.id });
                      }}
                      color={switchStatusToUI(item.status)[1]}
                      outline
                    />
                  )
                ) : (
                  <Badge color={switchStatusToUI(item.status)[1]} soft>
                    {switchStatusToUI(item.status)[0]}
                  </Badge>
                )}
              </Util.Row>
              <Util.Spacer size={1} />

              <Util.Row gap={1}>
                {!billingGroupUserLoading &&
                billingGroupUser.role === "ADMIN" ? (
                  <div className={item.approved === null && styles.callout}>
                    <LoadableDropdownInput
                      label={"Approval"}
                      loading={opLoading}
                      value={item.approved}
                      onChange={(value) =>
                        updateJobItem({ approved: value.id })
                      }
                      values={[
                        {
                          id: true,
                          label: "Approved",
                        },
                        { id: false, label: "Not Approved" },
                        { id: null, label: "Pending" },
                      ]}
                      color={
                        item.approved
                          ? "green"
                          : item.approved === false
                          ? "orange"
                          : "red"
                      }
                    />
                  </div>
                ) : (
                  <>
                    <label className="form-label">Approval status</label>
                    <Badge
                      color={
                        item.approved
                          ? "green"
                          : item.approved === false
                          ? "orange"
                          : "red"
                      }
                      soft
                    >
                      {item.approved === null
                        ? "Pending"
                        : item.approved
                        ? "Approved"
                        : "Not Approved"}
                    </Badge>
                  </>
                )}

                <ResourceTypePicker
                  value={item.resourceTypeId}
                  loading={opLoading}
                  onChange={(value) => updateJobItem({ resourceTypeId: value })}
                  includeNone={true}
                />
              </Util.Row>
            </div>

            <Util.Responsive
              gap={2}
              align="start"
              threshold={1300}
              style={{ flex: 1, width: "100%" }}
            >
              <div>
                <H4>Resource Configuration</H4>
                {item.resourceTypeId ? (
                  <Util.Col
                    gap={1}
                    align="start"
                    threshold={1200}
                    default="column"
                  >
                    <MaterialPicker
                      value={item.materialId}
                      onChange={(value) => updateJobItem({ materialId: value })}
                      resourceTypeId={item.resourceTypeId}
                      opLoading={opLoading}
                      includeNone={true}
                    />
                    {userIsPrivileged ? (
                      <ResourcePicker
                        value={item.resourceId}
                        onChange={(value) =>
                          updateJobItem({ resourceId: value })
                        }
                        resourceTypeId={item.resourceTypeId}
                        opLoading={opLoading}
                        includeNone={true}
                      />
                    ) : (
                      <Util.Col gap={1}>
                        <label className="form-label mb-0">Resource</label>
                        <Badge color="blue" soft>
                          {item.resource?.title}
                        </Badge>
                      </Util.Col>
                    )}
                  </Util.Col>
                ) : (
                  <i>Select a resource type to see more options</i>
                )}
              </div>
            </Util.Responsive>
          </Util.Row>
        </Util.Responsive>
        <div style={{}}>
          <H4>Item Costing</H4>
          {item.materialId && item.resourceId ? (
            <EditCosting
              item={item}
              onChange={(value) => updateJobItem(value)}
              loading={opLoading}
              userIsPrivileged={userIsPrivileged}
            />
          ) : (
            <Badge color="red" soft>
              <Icon i="coin-off" />
              Costing unavailable without material and resource
            </Badge>
          )}
        </div>
      </Util.Responsive>
    </Card>
  );
};

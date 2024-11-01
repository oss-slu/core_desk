import React, { useState } from "react";
import { Card, Util, Typography, DropdownInput, Input } from "tabler-react-2";
import { RenderMedia } from "../media/renderMedia";
import { Button } from "tabler-react-2/dist/button";
import { Icon } from "../../util/Icon";
import { useModal } from "tabler-react-2/dist/modal";
import { useJobItem } from "../../hooks/useJobItem";
import { useParams } from "react-router-dom";
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

export const JobItem = ({ item: _item, refetchJobs, userIsPrivileged }) => {
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
              <H3>{item.title}</H3>
              <Util.Row gap={1} align="center">
                <Button
                  onClick={modal}
                  style={{
                    padding: "0.4375rem",
                  }}
                >
                  <Icon i="cube" size={20} />
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
                  <Icon i="download" size={20} />
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
                    <Icon i="trash" size={20} />
                  </Button>
                )}
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

              <ResourceTypePicker
                value={item.resourceTypeId}
                loading={opLoading}
                onChange={(value) => updateJobItem({ resourceTypeId: value })}
                includeNone={true}
              />
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
        <div style={{ width: "100%" }}>
          <H4>Item Costing</H4>
          {item.materialId && item.resourceId ? (
            <EditCosting
              item={item}
              onChange={(value) => updateJobItem(value)}
              loading={opLoading}
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

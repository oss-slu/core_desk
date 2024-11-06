import React from "react";
import { RenderMedia } from "../media/renderMedia";
import { Card, Typography, Util } from "tabler-react-2";
import { downloadFile, switchStatusToUI } from "./JobItem";
import Badge from "tabler-react-2/dist/badge";
import { Icon } from "../../util/Icon";
import { Button } from "tabler-react-2/dist/button";
import { useJobItem } from "../../hooks";
import { useParams } from "react-router-dom";

export const MicroJobItem = ({ item }) => {
  const { shopId } = useParams();
  const { deleteJobItem, opLoading } = useJobItem(shopId, item.jobId, item.id, {
    initialValue: item,
    shouldFetchJobItem: false,
  });

  return (
    <Card>
      <Util.Row gap={1}>
        <RenderMedia
          mediaUrl={item.fileUrl}
          fileType={item.fileType}
          thumbnailUrl={item.fileThumbnailUrl}
          small
        />
        <Util.Col gap={0.5}>
          <Typography.H4 style={{ marginBottom: 0 }}>
            {item.title}
          </Typography.H4>
          <span>
            <b>Fulfillment Status</b>{" "}
            <Badge color={switchStatusToUI(item.status)[1]} soft>
              {switchStatusToUI(item.status)[0]}
            </Badge>
          </span>
          <span>
            <b>Approval Status</b>{" "}
            <Badge
              color={
                item.approved === null
                  ? "secondary"
                  : item.approved
                  ? "green"
                  : "red"
              }
              soft
            >
              {item.approved === null
                ? "Pending"
                : item.approved
                ? "Approved"
                : "Rejected"}
            </Badge>
          </span>
          <span>
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
              </>
            ) : (
              <></>
            )}
          </span>
          <Util.Row gap={1} align="center">
            <Button
              size="sm"
              onClick={() => downloadFile(item.fileUrl, item.title)}
            >
              <Icon i="download" />
              Download
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={deleteJobItem}
              loading={opLoading}
            >
              <Icon i="trash" />
              Delete
            </Button>
          </Util.Row>
        </Util.Col>
      </Util.Row>
    </Card>
  );
};

import React from "react";
import { Card, Util, Typography, DropdownInput } from "tabler-react-2";
import { RenderMedia } from "../media/renderMedia";
import { Button } from "tabler-react-2/dist/button";
import { Icon } from "../../util/Icon";
import { useModal } from "tabler-react-2/dist/modal";
import { useJobItem } from "../../hooks/useJobItem";
import { useParams } from "react-router-dom";
import { Spinner } from "tabler-react-2/dist/spinner";
const { H3 } = Typography;
import styles from "./jobItem.module.css";

function downloadFile(url, filename) {
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

const switchStatusToUI = (status) => {
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
    default:
      return [status, "secondary"];
  }
};

export const JobItem = ({ item: _item }) => {
  const { shopId, jobId } = useParams();

  const { item, opLoading, updateJob } = useJobItem(shopId, jobId, _item.id, {
    initialValue: _item,
    fetchJobItem: false,
  });

  const { modal, ModalElement } = useModal({
    title: item.title,
    text: (
      <div>
        <RenderMedia big mediaUrl={item.fileUrl} fileType={item.fileType} />
      </div>
    ),
  });

  return (
    <Card>
      <div className={styles.modal}>{ModalElement}</div>
      <Util.Row gap={1}>
        <RenderMedia mediaUrl={item.fileUrl} fileType={item.fileType} />
        <div>
          <H3>{item.title}</H3>
          <Util.Row gap={1}>
            <Button onClick={modal}>
              <Icon i="cube" size={20} />
            </Button>
            <Button
              onClick={() => {
                downloadFile(item.fileUrl, item.title);
              }}
              download
            >
              <Icon i="download" size={20} />
            </Button>
            {opLoading ? (
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
                ]}
                value={item.status}
                onChange={(value) => {
                  updateJob({ status: value.id });
                }}
                color={switchStatusToUI(item.status)[1]}
                outline
              />
            )}
          </Util.Row>
        </div>
        {/* {JSON.stringify(item)} */}
      </Util.Row>
    </Card>
  );
};

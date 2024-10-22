import React from "react";
import { Card, Util, Typography, DropdownInput } from "tabler-react-2";
import { RenderMedia } from "../media/renderMedia";
import { Button } from "tabler-react-2/dist/button";
import { Icon } from "../../util/Icon";
const { H3 } = Typography;

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

export const JobItem = ({ item }) => {
  return (
    <Card>
      <Util.Row gap={1}>
        <RenderMedia mediaUrl={item.fileUrl} fileType={item.fileType} />
        <div>
          <H3>{item.title}</H3>
          <Util.Row gap={1}>
            <Button
              onClick={() => {
                downloadFile(item.fileUrl, item.title);
              }}
              download
            >
              <Icon i="download" size={18} /> Download
            </Button>
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
                console.log("Status changed to:", value);
              }}
              color="red"
              outline
            />
          </Util.Row>
        </div>
        {/* {JSON.stringify(item)} */}
      </Util.Row>
    </Card>
  );
};

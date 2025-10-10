import React, { useState, useEffect } from "react";
import { authFetch } from "#url";
import { useModal } from "#modal";
import { Input, Spinner, Util, Switch, Card } from "tabler-react-2";
import { Button } from "#button";
import { useParams } from "react-router-dom";
import { useUserShop } from "#hooks";
import { useAuth } from "#useAuth";
import { useJob } from "../../hooks/useJob";
import {
  JobItem,
  switchStatusToUI,
} from ".jobitem/JobItem";
const { H1, H2, H3 } = Typography;
import { UploadDropzone } from "./upload/uploader";
import { Comments } from "./comments/Comments";

export const SimpleJobPipeline = ({ onSubmit }) =>  {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  

  // Create the handler function to update the state.
  const handleNext = () => {
    // This calculates the next index.
    // The modulo (%) operator is a clever way to loop back to 0
    // when you reach the end of the array.
    if (currentIndex < contentItems.length - 1) {
        setCurrentIndex(currentIndex + 1);
    }
  };
  
  const { shopId } = useParams();
  const { user } = useAuth();
  const { loading: userShopLoading, userShop } = useUserShop(shopId, user?.id);
  const {
      job: uncontrolledJob,
      refetch: refetchJobs,
      opLoading,
      updateJob,
      ConfirmModal,
    } = useJob(shopId, jobId);

  const pages = [
    <div>
      <Input
        value={title}
        onChange={(e) => setTitle(e)}
        label="Job Name"
        placeholder="e.g. Wind Mill Assembly"
      />
      <Input
        value={description}
        onChange={(e) => setDescription(e)}
        label="Job Description (optional)"
        placeholder="e.g. Parts for version 2 of the wind mill design project"
      />
      <Input
        type="date"
        label="Due Date"
        onChange={(e) => setDueDate(e + "T00:00:00")}
        value={dueDate?.split("T")[0]}
      />
    </div>,

    <div>
      <UploadDropzone
        label={"Upload Files"}
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
      <Comments 
        label={"Comments or Special Instructions"}
        jobId={jobId} 
        shopId={shopId} 
      />
    </div>,

    <div>
      <Button
        variant="primary"
        loading={loading}
        onClick={() => {
          setLoading(true);
          onSubmit(
            title,
            description,
            dueDate
          );
        }}
      >
        Submit
      </Button>
    </div>,

    <div>
    </div>,

  ]

  return (
    <div style={{ textAlign: 'center', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      {/* Render the content for the current item */}
      <div>{pages[currentIndex]}</div>

      {/* Attach the handler to the button's onClick event */}
      <Button onClick={handleNext}>
        Next
      </Button>
    </div>
  );
}
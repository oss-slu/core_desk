import React, { useState, useEffect } from "react";
import { authFetch } from "../util/url";
import { useModal } from "tabler-react-2/dist/modal";
import { Input } from "tabler-react-2";
import { Button } from "tabler-react-2/dist/button";

const CreateJobModalContent = ({ onSubmit }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <Input
        value={title}
        onChange={(e) => setTitle(e)}
        label="Job title"
        placeholder="e.g. Wind Mill Assembly"
      />
      <Input
        value={description}
        onChange={(e) => setDescription(e)}
        label="Job description (optional)"
        placeholder="e.g. Parts for version 2 of the wind mill design project"
      />
      <Input
        type="date"
        label="Due Date"
        onChange={(e) => setDueDate(e + "T00:00:00")}
        value={dueDate?.split("T")[0]}
      />
      {title.length > 1 && dueDate.length > 1 ? (
        <Button
          variant="primary"
          loading={loading}
          onClick={() => {
            setLoading(true);
            onSubmit(title, description, dueDate);
          }}
        >
          Submit
        </Button>
      ) : (
        <Button disabled>Submit</Button>
      )}
    </div>
  );
};

export const useJobs = (shopId) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [opLoading, setOpLoading] = useState(false);
  const [microLoading, setMicroLoading] = useState(false);

  const _createJob = async (title, description, dueDate) => {
    try {
      setOpLoading(true);

      const r = await authFetch(`/api/shop/${shopId}/job`, {
        method: "POST",
        body: JSON.stringify({ title, description, dueDate }),
      });
      const data = await r.json();
      document.location.href = `/shops/${shopId}/jobs/${data.job.id}`;

      setOpLoading(false);
    } catch (error) {
      setError(error);
    }
  };

  const { modal, ModalElement } = useModal({
    title: "Create a new Job",
    text: <CreateJobModalContent onSubmit={_createJob} />,
  });

  const fetchJobs = async (shouldSetLoading = true) => {
    try {
      shouldSetLoading ? setLoading(true) : setMicroLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/job`);
      const data = await r.json();
      setJobs(data.jobs);
      setMeta(data.meta);
      setLoading(false);
      setMicroLoading(false);
    } catch (error) {
      setError(error);
      setLoading(false);
      setMicroLoading(false);
    }
  };

  const createJob = async () => {
    modal();
  };

  const updateJob = async (jobId, newJob) => {
    const job = jobs.find((j) => j.id === jobId);
    if (job.finalized) {
      const result = await confirm();
      if (!result) {
        return;
      }
    }
    try {
      setOpLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/job/${jobId}`, {
        method: "PUT",
        body: JSON.stringify(newJob),
      });
      const data = await r.json();
      if (newJob.finalized) {
        fetchJobs(false);
        setOpLoading(false);
      } else {
        if (data.job) {
          fetchJobs(false);
          setOpLoading(false);
        } else {
          setError("Internal server error");
          setOpLoading(false);
        }
      }
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return {
    jobs,
    loading,
    microLoading,
    error,
    meta,
    refetch: fetchJobs,
    ModalElement,
    createJob,
    opLoading,
    updateJob,
  };
};

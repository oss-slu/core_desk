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
        onChange={(e) => setDueDate(e)}
        value={dueDate}
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

  const _createJob = async (title, description, dueDate) => {
    try {
      setOpLoading(true);

      const r = await authFetch(`/api/shop/${shopId}/job`, {
        method: "POST",
        body: JSON.stringify({ title, description, dueDate }),
      });
      const data = await r.json();
      document.location.href = `/shops/${shopId}/job/${data.job.id}`;

      setOpLoading(false);
    } catch (error) {
      setError(error);
    }
  };

  const { modal, ModalElement } = useModal({
    title: "Create a new Job",
    text: <CreateJobModalContent onSubmit={_createJob} />,
  });

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const r = await authFetch(`/api/shop/${shopId}/job`);
      const data = await r.json();
      setJobs(data.jobs);
      setMeta(data.meta);
      setLoading(false);
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  const createJob = async () => {
    modal();
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return {
    jobs,
    loading,
    error,
    meta,
    refetch: fetchJobs,
    ModalElement,
    createJob,
    opLoading,
  };
};

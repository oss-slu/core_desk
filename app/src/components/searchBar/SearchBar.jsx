import React, { useState } from "react";
import { Input } from "tabler-react-2";

export const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState("");

  const handleChange = (value) => {
    setQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <Input
        label="Search by name or email"
        placeholder = "Ex: John Pork" //lol
        value={query}
        onChange={handleChange}
        style={{
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          border: "1px solid #ccc",
          width: "100%",
          maxWidth: "300px",
          fontSize: "1rem",
        }}
      />
    </div>
  );
};

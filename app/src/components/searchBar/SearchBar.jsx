import React, { useState } from "react";

export const SearchBar = ({ placeholder = "Search...", onSearch }) => {
  const [query, setQuery] = useState("");

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (onSearch){
        onSearch(value);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
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

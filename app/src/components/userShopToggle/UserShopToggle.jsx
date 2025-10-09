import React from 'react';
import { useUser } from '#hooks';

// Let's assume this component receives shopId and userId as props
export function UserShopToggle({ userId }) {

  // 1. Call the hook at the top level of the component.
  // This gives us the state and the functions to change that state.
  const { user, loading, error, setSimple } = useUser(userId);

  // You can show a loading or error state based on the hook's return values
  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error loading data.</div>;
  }

  // 2. The JSX uses the 'setSimple' function directly from the hook.
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      {/* This button calls the 'setSimple' function provided by the hook */}
      <input
        type="button"
        role="button"
        className='btn'
        value={"Simplified"}
        onClick={() => {
          setSimple(true); // This also correctly calls the function from useUser
        }}
        style={{
          backgroundColor: user?.simple ? "lightgray" : "white",
          height: 36,
          marginRight: 0,
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
        }}
      />

      <input
        type="button"
        role="button"
        className='btn'
        value={"Standard"}
        onClick={() => {
          console.log("1. Clicked 'Standard'. Calling setSimple(false)."); // <-- ADD THIS
          setSimple(false); // This also correctly calls the function from useUser
        }}
        style={{
          backgroundColor: user?.simple ? "white" : "lightgray",
          height: 36,
          marginLeft: 0,
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
        }}
      />

      {/* You can display the current state for debugging
      <p>Current Mode: {user?.simple ? 'Simplified' : 'Standard'}</p> */}
    </div>
  );
}
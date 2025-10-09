import React from 'react';
import { Button } from 'tabler-react-2';
import { useUserShop } from '#hooks';

// Let's assume this component receives shopId and userId as props
export function UserShopToggle({ shopId, userId }) {

  // 1. Call the hook at the top level of the component.
  // This gives us the state and the functions to change that state.
  const { userShop, loading, error, setSimple } = useUserShop(shopId, userId);

  // You can show a loading or error state based on the hook's return values
  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error loading data.</div>;
  }

  // 2. The JSX uses the 'setSimple' function directly from the hook.
  return (
    <div>
      {/* This button calls the 'setSimple' function provided by the hook */}
      <Button
        className="toggle btn"
        role="button"
        onClick={() => {
          setSimple(true); // This now correctly calls the function from useUserShop
        }}
        style={{
          height: 36,
          marginRight: 0,
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
        }}>
        Simplified
      </Button>

      <Button
        className="toggle btn"
        role="button"
        onClick={() => {
          setSimple(false); // This also correctly calls the function from useUserShop
        }}
        style={{
          height: 36,
          marginLeft: 0,
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
        }}>
        Standard
      </Button>

      {/* You can display the current state for debugging */}
      <p>Current Mode: {userShop.simple ? 'Simplified' : 'Standard'}</p>
    </div>
  );
}
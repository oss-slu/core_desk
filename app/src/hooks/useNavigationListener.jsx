import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import useSWRMutation from "swr/mutation";
import { authFetch } from "#url";

const postNavigation = async (url, { arg }) => {
  return authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: arg }),
  });
};

export const useNavigationListener = () => {
  const location = useLocation();
  const { trigger } = useSWRMutation("/api/navigation", postNavigation);

  useEffect(() => {
    console.log(location.pathname);
    trigger(location.pathname);
  }, [location.pathname, trigger]);
};

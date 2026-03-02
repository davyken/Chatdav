import { useAuth } from "@clerk/clerk-react";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import api from "../lib/axios";

function useUserSync() {
  const { isSignedIn, getToken } = useAuth();

  const {
    mutate: syncUser,
    isPending,
    isSuccess,
    error,
  } = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      console.log("useUserSync - token:", token ? "present" : "missing");
      const res = await api.post(
        "/auth/callback",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res.data;
    },
    onError: (err) => {
      console.error("useUserSync - error:", err);
    },
  });

  useEffect(() => {
    console.log("useUserSync - isSignedIn:", isSignedIn, "isPending:", isPending, "isSuccess:", isSuccess);
    if (isSignedIn && !isPending && !isSuccess) {
      console.log("useUserSync - calling syncUser");
      syncUser();
    }
  }, [isSignedIn, syncUser, isPending, isSuccess]);

  return { isSynced: isSuccess, isSyncing: isPending, error };
}
export default useUserSync;

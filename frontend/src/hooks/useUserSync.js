import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import api from "../lib/axios";

function useUserSync() {
  const { isSignedIn, getToken } = useAuth();
  const queryClient = useQueryClient();
  const hasSynced = useRef(false);

  const {
    mutate: syncUser,
    isPending,
    isSuccess,
    error,
  } = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const res = await api.post(
        "/auth/callback",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res.data;
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  useEffect(() => {
    // Only sync if user is signed in and hasn't synced yet
    if (isSignedIn && !hasSynced.current) {
      hasSynced.current = true;
      syncUser();
    }
    
    // Reset hasSynced when user signs out
    if (!isSignedIn) {
      hasSynced.current = false;
    }
  }, [isSignedIn, syncUser]);

  return { isSynced: isSuccess, isSyncing: isPending, error };
}
export default useUserSync;

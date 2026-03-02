import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import api from "../lib/axios";

export const useUsers = () => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const token = await getToken();
      console.log("useUsers - token:", token ? "present" : "missing");
      const res = await api.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("useUsers - response:", res.data);
      return res.data;
    },
    retry: 1,
    staleTime: 30000,
    onError: (err) => {
      console.error("useUsers - error:", err);
    },
  });
};

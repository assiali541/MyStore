import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Admin, useAdminMe, getAdminMeQueryKey } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface AdminAuthContextType {
  admin: Admin | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, admin: Admin) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Set up the API client to use the token from localStorage
setAuthTokenGetter(() => localStorage.getItem("luxe-admin-token"));

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => 
    localStorage.getItem("luxe-admin-token")
  );
  
  const { data: adminData, isLoading, error } = useAdminMe({
    query: {
      enabled: !!token,
      retry: false,
      queryKey: getAdminMeQueryKey(),
    }
  });

  useEffect(() => {
    if (error) {
      // Token is invalid or expired
      logout();
    }
  }, [error]);

  const login = (newToken: string, admin: Admin) => {
    localStorage.setItem("luxe-admin-token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("luxe-admin-token");
    setToken(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin: adminData ?? null,
        token,
        isLoading: isLoading && !!token,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}

import React, { createContext, useContext, useState } from "react";

// Mock User for local admin authentication without Firebase
export interface User {
  displayName: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  accessToken: string | null;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const login = async () => {
    // Simple mock login since we are using Google Sheets/Apps Script as the backend.
    setUser({ displayName: "Admin", email: "admin@yashoda.local" });
    setAccessToken("mock_google_sheets_token");
  };

  const logout = async () => {
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, accessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

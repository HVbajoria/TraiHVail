
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  fullName: string;
  // Add other relevant user fields if needed, e.g., email
}

interface AuthContextProps {
  user: User | null;
  login: (fullName: string, password?: string) => Promise<void>; // Keep password optional for simplicity
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  login: async () => {},
  logout: () => {},
  isLoading: true,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for persisted user session on initial load
    const storedUser = localStorage.getItem('traihvailUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user data:", error);
        localStorage.removeItem('traihvailUser');
      }
    }
    setIsLoading(false); // Finished loading initial state
  }, []);

  const login = async (fullName: string, password?: string): Promise<void> => {
    // Simulate login process (replace with actual API call)
    setIsLoading(true);
    console.log("Simulating login for:", fullName);
    // In a real app, you'd verify the password here.
    // For this demo, we'll just accept any login attempt.
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser: User = {
          id: `user-${Date.now()}`, // Simple unique ID
          fullName: fullName.trim(),
        };
        setUser(newUser);
        localStorage.setItem('traihvailUser', JSON.stringify(newUser)); // Persist user session
        setIsLoading(false);
        console.log("Login simulation successful");
        resolve();
      }, 1000); // Simulate network delay
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('traihvailUser'); // Clear persisted session
    console.log("User logged out");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

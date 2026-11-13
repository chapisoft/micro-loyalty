import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
export interface UserData {
  accessToken?: string;
  id?: number
  fullName?: string
  userName?: string
  phoneNumber?: string
  roles?: string
  permissions?: string[]
}

interface UserContextType {
  user?: UserData;
  setUser?: (userData: UserData) => void;
}

// Create a Context for the user data
const UserContext = createContext<UserContextType>({});

// Create a custom hook to use the UserContext
// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => useContext?.(UserContext);

// Create a Provider component
export const UserProvider = ({
  userData,
  children,
}: {
  userData?: UserData;
  children: React.JSX.Element;
}) => {
  const [user, setUser] = useState<UserData | undefined>(() => {
    if (userData) return userData;
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return undefined;
  });

  // Function to update user data
  const updateUser = useCallback((newUserData: UserData) => {
    setUser(newUserData);
    try {
      localStorage.setItem('user', JSON.stringify(newUserData));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (userData) {
      setUser(userData);
    }
  }, [userData]);

  return (
    <UserContext.Provider value={{ user, setUser: updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

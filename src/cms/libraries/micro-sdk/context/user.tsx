import React, { createContext, useContext, useEffect, useState } from "react";
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
export const useUser = () => useContext?.(UserContext);

// Create a Provider component
export const UserProvider = ({
  userData,
  children,
}: {
  userData?: UserData;
  children: React.JSX.Element;
}) => {
  const [user, setUser] = useState<UserData | undefined>(userData);

  // Function to update user data
  const updateUser = (userData: UserData) => {
    setUser(userData);
  };

  useEffect(() => {
    setUser(userData);
  }, [userData]);

  return (
    <UserContext.Provider value={{ user, setUser: updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

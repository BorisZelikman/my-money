import React, { createContext, useState } from 'react';

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [glblUserID, setGlblUserID] = useState(''); 

  const updateGlblUser = (newGlblUserID) => {
    setGlblUserID(newGlblUserID);
  };

  return (
    <UserContext.Provider value={{ glblUserID, updateGlblUser }}>
      {children}
    </UserContext.Provider>
  );
}

export default UserContext;

import React, { createContext, useContext, useState } from 'react';

type NotificationContextType = {
  notification: boolean;
  setNotification: (value: boolean) => void;
};

const NotificationContext = createContext<NotificationContextType>({
  notification: true,
  setNotification: () => {},
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notification, setNotification] = useState(true);

  return (
    <NotificationContext.Provider value={{ notification, setNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
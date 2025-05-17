import React, { createContext, useContext, useState } from 'react';

const ModalContext = createContext({
  transportModalVisible: false,
  pinpointModalVisible: false,
  setTransportModalVisible: (value: boolean) => {},
  setPinpointModalVisible: (value: boolean) => {},
});

export const TransportModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [transportModalVisible, setTransportModalVisible] = useState(false);
  const [pinpointModalVisible, setPinpointModalVisible] = useState(false);

  return (
    <ModalContext.Provider value={{ transportModalVisible, setTransportModalVisible, pinpointModalVisible, setPinpointModalVisible }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useTransportModal = () => useContext(ModalContext);

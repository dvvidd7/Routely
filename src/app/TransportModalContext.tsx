import { createContext, useContext, useState } from 'react';

const TransportModalContext = createContext({
  transportModalVisible: false,
  setTransportModalVisible: (value: boolean) => {},
});

export const TransportModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [transportModalVisible, setTransportModalVisible] = useState(false);

  return (
    <TransportModalContext.Provider value={{ transportModalVisible, setTransportModalVisible }}>
      {children}
    </TransportModalContext.Provider>
  );
};

export const useTransportModal = () => useContext(TransportModalContext);

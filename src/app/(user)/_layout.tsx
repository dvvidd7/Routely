import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { TabBar } from '@/components/TabBar';

const TabLayout = () => {
  const [transportModalVisible, setTransportModalVisible] = useState(false);

  return (
    <Tabs
      tabBar={(props) => (
        <TabBar {...props} transportModalVisible={transportModalVisible} />
      )}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
        }}
        initialParams={{ transportModalVisible, setTransportModalVisible }} // Pass the setter function as a param
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: "AI",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: "Account",
          headerShown: false,
        }}
      />
    </Tabs>
  );
};

export default TabLayout;
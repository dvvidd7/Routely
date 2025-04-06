import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { TabBar } from '@/components/TabBar';
import { StyleSheet } from 'react-native';

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
      />
      <Tabs.Screen
        name="two"
        options={{
          title: "Account",
          headerShown: false,
          headerTitleStyle: styles.headerTitleText,
          headerStyle: styles.headerBackground,
          headerShadowVisible: false,
        }}
      />
      <Tabs.Screen
        name="panel"
        options={{
          title: "Panel",
          headerShown: false,
          headerTitleStyle: styles.headerTitleText,
          headerStyle: styles.headerBackground,
          headerShadowVisible: false,
        }}
      />
    </Tabs>
  );
};

const styles = StyleSheet.create({
  headerTitleText: {
    fontSize: 40,
  },
  headerBackground: {
    backgroundColor: 'white',
  },
});

export default TabLayout;
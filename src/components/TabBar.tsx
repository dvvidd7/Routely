import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import TabBarButton from './TabBarButton';
import { useState } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, dark } = useTheme();
  const isAdmin = state.routes.length === 3; // Check if there are 3 tabs (admin page)
  const [dimensions, setDimensions] = useState({ height: 20, width: 100 });
  const buttonWidth = dimensions.width / state.routes.length;

  const onTabbarLayout = (e: LayoutChangeEvent) => {
    setDimensions({
      height: e.nativeEvent.layout.height,
      width: e.nativeEvent.layout.width,
    });
  };

  const tabPositionX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: tabPositionX.value }],
    };
  });

  return (
    <View onLayout={onTabbarLayout} style={[styles.tabbar, { backgroundColor: dark ? '#000' : '#fff' }]}>
      <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          backgroundColor: '#0384fc',
          borderRadius: 30,
          marginHorizontal: 25,
          height: dimensions.height - 15,
          width: buttonWidth * (isAdmin ? 0.6 : 0.5), // Dynamic width based on role
          left: buttonWidth * (isAdmin ? -0.07 : 0.07), // Dynamic centering
        },
      ]}
    />
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];

        // Ensure label is always a string, fallback to route.name if undefined
        const label = (options.tabBarLabel ?? options.title ?? route.name) as string;

        const isFocused = state.index === index;

        const onPress = () => {
          tabPositionX.value = withSpring(buttonWidth * index, { duration: 1500 });
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabBarButton
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            isFocused={isFocused}
            routeName={route.name}
            label={label}
            color={isFocused ? '#FFF' : "#0384fc"}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabbar: {
    position: 'absolute',
    bottom: 60,
    left: 60,
    right: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
});
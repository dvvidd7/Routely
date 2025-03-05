import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '@react-navigation/native';

interface TabBarButtonProps {
  onPress: () => void;
  onLongPress: () => void;
  isFocused: boolean;
  routeName: string;
  label: string;
  color: string;
}

const TabBarButton: React.FC<TabBarButtonProps> = ({ onPress, onLongPress, isFocused, routeName, label, color }) => {
  const { dark } = useTheme();

  const icon: Record<string, (props: any) => JSX.Element> = {
    index: (props) => <Feather name="home" size={24} {...props} />,
    two: (props) => <Feather name="user" size={24} {...props} />,
  };

  const IconComponent = icon[routeName]; // Destructure to avoid repeated lookup

  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0, { duration: 350 });
  }, [scale, isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(scale.value, [0, 1], [1, 1.2]);
    const translateY = interpolate(scale.value, [0, 1], [0, 6]); // Adjusted translateY value to move down

    return {
      transform: [
        { scale: scaleValue },
        { translateY: translateY }
      ]
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scale.value, [0, 1], [1, 0]);

    return {
      opacity,
    };
  });

  const buttonColor = isFocused && dark ? '#000' : color;

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={styles.tabbarItem}>
      <Animated.View style={animatedIconStyle}>
        {IconComponent ? (
          <IconComponent color={buttonColor} />
        ) : null}
      </Animated.View>
      <Animated.Text style={[{ color: buttonColor, fontSize: 12 }, animatedTextStyle]}>
        {label}
      </Animated.Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tabbarItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
});

export default TabBarButton;
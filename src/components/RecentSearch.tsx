import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { setDestination } from '@/slices/navSlice';

interface SearchRefType {
  searchRef: React.RefObject<any>;
  userSearch: SearchDB;
  onPress: () => void;
}

type SearchDB = {
  id: number;
  created_at: string;
  latitude: number;
  longitude: number;
  user_id: string;
  searchText: string;
};

export default function RecentSearch({ searchRef, userSearch, onPress }: SearchRefType) {
  const { dark } = useTheme();
  const dispatch = useDispatch();

  const handlePress = () => {
    if (searchRef?.current && userSearch) {
      if (userSearch.latitude && userSearch.longitude && userSearch.searchText) {
        dispatch(
          setDestination({
            location: {
              lat: userSearch.latitude,
              lng: userSearch.longitude,
            },
            description: userSearch.searchText,
          })
        );
        onPress();
      } else {
        console.warn('Invalid userSearch data:', userSearch);
      }
    } else {
      console.warn('No search found or searchRef is invalid.');
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{
        ...styles.container,
        backgroundColor: dark ? 'black' : 'white',
      }}
    >
      <Feather name="clock" size={24} style={styles.icon} color={dark ? 'white' : 'black'} />
      <Text style={{ ...styles.text, color: dark ? 'white' : 'black' }}>
        {userSearch?.searchText || 'Unknown Search'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    width: '91%',
  },
  text: {
    fontSize: 15,
  },
  icon: {
    paddingRight: 10,
  },
});
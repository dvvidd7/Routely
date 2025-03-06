import React, { useEffect, useState } from 'react';
import { StyleSheet, Alert, View, Text, TouchableOpacity } from 'react-native';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import 'react-native-get-random-values';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_MAPS_V3_APIKEY } from '@env';
import { mapDark } from '@/constants/darkMap';

const INITIAL_REGION = {
  latitude: 44.1765368,
  longitude: 28.6517479,
  latitudeDelta: 1,
  longitudeDelta: 1,
};

export default function TabOneScreen() {
  const { dark } = useTheme();
  const [hasPermission, setHasPermission] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log("Permission status:", status);

      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        setHasPermission(false);
      } else {
        setHasPermission(true);

        // Get the user's current location
        const location = await Location.getCurrentPositionAsync();
        setUserLocation(location.coords);
        console.log("User location:", location);
      }
    })();
  }, []);

  const handleMyLocationPress = async () => {
    const location = await Location.getCurrentPositionAsync();
    setUserLocation(location.coords);
  };

  return (
    <View style={styles.container}>
      {hasPermission ? (
        <>
          <View style={{ flex: 1, alignItems: 'center', height:'100%' }} >
            <GooglePlacesAutocomplete
              placeholder='Search location'
              fetchDetails={true}
              onPress={(data, details = null) => {
                console.log("Selected Location:", details);
                console.log(data, details);
              }}
              query={{
                key: GOOGLE_MAPS_V3_APIKEY,
                language: 'en',
              }}
              onFail={error => console.error(error)}
              nearbyPlacesAPI="GooglePlacesSearch"
              debounce={200}
              styles={{
                container: styles.topSearch,
                textInput: [
                  styles.searchInput,
                  isFocused && styles.searchInputFocused,
                  dark && styles.searchInputDark
                ],
              }}
              textInputProps={{
                onFocus: () => setIsFocused(true),
                onBlur: () => setIsFocused(false),
                placeholderTextColor: dark ? 'white' : 'black',
              }}
            />
          </View>
          <MapView
            style={styles.map}
            customMapStyle={dark ? mapDark : []}
            initialRegion={INITIAL_REGION}
            showsUserLocation={true}
            showsMyLocationButton={false} // Hide the default button
            onMapReady={() => console.log("Map is ready")}
            region={{
              latitude: userLocation?.latitude || INITIAL_REGION.latitude,
              longitude: userLocation?.longitude || INITIAL_REGION.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          />
          <TouchableOpacity style={styles.myLocationButton} onPress={handleMyLocationPress}>
            <Feather name="navigation" size={20} color={dark ? "black" : "white"} />
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.permissionText}>
          Location Permission Required. Please allow location access to view the map.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSearch: {
    position: 'absolute',
    top: 30,
    width: '80%',
    height:'100%',
    zIndex: 1,
    marginTop: 60,
  },
  searchInput: {
    borderWidth: 2,
    borderColor: 'gray',
    height: 50,
    borderRadius: 25,
    paddingLeft: 25,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 20,
  },
  searchInputFocused: {
    borderWidth: 2,
    borderColor: '#0384fc',
  },
  searchInputDark: {
    backgroundColor: 'black',
    color: 'white',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  permissionText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 180,
    right: 35,
    backgroundColor: '#0384fc',
    borderRadius: 60,
    padding: 13,
    elevation: 5,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  textInput: {
    width: '90%',
  },
});
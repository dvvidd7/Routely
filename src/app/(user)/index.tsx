import React, { useEffect, useState } from 'react';
import { StyleSheet, Alert, View, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';  // Import the correct module
import { Feather } from '@expo/vector-icons'; // Import Feather icons
import 'react-native-get-random-values';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const INITIAL_REGION = {
  latitude: 44.1765368,
  longitude: 28.6517479,
  latitudeDelta: 1,
  longitudeDelta: 1,
};

export default function TabOneScreen() {
  const [hasPermission, setHasPermission] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);

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
          <MapView
            style={styles.map}
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
            <Feather name="navigation" size={20} color="white" />
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
    //flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    //flex:1,
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
  },

  textInput:{
    width:'90%',
  },
});

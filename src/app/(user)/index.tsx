import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Alert, View, Text, TouchableOpacity } from 'react-native';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import 'react-native-get-random-values';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_MAPS_PLACES_LEGACY } from '@env';
import { mapDark } from '@/constants/darkMap';
import { ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { setOrigin, setDestination, selectDestination } from '@/slices/navSlice';

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
  const mapRef = useRef<MapView>(null);
  const dispatch = useDispatch();
  const destination = useSelector(selectDestination);
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
  useEffect(() => {
    if (destination) {
      handleAutocompletePress();
    }
  }, [destination]);

  const handleMyLocationPress = async () => {
    const location = await Location.getCurrentPositionAsync();
    setUserLocation(location.coords);
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }, 1000);
    }
  };
  const handleAutocompletePress = async () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: destination?.location?.lat ?? INITIAL_REGION.latitude,
        longitude: destination?.location?.lng ?? INITIAL_REGION.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }, 1000);
    }
  };
  

  return (
    <View style={styles.container}>
      {hasPermission ? (
        <>
          {/* <View style={{ flex: 1, height: '100%', alignItems:'center', zIndex:5 }} > */}
            <GooglePlacesAutocomplete
              placeholder='Where do you want to go?'
              fetchDetails={true}
              nearbyPlacesAPI='GooglePlacesSearch'
              onPress={(data, details = null) => {
                dispatch(setDestination({
                  location: details?.geometry.location,
                  description: data.description,
                }))
                //handleAutocompletePress();
                console.log(destination);
              }}
              query={{
                key: 'AIzaSyDe5nUC7KKAhkysUfBB9ofQ2FKRM9rE_Qc',
                language: 'en',
              }}
              onFail={error => console.error(error)}
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
              debounce={300}
            />
          {/* </View> */}
          <MapView
            ref={mapRef}
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
    height: '100%',
    zIndex: 5,
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
import React, { useEffect, useState, useRef } from 'react';
import { Image, StyleSheet, Alert, View, Text, TouchableOpacity, Modal, TextInput, Pressable, ScrollView, FlatList, Touchable, Linking, Platform, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { AntDesign, Feather, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import 'react-native-get-random-values';
import { useDispatch, useSelector } from "react-redux";
import { setDestination, selectDestination } from "@/slices/navSlice";
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from "react-native-google-places-autocomplete";
import { GOOGLE_MAPS_PLACES_LEGACY } from "@env";
import MapViewDirections from 'react-native-maps-directions';
import { mapDark } from '@/constants/darkMap';
import { supabase } from '@/lib/supabase';
import { useCreateSearch, useFetchSearches } from '@/api/recentSearches';
import { useGetPoints, useUpdatePoints } from '@/api/profile';
import { useQueryClient } from '@tanstack/react-query';
import RecentSearch from '@/components/RecentSearch';
import { useTransportModal } from '../TransportModalContext';
import BusNavigation from '@/components/BusNavigation';
import * as Notifications from 'expo-notifications';
import { useNotification } from '@/providers/NotificationContext';
import { Divider } from 'react-native-paper';
import Colors from '@/constants/Colors';
import { useAuth } from '@/providers/AuthProvider';

const INITIAL_REGION = {
  latitude: 44.1765368,
  longitude: 28.6517479,
  latitudeDelta: 1,
  longitudeDelta: 1,
};
type Region = {
  latitude: any,
  longitude: any,
  latitudeDelta: any,
  longitudeDelta: any,
}

type Station = {
  transit_details: { departure_stop: { name: any; location: { lat: any; lng: any; }; }; arrival_stop: { name: any; location: { lat: any; lng: any; }; }; line: { short_name: any; vehicle: { type: any; }; }; departure_time: { text: any; }; arrival_time: { text: any; }; headsign: any; };
}
type Stop = {
  from: string;
  fromCoords: {
    lat: any;
    lng: any;
  }
  toCoords: {
    lat: any;
    lng: any;
  }
  to: string; line: string; vehicle: string; departureTime?: string; arrivalTime?: string; headsign?: string
}
type Hazard = {
  id: number;
  label: string;
  icon: string;
};

const hazards: Hazard[] = [
  { id: 1, label: "Accident", icon: "🚗💥" },
  { id: 2, label: "Traffic Jam", icon: "🚦" },
  { id: 3, label: "Roadblock", icon: "🚧" },
  { id: 4, label: "Ticket inspectors", icon: "👮" },
];

export default function TabOneScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const { dark } = useTheme();
  const [hasPermission, setHasPermission] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { transportModalVisible, setTransportModalVisible, pinpointModalVisible, setPinpointModalVisible } = useTransportModal();
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const mapRef = useRef<MapView>(null);
  const searchRef = useRef<GooglePlacesAutocompleteRef | null>(null);
  const dispatch = useDispatch();
  const destination = useSelector(selectDestination);
  const { data: searches, error: searchError } = useFetchSearches();
  const [estimatedBus, setEstimatedBus] = useState<number | string | null>(null);
  const [routeStops, setRouteStops] = useState<Stop[]>([]);
  const [stationVisible, setStationVisible] = useState<boolean>(false);
  const [searchVisible, setSearchVisible] = useState<boolean>(true);
  const [routeVisible, setRouteVisible] = useState<boolean>(false);
  const [recentVisible, setRecentVisible] = useState<boolean>(true);
  const [busNavVisible, setBusNavVisible] = useState<boolean>(false);
  const { notification } = useNotification();
  const [isMapReady, setIsMapReady] = useState(false);
  const [routeIndex, setRouteIndex] = useState<number>(0);
  const [multipleStations, setMultipleStations] = useState<boolean>(false);
  const [fakeMarkerShadow, setFakeMarkerShadow] = useState<boolean>(false);
  const [pinOrigin, setPinOrigin] = useState<Region>();
  const [displayMarker, setDisplayMarker] = useState<boolean>(false);
  const [pinpointDetails, setPinpointDetails] = useState<string>('');
  const [hazardMarkers, setHazardMarkers] = useState<{
    created_at: string | number | Date; id: number; latitude: number; longitude: number; label: string; icon: string
  }[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { mutate: useNewSearch } = useCreateSearch();
  const origin = userLocation
    ? `${userLocation.latitude},${userLocation.longitude}`
    : null; // Fallback to null if userLocation is not available

  const [rideInfo, setRideInfo] = useState<{
    Bus: { price: number; time: number };
    Uber: { price: string; time: number };
    RealTime: { googleDuration: number; distance: number };
  } | null>(null);
  
  const openTransportModal = () => {
    setTransportModalVisible(true);
    setSearchVisible(false);
  };
  const handleRouteIndexIncrease = () => {
    if (routeStops.length - 1 <= routeIndex) return console.warn("Reached end of stations!");
    setRouteIndex(routeIndex + 1);
  };
  const handleRouteIndexDecrease = () => {
    if (routeIndex <= 0) return console.warn("Reached end of stations!");
    setRouteIndex(routeIndex - 1);
  };
  const closeTransportModal = () => {
    setTransportModalVisible(false);
    setSearchVisible(false);
  };
  const getUserLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('Permission to access location was denied');
      return null;
    }

    let location = await Location.getCurrentPositionAsync({});
    return location.coords;
  };

  const getDistanceFromLatLonInMeters = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371000; // Radius of the earth in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      0.5 -
      Math.cos(dLat) / 2 +
      (Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        (1 - Math.cos(dLon))) /
      2;
    return R * 2 * Math.asin(Math.sqrt(a));
  };
  const handleRecentSearchPress = () => {
    setIsFocused(false);
    setRouteVisible(true);
    setTransportModalVisible(true);
    if (!destination || !userLocation) return;

    setTimeout(() => {
      mapRef.current?.fitToSuppliedMarkers(['origin', 'destination'], {
        edgePadding: { top: 50, bottom: 50, left: 50, right: 50 },
      });
    }, 200);

  }
  const calculateBusPrice = () => {
    const numberOfBuses = routeStops.length;
    return numberOfBuses * 3;
  };

  const awardPoints = async () => {
    if (!userEmail) return;
    updatePoints({ points: 10 });

    Alert.alert("Bus trip ended", `You earned 10 points`);
    console.log('10 points awarded!');
    setRouteVisible(false);
    setRouteIndex(0);
    setStationVisible(false);
    setBusNavVisible(false);
    setTransportModalVisible(false);
    setSearchVisible(true);

    dispatch(setDestination(null))
  };

  const openUber = () => {
    if (!userLocation || !destination || !destination.location) return;

    const { lat, lng } = destination.location; // Extract latitude and longitude
    const nickname = destination.description; // Use the description as the nickname

    const uberUrl = `uber://?action=setPickup&pickup[latitude]=${userLocation.latitude}&pickup[longitude]=${userLocation.longitude}&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}&dropoff[nickname]=${encodeURIComponent(nickname)}`;

    Linking.canOpenURL(uberUrl).then((supported) => {
      if (supported) {
        Linking.openURL(uberUrl);
      } else {
        // Fallback to mobile web
        const fallbackUrl = `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${userLocation.latitude}&pickup[longitude]=${userLocation.longitude}&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}&dropoff[nickname]=${encodeURIComponent(nickname)}`;
        Linking.openURL(fallbackUrl);
      }
    });
  };

  const [previousLocation, setPreviousLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  useEffect(() => {
    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to track movement.');
        return;
      }

      // Start watching the user's location
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000, // Check every 1 second
          distanceInterval: 20, // Minimum distance change in meters
        },
        (location) => {
          const { latitude, longitude } = location.coords;

          // Update the current location


          // Compare with the previous location
          if (previousLocation) {
            const distance = getDistanceFromLatLonInMeters(
              previousLocation.latitude,
              previousLocation.longitude,
              latitude,
              longitude
            );
            if (distance < 50) {
              return;
            }
            if (distance > 50) { // Threshold for movement (10 meters)
              // console.log('User moved:', distance, 'meters');
              // console.warn(previousLocation, ' + ', latitude, longitude );
              console.warn(distance);
            }
            //else return;
          }

          // Update the previous location
          setUserLocation({ latitude, longitude });
          setPreviousLocation({ latitude, longitude });
        }
      );

      return () => {
        subscription.remove(); // Stop watching when the component unmounts
      };
    };

    startTracking();
  }, [previousLocation]);
  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error fetching user session:", error);
        return;
      }
      setUserEmail(session?.user?.email || null);
    };

    fetchUserEmail();
  }, []);

  useEffect(() => {
    if (stationVisible && routeStops.length > 0) {
      setLoadingRoute(true);
      setTimeout(() => setLoadingRoute(false), 1000); // Simulate loading
    }
  }, [stationVisible, routeStops]);

  { loadingRoute && <ActivityIndicator size="large" color={Colors.light.themeColorDarker} /> }

  useEffect(() => {
    if (notification) {
      console.log('Notifications are enabled');
    } else {
      console.log('Notifications are disabled');
    }
  }, [notification]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission to access location was denied");
          setHasPermission(false);
          return;
        }
        setHasPermission(true);
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);
      } catch (error) {
        console.error("Error getting location:", error);
      }
    })();
  }, []);

  useEffect(() => {
    if (stationVisible && routeStops.length > 0) {
      setTimeout(() => {
        mapRef.current?.fitToSuppliedMarkers(['departure', 'arrival'], {
          edgePadding: { top: 50, bottom: 50, left: 50, right: 50 },
        });
      }, 500); // Delay rendering by 500ms
    }
  }, [stationVisible, routeStops]);

  useEffect(() => {
    if (!userLocation || !destination || !destination.description) return;

    const getTravelTime = async () => {
      try {
        const origin = `${userLocation.latitude},${userLocation.longitude}`;
        const encodedDestination = encodeURIComponent(destination.description);

        const response = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${encodedDestination}&key=${GOOGLE_MAPS_PLACES_LEGACY}`
        );

        const data = await response.json();

        if (data.routes.length > 0) {
          const leg = data.routes[0].legs[0];
          const durationMin = Math.ceil(leg.duration.value / 60);
          const distanceKm = leg.distance.value / 1000;

          // Calculate dynamic price
          const baseFare = 5;
          const costPerKm = 2;
          const uberPrice = (baseFare + costPerKm * distanceKm).toFixed(2);

          setRideInfo({
            Bus: {
              price: 3,
              time: Math.ceil((distanceKm / 20) * 60), // ~20 km/h
            },
            Uber: {
              price: uberPrice,
              time: Math.ceil((distanceKm / 40) * 60), // ~40 km/h
            },
            RealTime: {
              googleDuration: durationMin,
              distance: distanceKm
            }
          });
        } else {
          console.warn("No routes found in directions response");
        }
      } catch (error) {
        console.error("Error fetching travel time:", error);
      }
    };
    getTravelTime();
  }, [userLocation, destination, GOOGLE_MAPS_PLACES_LEGACY]);

  useEffect(() => {
    let pointsAwarded = false; // Prevent multiple awards

    const watchLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // Check every 10 meters
        },
        (location) => {
          if (routeStops.length > 0 && !pointsAwarded) {
            const lastStation = routeStops[routeStops.length - 1]; // Get the last station
            const distance = getDistanceFromLatLonInMeters(
              location.coords.latitude,
              location.coords.longitude,
              lastStation.toCoords.lat,
              lastStation.toCoords.lng
            );

            console.log('Distance to last station:', distance);

            if (distance <= 50) {
              awardPoints(); // Award points when within 50 meters of the last station
              pointsAwarded = true; // Prevent multiple awards
            }
          }
        }
      );

      return () => subscription.remove();
    };

    watchLocation();
  }, [routeStops]);



  useEffect(() => {
    const fetchHazards = async () => {
      const { data, error } = await supabase.from("hazards").select("*");

      if (error) {
        console.error("Error fetching hazards:", error);
        return;
      }

      // Filter out hazards older than 2 hours
      const now = new Date();

      if (!data) return [];
      const filteredHazards = Array.isArray(data)
        ? data.filter((hazard) => {
          const hazardTime = new Date(hazard.created_at);
          return now.getTime() - hazardTime.getTime() <= 2 * 60 * 60 * 1000; // 2 hours in milliseconds
        })
        : [];

      setHazardMarkers(filteredHazards);
    };

    fetchHazards();
  }, []);

  {/* POINTS SYSTEM */ }

  const { mutate: updatePoints } = useUpdatePoints();
  const { data: points, error } = useGetPoints();

  const queryClient = useQueryClient();
  useEffect(() => {
    const channels = supabase.channel('points-update-channel')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          //console.log('Change received!', payload);
          queryClient.invalidateQueries({ queryKey: ['points'] })
        }
      )
      .subscribe();

    return () => { channels.unsubscribe() }
  }, []);



  useEffect(() => {
    const channel = supabase
      .channel('hazards')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hazards' },
        (payload) => {
          console.log('Change received!', payload);
          updatePoints({ points: 5 });
          const now = new Date();

          if (payload.eventType === 'INSERT') {
            const hazard = payload.new;
            const hazardTime = new Date(hazard.created_at);

            if (now.getTime() - hazardTime.getTime() <= 2 * 60 * 60 * 1000) {
              setHazardMarkers((prev: typeof hazardMarkers) => [
                ...prev,
                {
                  id: hazard.id,
                  created_at: hazard.created_at,
                  latitude: hazard.latitude,
                  longitude: hazard.longitude,
                  label: hazard.label,
                  icon: hazard.icon,
                },
              ]);

              getUserLocation().then((coords) => {
                if (!coords) return;

                const distance = getDistanceFromLatLonInMeters(
                  coords.latitude,
                  coords.longitude,
                  hazard.latitude,
                  hazard.longitude
                );

                if (distance <= 100 && notification) {
                  Notifications.scheduleNotificationAsync({
                    content: {
                      title: "🚨 Nearby Hazard Reported!",
                      body: `A new hazard was reported ${Math.round(distance)}m from your location.`,
                      sound: "default",
                    },
                    trigger: null,
                  });
                }
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            setHazardMarkers((prev) =>
              prev.map((hazard) =>
                hazard.id === payload.new.id
                  ? (payload.new as { created_at: string | number | Date; id: number; latitude: number; longitude: number; label: string; icon: string })
                  : hazard
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setHazardMarkers((prev) => {
              if (!Array.isArray(prev)) return [];
              return prev.filter((hazard) => hazard.id !== payload.old.id);
            });
          }
        }
      )
    const subscription = channel.subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [notification]);

  useEffect(() => {
    if (!destination || !userLocation) return;

    setTimeout(() => {
      mapRef.current?.fitToSuppliedMarkers(['origin', 'destination'], {
        edgePadding: { top: 50, bottom: 50, left: 50, right: 50 },
      });
    }, 200);

    const fetchTransitRoute = async () => {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${userLocation.latitude},${userLocation.longitude}&destination=${destination.location.lat},${destination.location.lng}&mode=transit&key=${GOOGLE_MAPS_PLACES_LEGACY}`
        );
        const data = await response.json();

        // console.log("API Response:", data); // Log the API response for debugging

        // Check if the response contains routes
        if (!data.routes || data.routes.length === 0) {
          console.warn("No transit routes found.");
          setRouteStops([]);
          return;
        }

        // Safely access legs
        const legs = data.routes[0]?.legs;
        if (!legs || legs.length === 0) {
          console.warn("No legs found in the route.");
          setRouteStops([]);
          return;
        }

        // Safely access steps with fallback to empty array
        const steps = legs?.[0]?.steps ?? [];
        if (steps.length === 0) {
          console.warn("No steps found in the route.");
          setRouteStops([]);
          return;
        }

        // Log travel modes to help debug
        // console.log("All travel modes:", steps.map((s: { travel_mode: any; }) => s.travel_mode));

        // Filter transit steps (case-insensitive, and ensure transit_details exists)
        if (!steps) return [];
        const transitSteps = steps.filter(
          (step: any) =>
            step?.travel_mode?.toUpperCase() === "TRANSIT" && step?.transit_details
        );

        // Map transit steps to route stops
        const routeStations = transitSteps.map((step: any) => ({
          from: step.transit_details?.departure_stop?.name || "Unknown stop",
          to: step.transit_details?.arrival_stop?.name || "Unknown stop",
          fromCoords: {
            lat: step.transit_details?.departure_stop?.location?.lat || 0,
            lng: step.transit_details?.departure_stop?.location?.lng || 0,
          },
          toCoords: {
            lat: step.transit_details?.arrival_stop?.location?.lat || 0,
            lng: step.transit_details?.arrival_stop?.location?.lng || 0,
          },
          line: step.transit_details?.line?.short_name || "N/A",
          vehicle: step.transit_details?.line?.vehicle?.type || "Transit",
          departureTime: step.transit_details?.departure_time?.text,
          arrivalTime: step.transit_details?.arrival_time?.text,
          headsign: step.transit_details?.headsign || "",
        }));

        setRouteStops(routeStations);
      } catch (error) {
        console.error("Error fetching transit route:", error);
        setRouteStops([]);
      }
    };

    fetchTransitRoute();
  }, [destination])
  const timeToMinutes = (timeStr: string | undefined) => {
    if (!timeStr) return undefined;
    const [time, modifier] = timeStr.toLowerCase().split(/(am|pm)/);
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier === 'pm' && hours !== 12) hours += 12;
    if (modifier === 'am' && hours === 12) hours = 0;

    return hours * 60 + minutes;
  };
  useEffect(() => {
    if (routeStops.length == 1) {
      const arrivalMinutes = timeToMinutes(routeStops[0].arrivalTime);
      const departureMinutes = timeToMinutes(routeStops[0].departureTime);
      if (arrivalMinutes !== undefined && departureMinutes !== undefined) {
        setEstimatedBus(arrivalMinutes - departureMinutes);
      }
      setMultipleStations(false);
    }
    else if (routeStops.length > 1) {
      const arrivalMinutes = timeToMinutes(routeStops[routeStops.length - 1]?.arrivalTime);
      const departureMinutes = timeToMinutes(routeStops[0]?.departureTime);
      if (arrivalMinutes !== undefined && departureMinutes !== undefined) {
        setEstimatedBus(arrivalMinutes - departureMinutes);
      }
      setMultipleStations(true);
    }
    else setEstimatedBus('-');
  }, [routeStops]);



  const handleMyLocationPress = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          1000
        );
      }
    } catch (error) {
      Alert.alert("Error", "Could not get current location.");
    }
  };

  const handleHazardPanelButton = () => {
    setModalVisible(true);
  };

  const handleSelectHazard = async (hazard: Hazard) => {
    if (!userLocation) {
      Alert.alert("Error", "Location not available!");
      return;
    }

    if (!userEmail) {
      Alert.alert("Error", "You must be logged in to report a hazard.");
      return;
    }

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    console.log("Checking for recent hazards since:", thirtyMinutesAgo);

    const { data: recentHazards, error: queryError } = await supabase
      .from("hazards")
      .select("*")
      .eq("email", userEmail)
      .gt("created_at", thirtyMinutesAgo);

    if (queryError) {
      console.error("Error checking recent hazards:", queryError);
      Alert.alert("Error", "Couldn't verify report limit.");
      return;
    }

    if (!Array.isArray(recentHazards)) {
      console.error("Recent hazards is not an array:", recentHazards);
      return;
    }

    console.log("Recent hazards:", recentHazards);

    // ✅ Check if the user has reached the 5 report limit
    if (recentHazards.length >= 5) {
      console.log("Limit reached, user has reported 5 hazards in the last 30 minutes");
      Alert.alert("Limit Reached", "You can report up to 5 hazards every 30 minutes.");
      return;
    }

    const newHazard = {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      label: hazard.label,
      icon: hazard.icon,
      email: userEmail, // Include the user's email
      created_at: new Date().toISOString(), // Add a timestamp
    };

    try {
      // Save to Supabase
      const { data, error } = await supabase.from("hazards").insert([newHazard]);

      if (error) {
        console.error("Error saving hazard:", error);
        Alert.alert("Error", "Could not save hazard.");
        return;
      }

      setHazardMarkers((prev) => [...prev, { id: Date.now(), ...newHazard }]);
      Alert.alert("Hazard Reported", `You selected: ${hazard.label}. You won 5 point`);
      setModalVisible(false);
    } catch (error) {
      console.error("Unexpected error saving hazard:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    }
  };

  const handleConfirmPinpoint = () => {
    dispatch(
      setDestination(
        {
          location: {
            lat: pinOrigin?.latitude,
            lng: pinOrigin?.longitude,
          },
          description: pinpointDetails
        }
      )
    );
    setPinpointModalVisible(false);
    setDisplayMarker(false); 
    handleSearch(); 
  }

  const handleCancelTransportSelection = () => {
    closeTransportModal();
    setSearchVisible(true);
    setStationVisible(false);

    // Reset search bar input
    if (searchRef.current) {
      searchRef.current.clear();
    }

    // Reset destination in Redux
    dispatch(setDestination(null));
  };
  const handleSearch = () => {
    openTransportModal();
    setRouteVisible(true);

  }
  const handleSearchPress = () => {
    setIsFocused(true);
  };

  function handleBusSelection() {
    if (routeStops.length === 0) return Alert.alert("Oops!", "No direct public transport routes found!");
    setTimeout(() => {
      mapRef.current?.fitToSuppliedMarkers(['departure', 'arrival'], {
        edgePadding: { top: 50, bottom: 50, left: 50, right: 50 },
      });
    }, 200);
    setRouteVisible(false);
    setRouteIndex(0);
    setStationVisible(true);
    setBusNavVisible(true);
    setTransportModalVisible(false);
  }
  async function getLocationName(lat: number,lng: number){
    const apiKey = GOOGLE_MAPS_PLACES_LEGACY;
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
    const data = await response.json();
    if(data.results && data.results.length > 0){
      return data.results[0].formatted_address;
    }
    return "Unknown location";
  }
  
  return (
    <View style={styles.container}>
      {hasPermission ? (
        <>

          <MapView
            ref={mapRef}
            style={styles.map}
            customMapStyle={dark ? mapDark : []}
            initialRegion={INITIAL_REGION}
            showsUserLocation={true}
            showsMyLocationButton={false} // Hide the default button
            onRegionChange={(region, details) => {
              if(displayMarker){
                setFakeMarkerShadow(true);
                setPinOrigin(region);
                getLocationName(region.latitude, region.longitude).then(setPinpointDetails);
              }
            }}
            onRegionChangeComplete={() => setFakeMarkerShadow(false)}
            onMapReady={() => {
              setIsMapReady(true);
              console.log("Map is ready");
            }}
            region={{
              latitude: userLocation?.latitude || INITIAL_REGION.latitude,
              longitude: userLocation?.longitude || INITIAL_REGION.longitude,
              // latitudeDelta: 0.0922,
              // longitudeDelta: 0.0421,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >

            {destination && userLocation?.latitude && userLocation?.longitude && routeVisible && (
              <MapViewDirections
                origin={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude
                }}
                destination={destination.description}
                apikey={GOOGLE_MAPS_PLACES_LEGACY}
                strokeWidth={5}
                strokeColor={Colors.light.themeColorDarker}
              />
            )}
            {destination?.location && userLocation && routeVisible && (
              <Marker
                coordinate={{
                  latitude: destination.location.lat,
                  longitude: destination.location.lng,
                }}
                title='Destination'
                description={destination.description}
                identifier='destination'
                pinColor='blue'
              />
            )}
            {userLocation && destination && routeVisible && (
              <Marker
                coordinate={{
                  latitude: userLocation?.latitude,
                  longitude: userLocation?.longitude,
                }}
                title='Origin'
                identifier='origin'
                pinColor='blue'
              />
            )}
            {stationVisible && routeStops.map((rs) =>
              <Marker coordinate={{
                latitude: rs.fromCoords.lat,
                longitude: rs.fromCoords.lng
              }}
                key={rs.from}
                identifier='departure'
                title={`Departure number ${routeStops.indexOf(rs) + 1}`}
                description={rs.from}
              >
                <Image
                  source={require(`../../../assets/images/busiconPS.png`)}
                  style={{ width: 65, height: 65 }}

                />
              </Marker>
            )}
            {stationVisible && routeStops.map((rs) =>
              <Marker coordinate={{
                latitude: rs.toCoords.lat,
                longitude: rs.toCoords.lng
              }}
                key={rs.to}
                identifier='arrival'
                title={`Destination number ${routeStops.indexOf(rs) + 1}`}
                description={rs.to}
              >
                <Image
                  source={require(`../../../assets/images/busiconPS.png`)}
                  style={{ width: 65, height: 65 }}

                />
              </Marker>

            )}

            {stationVisible && routeStops.length > 0 && routeStops.map((rs, index) => (
              <MapViewDirections
                key={index}
                origin={{
                  latitude: rs.fromCoords.lat,
                  longitude: rs.fromCoords.lng,
                }}
                destination={{
                  latitude: rs.toCoords.lat,
                  longitude: rs.toCoords.lng,
                }}
                apikey={GOOGLE_MAPS_PLACES_LEGACY}
                strokeWidth={5}
                strokeColor={routeIndex === index ? Colors.light.themeColorDarker : 'gray'}
              />
            ))}

            {hazardMarkers.map((hazard) => (
              <Marker
                key={hazard.id}
                coordinate={{ latitude: hazard.latitude, longitude: hazard.longitude }}
                title={hazard.label}
                description={`Reported at ${new Date(hazard.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              >
                {hazard.icon === '🚗💥' && (
                  <Image
                    source={require(`../../../assets/images/accident.png`)}
                    style={{ width: 70, height: 70 }}
                    resizeMode='center'
                  />
                )}
                {hazard.icon === '🚦' && (
                  <Image
                    source={require(`../../../assets/images/trafficjam.png`)}
                    style={{ width: 80, height: 80 }}
                    resizeMode='center'
                  />
                )}
                {hazard.icon === '🚧' && (
                  <Image
                    source={require(`../../../assets/images/roadblock.png`)}
                    style={{ width: 80, height: 80 }}
                    resizeMode='center'
                  />
                )}
                {hazard.icon === '👮' && (
                  <Image
                    source={require(`../../../assets/images/inspector.png`)}
                    style={{ width: 80, height: 80 }}
                    resizeMode='center'
                  />
                )}
              </Marker>
            ))}
          </MapView>
          {/* SEARCH BUTTON */}
          {searchVisible && (
            <TouchableOpacity onPress={handleSearchPress} style={{ ...styles.inputContainer, backgroundColor: dark ? 'black' : 'white' }}>
              <Feather name='search' size={24} color={'#9A9A9A'} style={styles.inputIcon} />
              <TextInput editable={false} style={{ ...styles.textInput, color: dark ? 'white' : 'black' }} placeholder='Where do you want to go?' placeholderTextColor={dark ? 'white' : 'black'} />
            </TouchableOpacity>
          )}
          {/* BUS NAVIGATION */}
          {routeStops.length > 0 && busNavVisible && (
            <BusNavigation multiple={multipleStations} onDecrease={handleRouteIndexDecrease} onIncrease={handleRouteIndexIncrease} station={routeStops} routeIndex={routeIndex} onCancel={() => { setBusNavVisible(false); setTransportModalVisible(true); setStationVisible(false); setRouteVisible(true); }} />
          )}

          {/* MY LOCATION BUTTON */}
          <TouchableOpacity style={styles.myLocationButton} onPress={handleMyLocationPress}>
            <Feather name="navigation" size={20} color="white" />
          </TouchableOpacity>

          {/* FAKE MARKER */}
          {displayMarker && (
            <View style={{...styles.fakeMarkerContainer, top: fakeMarkerShadow ? '49%' : '50%'}}>
              {fakeMarkerShadow && (
                <Image style={styles.fakeMarker} source={require('../../../assets/images/pin2shadow.png')} />
              )}
              {!fakeMarkerShadow && (
                <Image style={styles.fakeMarker} source={require('../../../assets/images/pin2.png')} />
              )}
            </View>
          )}


          {/* HAZARD BUTTON */}
          <TouchableOpacity
            style={[
              styles.HazardButton,
              { backgroundColor: dark ? "black" : "white" }
            ]}
            onPress={handleHazardPanelButton}
          >
            <Feather name="alert-triangle" size={24} color="#eed202" />
          </TouchableOpacity>


          {/* Autocomplete Modal */}
          <Modal animationType="fade" transparent={false} visible={isFocused} onRequestClose={() => setIsFocused(false)}>
            <View style={{ flex: 1, backgroundColor: dark ? 'black' : 'white' }}>
              {/* <Feather name='search' size={24} color={'#9A9A9A'} style={styles.inputIcon} /> */}
              <GooglePlacesAutocomplete
                ref={searchRef}
                placeholder="Where do you want to go?"
                fetchDetails={true}
                nearbyPlacesAPI="GooglePlacesSearch"
                renderRightButton ={() => (
                  <TouchableOpacity
                    onPress={() => {
                      setDisplayMarker(true);
                      setIsFocused(false);
                      setPinpointModalVisible(true);
                      setSearchVisible(false);
                    }}
                    style={{
                      height: 60,
                      justifyContent: 'center',
                      alignItems: 'flex-end',
                      left: '4%',
                    }}
                  >
                      <Image style={{width: 40, height: 40}} source={require('../../../assets/images/pinicon.png')} />
                  </TouchableOpacity>
                  )}
                onPress={(data, details = null) => {
                  // console.warn(details?.geometry.location);
                  if (!details || !details.geometry) return;
                  dispatch(
                    setDestination({
                      location: details.geometry.location,
                      description: data.description,
                    }))
                  setRouteVisible(true);
                  openTransportModal();
                  setSearchVisible(false);
                  useNewSearch({ latitude: details.geometry.location.lat, longitude: details.geometry.location.lng, searchText: data.description });
                }}
                query={{
                  key: GOOGLE_MAPS_PLACES_LEGACY,
                  language: 'en',
                  location: userLocation
                    ? `${userLocation.latitude},${userLocation.longitude}`
                    : undefined,
                  radius: 20000, // meters
                }}
                onFail={error => console.error(error)}
                styles={{
                  container: styles.topSearch,
                  textInput: [
                    //styles.textInput,
                    isFocused && styles.searchInputFocused,
                    dark && styles.searchInputDark
                  ],
                  listView: {
                    backgroundColor: dark ? 'black' : 'white',
                    zIndex: 999,
                    position: 'absolute',
                    top: 60,
                    borderRadius: 4,
                  },
                  row: {
                    backgroundColor: dark ? 'black' : '#fff',
                    padding: 13,
                    height: 50,
                    flexDirection: 'row',
                  },
                  description: { color: dark ? 'white' : 'black', fontSize: 16, }

                }}
                textInputProps={{
                  autoFocus: true,
                  onFocus: () => { setIsFocused(true); setRecentVisible(true) },
                  onBlur: () => { setIsFocused(false); setRecentVisible(true) },
                  placeholderTextColor: dark ? 'white' : 'black',
                  onChangeText: (text) => { text === '' ? setRecentVisible(true) : setRecentVisible(false) },
                }}
                debounce={300}
                enablePoweredByContainer={false}
              />
              {recentVisible && (
                <FlatList
                  data={searches}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => <RecentSearch onPress={handleRecentSearchPress} searchRef={searchRef} userSearch={item} />}
                  contentContainerStyle={{ gap: 5 }}
                  style={{ position: "relative", top: 170, left: 25 }}
                  ItemSeparatorComponent={() => <Divider />}
                />
              )}
            </View>
          </Modal>

          {/* Hazard Selection Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { backgroundColor: dark ? "black" : "white" }]}>
                <Text style={[styles.modalTitle, { color: dark ? "white" : "black" }]}>
                  Select a Hazard
                </Text>
                <View style={styles.hazardGrid}>
                  {hazards.map((hazard) => (
                    <TouchableOpacity
                      key={hazard.id}
                      style={[styles.hazardOption, { backgroundColor: dark ? "#1c1c1c" : "#f9f9f9" }]}
                      onPress={() => handleSelectHazard(hazard)}
                    >
                    {hazard.label === "Traffic Jam" && (
                      <Image source={require('../../../assets/images/jam.png')} style={styles.hazardLogo} />
                    )}
                    {hazard.label === "Roadblock" && (
                      <Image source={require('../../../assets/images/roadblocklogo.png')} style={styles.hazardLogo} />
                    )}
                    {hazard.label === "Ticket inspectors" && (
                      <Image source={require('../../../assets/images/inspectorlogo.png')} style={styles.hazardLogo} />
                    )}
                    {hazard.label === "Accident" && (
                      <Image source={require('../../../assets/images/accidentlogo.png')} style={styles.hazardLogo} />
                    )}
                      {/* <Text style={styles.hazardIcon}>{hazard.icon}</Text> */}
                      <Text style={[styles.hazardLabel, { color: dark ? "white" : "black" }]}>{hazard.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          {/* Pinpoint selection menu */}
          {pinpointModalVisible && (
            <View style={{...styles.pinPointMenu, backgroundColor: dark ? 'black' : 'white'}}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
                  <Text style={{fontWeight: '500', color: dark ? 'white' : 'black', fontSize: 25}}>Confirm destination</Text>
                  <TouchableOpacity onPress={() => {setPinpointModalVisible(false); setSearchVisible(true); setDisplayMarker(false);}}>
                    <Feather name='x-circle' size={25} color={dark ? 'white' : 'black'} />
                  </TouchableOpacity>
                </View>
                  <Text style={{fontWeight: '400', color: dark ? 'white' : 'black', fontSize: 20}}>{pinpointDetails}</Text>
                  <TouchableOpacity style={styles.confirmButtonPin} onPress={handleConfirmPinpoint}>
                    <Text style={styles.cancelText}>Confirm</Text>
                  </TouchableOpacity>
            </View>
          )}

          {/* Transport Selection Panel (Replaces Modal) */}
          {transportModalVisible && (
            <View style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              backgroundColor: dark ? 'black' : 'white',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 20,
              elevation: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.2,
              shadowRadius: 8
            }}>
              <Text style={[styles.modalTitle, { color: dark ? "white" : "black" }]}>
                Select Your Ride
              </Text>

              {/* Bus Option */}
              <TouchableOpacity
                style={[styles.rideOption, { backgroundColor: dark ? "#1c1c1c" : "#f9f9f9" }]}
                onPress={() => handleBusSelection()}
              >
                <View style={styles.rideDetails}>
                  <Text style={[styles.rideIcon, { color: dark ? "white" : "black" }]}>🚌</Text>
                  <View>
                    <Text style={[styles.rideTitle, { color: dark ? "white" : "black" }]}>Transit</Text>
                    <Text style={[styles.rideSubtitle, { color: dark ? "#ccc" : "#555" }]}>
                      Estimated time: {estimatedBus} mins
                    </Text>
                  </View>
                </View>
                <Text style={[styles.ridePrice, { color: dark ? "white" : "black" }]}>{calculateBusPrice()} RON</Text>
              </TouchableOpacity>

              {/* Uber Option */}
              <TouchableOpacity
                style={[styles.rideOption, { backgroundColor: dark ? "#1c1c1c" : "#f9f9f9" }]}
                onPress={() => {
                  //handleTransportSelection();
                  openUber();
                }}
              >
                <View style={styles.rideDetails}>
                  <Text style={[styles.rideIcon, { color: dark ? "white" : "black" }]}>🚗</Text>
                  <View>
                    <Text style={[styles.rideTitle, { color: dark ? "white" : "black" }]}>Uber</Text>
                    <Text style={[styles.rideSubtitle, { color: dark ? "#ccc" : "#555" }]}>
                      Estimated time: {rideInfo?.RealTime?.googleDuration ?? "N/A"} mins
                    </Text>
                  </View>
                </View>
                <Text style={[styles.ridePrice, { color: dark ? "white" : "black" }]}>
                  {rideInfo?.Uber?.price ?? "N/A"} RON
                </Text>
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelTransportSelection}>
                <Text style={styles.cancelText}>❌ Cancel</Text>
              </TouchableOpacity>
            </View>
          )}


          {/* Elsewhere */}
          {!hasPermission && (
            <Text style={styles.permissionText}>
              Location Permission Required. Please allow location access to view the map.
            </Text>
          )}


        </>
      ) : (
        <Text style={styles.permissionText}>Location Permission Required. Please allow location access to view the map.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topSearch: {
    position: "absolute",
    top: 90,
    width: "85%",
    zIndex: 5,
    alignSelf: "center",
  },
  searchInputFocused: {
    borderWidth: 2,
    borderColor: Colors.light.themeColorDarker,
    height: 60,
    borderRadius: 20,
    paddingLeft: 25,
    backgroundColor: "white",

    width: '100%',
  },
  searchInput: {
    borderWidth: 2,
    borderColor: "gray",
    height: 60,
    borderRadius: 25,
    paddingLeft: 25,
    backgroundColor: "white",
  },
  inputContainer: {
    position: "absolute",
    flexDirection: 'row',
    borderRadius: 20,
    marginHorizontal: 20,
    marginVertical: 90,
    alignItems: 'center',
    height: 60,
    width: '90%',
    zIndex: 10,
    elevation: 15,
    shadowRadius: 5,
    shadowOpacity: 2,
  },
  inputIcon: {
    marginLeft: 15,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  cancelButton: {
    backgroundColor: "#ff4d4d",
    padding: 15,
    width: "100%",
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
    bottom: 80
  },
  optionText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  timeText: {
    fontSize: 15,
  },
  priceText: {
    fontSize: 15,
    fontWeight: "bold",
  },
  optionButton: {
    backgroundColor: "#eee",
    padding: 10,
    width: "100%",
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 5,
  },
  hazardButton: {
    backgroundColor: "#eee",
    padding: 15,
    width: "90%",
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 5,
  },
  searchInputDark: {
    backgroundColor: "black",
    color: "white",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  permissionText: {
    textAlign: "center",
    padding: 20,
    fontSize: 16,
  },
  myLocationButton: {
    position: "absolute",
    bottom: 180,
    right: 35,
    backgroundColor: Colors.light.themeColorDarker,
    borderRadius: 60,
    padding: 20,
    elevation: 10,
    shadowOpacity: 5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
  },
  HazardButton: {
    position: "absolute",
    bottom: 180,
    left: 35,
    borderRadius: 60,
    padding: 20,
    elevation: 10,
    shadowOpacity: 5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
  },
  
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    padding: 20,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    width: "100%",
    height: '53%',
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  hazardLogo:{
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  hazardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  hazardOption: {
    width: "48%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginBottom: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  hazardIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  hazardLabel: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  hazardButtonOptions: {
    padding: 12,
    marginVertical: 5,
    backgroundColor: "#ddd",
    borderRadius: 15,
    alignItems: "center",
    alignSelf: "stretch",
    height: 60,
  },
  hazardText: {
    fontSize: 16
  },
  closeButton: {
    marginTop: 0,
    padding: 10,
    backgroundColor: "#ff4d4d",
    borderRadius: 10,
    alignItems: "center"
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold"
  },
  circularIcon: {
    width: 60, // Equal width and height
    height: 60,
    borderRadius: 30, // Half of the width/height to make it circular
    justifyContent: "center", // Center the content horizontally
    alignItems: "center", // Center the content vertically
    backgroundColor: "#f0f0f0", // Background color for the circle
    elevation: 5, // Shadow for Android
    shadowColor: "#000", // Shadow for iOS
    shadowOffset: { width: 0, height: 2 }, // Shadow offset
    shadowOpacity: 0.2, // Shadow opacity
    shadowRadius: 4, // Shadow radius
  },
  circularIconDark: {
    backgroundColor: "#1c1c1c", // Dark mode background color
  },
  rideOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  rideDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  rideIcon: {
    fontSize: 30,
    marginRight: 15,
  },
  rideTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  rideSubtitle: {
    fontSize: 14,
  },
  ridePrice: {
    fontSize: 16,
    fontWeight: "bold",
  },
  busNavContainer: {
    position: "absolute",
    top: 200,
    marginHorizontal: 20,
    marginVertical: 90,
    alignItems: 'center',
    width: '90%',
    zIndex: 10,
    elevation: 15,
    shadowRadius: 10,
  },
  fakeMarker:{
    height: 70,
    width: 70,
    zIndex: 501,
  },
  fakeMarkerContainer:{
    top: '50%',
    left:'50%',
    marginLeft: -24,
    marginTop: -48,
    zIndex: 50,
    position: 'absolute'
  },
  pinPointMenu: {
      position: 'absolute',
      bottom: 40,
      height: 210,
      left: 10,
      right: 10,
      zIndex: 50,
      borderRadius: 20,
      padding: 20,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.2,
      shadowRadius: 8
  },
  confirmButtonPin: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    right: 20,
    marginTop: 0,
    padding: 10,
    backgroundColor: Colors.light.themeColorDarker,
    borderRadius: 15,
    alignItems: "center"
  },
});

function setRideInfo(arg0: {
  Bus: { price: number; time: number; }; Uber: { price: string; time: number; }; RealTime: {
    googleDuration: number; // Actual Google-estimated travel time
    distance: number;
  };
}) {
  throw new Error('Function not implemented.');
}

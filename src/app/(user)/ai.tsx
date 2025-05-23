import React, { useState, useEffect, useRef } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Animated, Easing } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { GOOGLE_MAPS_PLACES_LEGACY } from "@env";
import { useGetPoints } from '@/api/profile';
import * as Location from 'expo-location';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

export default function AI() {
    const [input, setInput] = useState('');
    const { dark } = useTheme();
    const userLocation = useSelector((state: any) => state.nav.userLocation);
    const destination = useSelector((state: any) => state.nav.destination);
    // Define Stop type or replace with a general type if unknown
    type Stop = { name?: string; latitude?: number; longitude?: number }; // Adjust fields as needed
    const [routeStops, setRouteStops] = useState<Stop[]>([]);
    const [chat, setChat] = useState<{ sender: string; text: string }[]>([]);
    const [destinationInput, setDestinationInput] = useState("");
    const [destinationCoords, setDestinationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const dispatch = useDispatch();
    //const nextBadgePoints = useSelector((state: any) => state.user?.nextBadgePoints ?? 0);
    const { data: userPoints = 0, isLoading: pointsLoading, error: pointsError } = useGetPoints();
    const [rideInfo, setRideInfo] = useState<{
        Bus: { price: number; time: number };
        Uber: { price: string; time: number };
        RealTime: { googleDuration: number; distance: number };
    } | null>(null);
    const [messages, setMessages] = useState([
        {
            role: 'system',
            content: `You are a helpful travel assistant. Provide concise and friendly suggestions based on route and price.
Format: 
- Best option: Bus/Uber
- Time: [value]
- Price: [value] in RON not $
- Additional tip: ...`,
        }
    ]);
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    }, [chat]);


    useEffect(() => {
        if (typeof userPoints === 'number') {
            dispatch({ type: 'SET_USER_POINTS', payload: userPoints });
        }
    }, [userPoints]);

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
        if (loading) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 500,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.ease),
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.ease),
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [loading]);

    const calculateBusPrice = () => {
        const numberOfBuses = routeStops.length;
        return numberOfBuses * 3;
    };

    // Define RouteStation type to match the structure returned in fetchTransitRoute
    type RouteStation = {
        from: string;
        to: string;
        fromCoords: { lat: number; lng: number };
        toCoords: { lat: number; lng: number };
        line: string;
        vehicle: string;
        departureTime?: string;
        arrivalTime?: string;
        headsign?: string;
    };

    const fetchTransitRoute = async (
        isReroute = false,
        fromCoords: { latitude: number; longitude: number },
        toCoords: { latitude: number; longitude: number }
    ) => {
        console.log("fetchTransitRoute called with:", fromCoords, toCoords);
        try {
            const origin = `${fromCoords.latitude},${fromCoords.longitude}`;
            const destination = `${toCoords.latitude},${toCoords.longitude}`;
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=transit&key=${GOOGLE_MAPS_PLACES_LEGACY}`
            );
            const data = await response.json();

            if (!data.routes || data.routes.length === 0) {
                console.warn("No transit routes found.");
                return [];
            }

            const legs = data.routes[0]?.legs;
            const steps = legs?.[0]?.steps ?? [];

            const transitSteps = steps.filter(
                (step: any) =>
                    step?.travel_mode?.toUpperCase() === "TRANSIT" && step?.transit_details
            );

            return transitSteps.map((step: any) => ({
                from: step.transit_details?.departure_stop?.name || "Unknown stop",
                to: step.transit_details?.arrival_stop?.name || "Unknown stop",
                fromCoords: step.transit_details?.departure_stop?.location || { lat: 0, lng: 0 },
                toCoords: step.transit_details?.arrival_stop?.location || { lat: 0, lng: 0 },
                line: step.transit_details?.line?.short_name || "N/A",
                vehicle: step.transit_details?.line?.vehicle?.type || "Transit",
                departureTime: step.transit_details?.departure_time?.text,
                arrivalTime: step.transit_details?.arrival_time?.text,
                headsign: step.transit_details?.headsign || "",
            }));
        } catch (error) {
            console.error("Transit route fetch error:", error);
            return [];
        }
    };

    type TransitStep = {
        from: string;
        to: string;
        fromCoords: { lat: number; lng: number };
        toCoords: { lat: number; lng: number };
        line: string;
        vehicle: string;
        departureTime?: string;
        arrivalTime?: string;
        headsign?: string;
    };

    const getTransitSummary = (stations: TransitStep[]) => {
        if (!stations || stations.length === 0) return "No transit route available.";

        // For example: "Take BUS 42 from Stop A to Stop B, then SUBWAY M7 from Stop B to Stop C"
        return stations.map((step, i) => {
            return `${step.vehicle.toUpperCase()} ${step.line} from ${step.from} to ${step.to}`;
        }).join(", then ");
    };


    // Helper to geocode an address string to coordinates using Google Maps API
    const geocodeAddress = async (address: string) => {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_PLACES_LEGACY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.status === "OK" && data.results.length > 0) {
            const { lat, lng } = data.results[0].geometry.location;
            return { latitude: lat, longitude: lng };
        }
        throw new Error("Could not geocode address");
    };

    // Dummy fetchRideInfo implementation (replace with real API call as needed)
    const fetchRideInfo = async (
        from: { latitude: number; longitude: number } | null,
        to: { latitude: number; longitude: number }
    ) => {
        if (!from || !to) return null;

        const origin = `${from.latitude},${from.longitude}`;
        const destination = `${to.latitude},${to.longitude}`;
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${GOOGLE_MAPS_PLACES_LEGACY}`
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

            return {
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
            };
        } else {
            throw new Error("No routes found in directions response");
        }
    };

    const handleDestinationSubmit = async () => {
        try {
            console.log("📍 Submitting destination:", destinationInput);
            const coords = await geocodeAddress(destinationInput);
            console.log("📍 Geocoded coords:", coords);
            setDestinationCoords(coords);

            const ride = await fetchRideInfo(userLocation, coords);
            console.log("🚗 Ride info:", ride);
            setRideInfo(ride);

            await sendToGPT([
                {
                    role: 'user',
                    content: `What's the best way to get to ${destinationInput}?`
                }
            ]);
        } catch (error) {
            console.error("❌ Error in handleDestinationSubmit:", error);
            setLoading(false);
        }
    };



    const sendToGPT = async (conversation: { role: string; content: string }[]) => {
        try {
            const res = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-4o',
                    messages: conversation,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${OPENAI_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return res.data.choices[0].message.content;
        } catch (err) {
            console.error("OpenAI API Error:", (err as any).response?.data || (err as any).message);
            return "⚠️ Sorry, I couldn't respond right now.";
        }
    };

    const getAddressFromCoords = async (lat: number, lng: number) => {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_PLACES_LEGACY}`;
        const res = await fetch(url);
        const data = await res.json();
        return data.results?.[0]?.formatted_address || `${lat},${lng}`;
    };

    type Badge = { name: string; points: number };

    const badges = [
        { id: 1, name: "Eco Starter", points: 100, image: require('assets/images/100points.png') },
        { id: 2, name: "Green Commuter", points: 500, image: require('assets/images/500points.png') },
        { id: 3, name: "Planet Saver", points: 1000, image: require('assets/images/plantLover.png') },
        { id: 4, name: "Eco Hero", points: 2000, image: require('assets/images/planetLover.png') },
    ];


    const getNextBadgePoints = (userPoints: number) => {
        const nextBadge = badges
            .filter((badge: Badge) => badge.points > userPoints)
            .sort((a: Badge, b: Badge) => a.points - b.points)[0];
        return nextBadge ? nextBadge.points : null; // or undefined if you prefer
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

    // Usage:
    const nextBadgePoints = getNextBadgePoints(userPoints ?? 0);


    const handleSend = async () => {
        console.log("handleSend called with input:", input);
        if (!input.trim()) return;
        setLoading(true);

        let coords = userLocation;
        if (!coords) coords = await getUserLocation();

        // Detectăm dacă e o întrebare / mesaj general de chat, nu o destinație
        const isGeneralChat =
            input.toLowerCase().startsWith("how") ||
            input.toLowerCase().startsWith("what") ||
            input.toLowerCase().startsWith("where") ||
            input.toLowerCase().startsWith("can") ||
            input.toLowerCase().startsWith("do") ||
            input.includes("?");

        if (isGeneralChat) {
            // Mesaj conversațional, fără rută
            const from = coords ? await getAddressFromCoords(coords.latitude, coords.longitude) : "unknown";
            const fromCoords = coords ? `(${coords.latitude}, ${coords.longitude})` : "";

            const contextMessage = {
                role: "system",
                content: `You are a helpful travel assistant. The user is currently at ${from} ${fromCoords}. Answer clearly and concisely.`,
            };

            const userMessage = { role: "user", content: input };
            const updatedMessages = [contextMessage, userMessage];

            setChat((prev) => [...prev, { sender: "You", text: input }]);
            setMessages(updatedMessages);
            setInput("");

            const reply = await sendToGPT(updatedMessages);
            setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
            setChat((prev) => [...prev, { sender: "Routely", text: reply }]);
            setLoading(false);
            return;
        }

        // Dacă nu e mesaj conversațional, tratăm input-ul ca destinație
        let to = destination?.description || "unknown";
        let toCoords = destinationCoords;

        // 🔍 Detectăm dacă input-ul conține un pattern de destinație
        const destinationPatterns = [
            /^to\s+(.+)/i,
            /^i want to go to\s+(.+)/i,
            /^take me to\s+(.+)/i,
            /^navigate to\s+(.+)/i,
        ];

        let matchedAddress: string | null = null;
        for (const pattern of destinationPatterns) {
            const match = input.match(pattern);
            if (match) {
                matchedAddress = match[1].trim();
                break;
            }
        }

        // fallback: dacă nu se potrivește pattern și nu e întrebare, tratăm tot ca destinație
        // Only treat as destination if it matches a pattern
        // Otherwise, treat as general chat
        if (!matchedAddress) {
            // Treat as chat message
            const from = coords ? await getAddressFromCoords(coords.latitude, coords.longitude) : "unknown";
            const fromCoords = coords ? `(${coords.latitude}, ${coords.longitude})` : "";

            const contextMessage = {
                role: "system",
                content: `You are a helpful travel assistant. The user is currently at ${from} ${fromCoords}. Answer clearly and concisely.`,
            };

            const userMessage = { role: "user", content: input };
            const updatedMessages = [contextMessage, userMessage];

            setChat((prev) => [...prev, { sender: "You", text: input }]);
            setMessages(updatedMessages);
            setInput("");

            const reply = await sendToGPT(updatedMessages);
            setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
            setChat((prev) => [...prev, { sender: "Routely", text: reply }]);
            setLoading(false);
            return;
        }

        if (matchedAddress) {
            setDestinationInput(matchedAddress);
            try {
                const coordsNew = await geocodeAddress(matchedAddress);
                setDestinationCoords(coordsNew);
                to = matchedAddress;
                toCoords = coordsNew;
            } catch (error) {
                setChat((prev) => [...prev, { sender: "Routely", text: "Sorry, I couldn't find that location." }]);
                setLoading(false);
                return;
            }
        }

        // Fetch ruta de transport (bus, uber, etc)
        let ride = rideInfo;
        if (coords && toCoords) {
            ride = await fetchRideInfo(coords, toCoords);
            setRideInfo(ride);
        }

        // Fetch ruta de transport în comun (transit)
        // Fetch ruta de transport în comun (transit) și generează descrierea traseului
        let transitSteps: TransitStep[] = [];
        if (coords && toCoords) {
            transitSteps = await fetchTransitRoute(false, coords, toCoords);
        }
        const transitDescription = getTransitSummary(transitSteps);

        const fromCoords = coords ? `(${coords.latitude}, ${coords.longitude})` : "";
        const from = coords ? await getAddressFromCoords(coords.latitude, coords.longitude) : "unknown";
        const busTime = ride?.Bus?.time ?? "N/A";
        const busPrice = ride?.Bus?.price ?? "N/A";
        const uberTime = ride?.Uber?.time ?? "N/A";
        const uberPrice = ride?.Uber?.price ?? "N/A";
        const nextBadgePoints = getNextBadgePoints(userPoints ?? 0);

        const contextMessage = {
            role: "system",
            content: `You are a helpful travel assistant. Users can get points by using the transit and helping the community by placing hazards.
User is at ${from} ${fromCoords} and wants to go to ${to}.
Transit route details: ${transitDescription}.
Bus: ${busTime} min, ${busPrice}RON.
Uber: ${uberTime} min, ${uberPrice}RON.
The user currently has ${Number(userPoints)} points and needs ${Number(nextBadgePoints) - Number(userPoints)
                } more points to reach the next badge (at ${Number(nextBadgePoints)} points).`,
        };

        const userMessage = { role: "user", content: input };
        const updatedMessages = [contextMessage, userMessage];

        setChat((prev) => [...prev, { sender: "You", text: input }]);
        setMessages(updatedMessages);
        setInput("");

        const reply = await sendToGPT(updatedMessages);
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        setChat((prev) => [...prev, { sender: "Routely", text: reply }]);
        setLoading(false);
    };



    const styles = StyleSheet.create({
        container: { flex: 1, padding: 16, paddingTop: 50, paddingBottom: 120 },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: 8,
            borderTopWidth: 0,
            borderColor: '#ccc',
            paddingBottom: 20,
        },
        input: {
            flex: 1,
            padding: 15,
            backgroundColor: 'black',
            borderRadius: 20,
            marginRight: 10,
            color:'white'
        },
        sendButton: {
            backgroundColor: '#025ef8',
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 60,
        },
        sendButtonText: {
            color: '#fff',
            fontWeight: 'bold',
        },
        userBubble: {
            alignSelf: 'flex-end',
            backgroundColor: '#025ef8',
            padding: 15,
            marginVertical: 4,
            borderRadius: 20,
            maxWidth: '80%',
            color: '#fff',
        },
        aiBubble: {
            alignSelf: 'flex-start',
            backgroundColor: '#F0F0F0',
            padding: 15,
            marginVertical: 4,
            borderRadius: 20,
            maxWidth: '80%',
        },
    });

     return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? -130 : 0} // adjust if you have a header
        >

            {/* Bot Icon at the top center */}
            <View style={{ alignItems: "center", backgroundColor: dark ? 'black' : 'white', shadowColor: "#025ef8", shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, }}>
                <Animated.View
                    style={{
                        width: 60,
                        height: 40,
                        borderRadius: 30,
                        backgroundColor: "#025ef8",
                        justifyContent: "center",
                        alignItems: "center",
                        transform: [{ scale: pulseAnim }],
                        shadowColor: "#025ef8",
                        shadowOpacity: 0.9,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: 4 },
                        marginTop: 40,
                        marginBottom: 20,
                    }}
                >
                    <Image
                        source={require('assets/images/bot.png')}
                        style={{ width: 40, height: 42, resizeMode: 'contain' }}
                    />
                </Animated.View>
            </View>

            <View style={[styles.container, { backgroundColor: dark ? '#000' : '#fff' }]}>
                <FlatList
                    ref={flatListRef}
                    data={chat}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={({ item }) => (
                        <View style={item.sender === 'You' ? styles.userBubble : styles.aiBubble}>
                            <Text style={{ color: item.sender === 'You' ? '#fff' : '#000' }}>{item.text}</Text>
                        </View>
                    )}
                    contentContainerStyle={{ paddingBottom: 50 }}
                />
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={input}
                        onChangeText={setInput}
                        placeholder="Type a destination (e.g. 'City Park Mall') or ask a question..."
                        placeholderTextColor="white"
                        onSubmitEditing={handleSend}
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading}>
                        <Text style={styles.sendButtonText}>{loading ? <ActivityIndicator color="#fff" /> : "Send"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}


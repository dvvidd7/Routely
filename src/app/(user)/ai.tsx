import React, { useState, useEffect, useRef } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
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
    const rideInfo = useSelector((state: any) => state.nav.rideInfo);
    const userLocation = useSelector((state: any) => state.nav.userLocation);
    const destination = useSelector((state: any) => state.nav.destination);
    const [chat, setChat] = useState<{ sender: string; text: string }[]>([]);
    const dispatch = useDispatch();
    //const nextBadgePoints = useSelector((state: any) => state.user?.nextBadgePoints ?? 0);
    const { data: userPoints = 0, isLoading: pointsLoading, error: pointsError } = useGetPoints();
    const [messages, setMessages] = useState([
        {
            role: 'system',
            content: `You are a helpful travel assistant. Provide concise and friendly suggestions based on route and price.
Format: 
- Best option: Bus/Uber
- Time: [value]
- Price: [value]
- Additional tip: ...`,
        }
    ]);
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

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
        if (!input.trim()) return;

        setLoading(true);

        // Always get the latest location
        let from = "unknown";
        let fromCoords = "";
        let coords = userLocation;
        if (!coords) {
            coords = await getUserLocation();
        }
        if (coords) {
            fromCoords = `(${coords.latitude}, ${coords.longitude})`;
            from = await getAddressFromCoords(coords.latitude, coords.longitude);
        }

        const to = destination?.description || "unknown";
        const busTime = rideInfo?.Bus?.time ?? "N/A";
        const busPrice = rideInfo?.Bus?.price ?? "N/A";
        const uberTime = rideInfo?.Uber?.time ?? "N/A";
        const uberPrice = rideInfo?.Uber?.price ?? "N/A";

        const contextMessage = {
            role: 'system',
            content: `You are a helpful travel assistant. Users can get points by using the transit and helping the community by placing hazards.
You know the user's current location and destination as provided below.
User is at ${from} ${fromCoords} and wants to go to ${to}.
Bus: ${busTime} min, $${busPrice}.
Uber: ${uberTime} min, $${uberPrice}.
The user currently has ${Number(userPoints)} points and needs ${Number(nextBadgePoints) - Number(userPoints)} more points to reach the next badge (at ${Number(nextBadgePoints)} points).`
        };

        const userMessage = { role: 'user', content: input };
        const updatedMessages = [
            {
                role: 'system',
                content: `You are a helpful travel assistant. Provide concise and friendly suggestions based on route, price, and user progress. Users can get points by using the transit and helping the community by placing hazards.
User is currently at ${from} ${fromCoords}, and going to ${to}.
Bus: ${busTime} min, $${busPrice}. Uber: ${uberTime} min, $${uberPrice}.
The user has ${Number(userPoints)} points and needs ${Number(nextBadgePoints) - Number(userPoints)} more to reach the next badge (${Number(nextBadgePoints)} points).`
            },
            ...messages.slice(1),
            userMessage
        ];

        console.log("Sending messages to GPT:", JSON.stringify(updatedMessages, null, 2));

        setChat(prev => [...prev, { sender: 'You', text: input }]);
        setMessages(updatedMessages);
        setInput('');

        const reply = await sendToGPT(updatedMessages);

        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        setChat(prev => [...prev, { sender: 'Route Bot', text: reply }]);
        setLoading(false);
    };

    const renderItem = ({ item }: { item: { sender: string; text: string } }) => (
        <View style={item.sender === 'You' ? styles.userBubble : styles.aiBubble}>
            <Text>{item.sender}: {item.text}</Text>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0} // adjust if you have a header
        >
            <View style={[styles.container, { backgroundColor: dark ? '#000' : '#fff' }]}>
                <FlatList
                    ref={flatListRef}
                    data={chat}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 50 }}
                />
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={input}
                        onChangeText={setInput}
                        placeholder="Say something..."
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading}>
                        <Text style={styles.sendButtonText}>{loading ? <ActivityIndicator color="#fff" /> : "Send"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

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
        backgroundColor: '#f2f2f2',
        borderRadius: 20,
        marginRight: 10,
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

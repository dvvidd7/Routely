import React, { useState, useEffect, useRef } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useSelector } from "react-redux";
import axios from "axios";
import { GOOGLE_MAPS_PLACES_LEGACY } from "@env";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

export default function AI() {
    const [input, setInput] = useState('');
    const { dark } = useTheme();
    const rideInfo = useSelector((state: any) => state.nav.rideInfo);
    const userLocation = useSelector((state: any) => state.nav.userLocation);
    const destination = useSelector((state: any) => state.nav.destination);
    const [chat, setChat] = useState<{ sender: string; text: string }[]>([]);
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

    const handleSend = async () => {
        if (!input.trim()) return;

        setLoading(true);
        let from = "unknown";
        let fromCoords = "";
        if (userLocation) {
            fromCoords = `(${userLocation.latitude}, ${userLocation.longitude})`;
            from = await getAddressFromCoords(userLocation.latitude, userLocation.longitude);
        }

        const to = destination?.description || "unknown";
        const busTime = rideInfo?.Bus?.time ?? "N/A";
        const busPrice = rideInfo?.Bus?.price ?? "N/A";
        const uberTime = rideInfo?.Uber?.time ?? "N/A";
        const uberPrice = rideInfo?.Uber?.price ?? "N/A";

        const contextMessage = {
            role: 'system',
            content: `You are a helpful travel assistant. 
You know the user's current location and destination as provided below.
User is at ${from} ${fromCoords} and wants to go to ${to}.
Bus: ${busTime} min, $${busPrice}.
Uber: ${uberTime} min, $${uberPrice}.`
        };

        const userMessage = { role: 'user', content: input };
        const updatedMessages = [messages[0], contextMessage, ...messages.slice(1), userMessage];

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
        padding: 25,
        marginVertical: 4,
        borderRadius: 40,
        maxWidth: '80%',
        color: '#fff',
    },
    aiBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#F0F0F0',
        padding: 25,
        marginVertical: 4,
        borderRadius: 40,
        maxWidth: '80%',
    },
});

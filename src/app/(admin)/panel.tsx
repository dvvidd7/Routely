import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from "react-native";
import { supabase } from "@/lib/supabase";
import { useRoute, useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";

export default function Panel({ navigation }: any) {
  const router = useRouter();
  const { dark, colors } = useTheme(); // Access the theme
  const [hazards, setHazards] = useState<
    { id: number; label: string; created_at: string; latitude: number; longitude: number; icon: string; email: string }[]
  >([]);

  useEffect(() => {
    // Function to fetch hazards initially
    const fetchHazards = async () => {
      const { data, error } = await supabase.from("hazards").select("*");
  
      if (error) {
        console.error("Error fetching hazards:", error);
        return;
      }
  
      // Filter out old hazards (e.g., older than 1 day)
      const filteredHazards = data.filter((hazard) => {
        const hazardDate = new Date(hazard.created_at);
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        return hazardDate >= oneDayAgo;
      });
  
      setHazards(filteredHazards || []);
    };

    fetchHazards();

    // Subscribe to real-time updates
    const subscription = supabase
    .channel("hazards-changes") // Unique channel name
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "hazards" },
      (payload) => {
        console.log("Change received!", payload);

        if (payload.eventType === "INSERT") {
          setHazards((prevHazards) => {
            const exists = prevHazards.some((h) => h.id === (payload.new as typeof hazards[0]).id);
            if (!exists) {
              return [...prevHazards, payload.new as typeof hazards[0]];
            }
            return prevHazards;
          });
        } else if (payload.eventType === "UPDATE") {
          setHazards((prevHazards) =>
            prevHazards.map((h) =>
              h.id === (payload.new as typeof hazards[0]).id ? (payload.new as typeof hazards[0]) : h
            )
          );
        } else if (payload.eventType === "DELETE") {
          setHazards((prevHazards) =>
            prevHazards.filter((h) => h.id !== (payload.old as typeof hazards[0]).id)
          );
        }
      }
    )
    .subscribe();

  // Cleanup on unmount
  return () => {
    supabase.removeChannel(subscription);
  };
}, []);

  return (
    <View style={[styles.container, { backgroundColor: dark ? "#0f0f0f" : "white" }]}>
      <Text style={[styles.title, { color: dark ? colors.text : "black" }]}>Reported Hazards</Text>
      {hazards.length === 0 && (
        <Text style={{fontWeight: '400', fontSize: 20, top: 40, zIndex: 5}}>No hazards reported today!</Text>
      )}
      <FlatList
        data={hazards}
        keyExtractor={(item) => item.id.toString()}
        style={{ flex: 1, marginBottom:110 }} 
        contentContainerStyle={{
          backgroundColor: dark ? "#0f0f0f" : "white",
          flexGrow: 1, 
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, { backgroundColor: dark ? "#0f0f0f" : "white" }]}
          >
            {/* <Text style={[styles.iconCell, { color: dark ? colors.text : "black" }]}>{item.icon}</Text> */}
            {item.label === "Accident" && (
                <Image style={styles.iconCell} source={require('../../../assets/images/accidentlogo.png')} />
            )}
            {item.label === "Traffic Jam" && (
                <Image style={styles.iconCell} source={require('../../../assets/images/jam.png')} />
            )}
            {item.label === "Ticket Inspectors" && (
                <Image style={styles.iconCell} source={require('../../../assets/images/inspectorlogo.png')} />
            )}
            {item.label === "Roadblock" && (
                <Image style={styles.iconCell} source={require('../../../assets/images/roadblocklogo.png')} />
            )}
            {item.label === "Noise Pollution" && (
                <Image style={styles.iconCell} source={require('../../../assets/images/speaker.png')} />
            )}
            <Text style={[styles.cell, { color: dark ? colors.text : "black" }]}>{item.label}</Text>
            <Text style={[styles.cell, { color: dark ? colors.text : "black" }]}>{new Date(item.created_at).toLocaleString()}</Text>
            <Text style={[styles.emailCell, { color: dark ? colors.text : "black" }]}>{item.email}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 60,
    marginBottom: 10,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    alignItems: "center",
  },
  iconCell: {
    flex: 0.2,
    textAlign: "center",
    width: 50,
    height: 40,
  },
  cell: {
    flex: 0.5,
    textAlign: 'center',
    fontSize: 15,
  },
  emailCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
  }
});
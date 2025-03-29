import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { supabase } from "@/lib/supabase";

export default function Panel({ navigation }: any) {
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

      setHazards(data || []);
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

          // Handle different events (INSERT, UPDATE, DELETE)
          if (payload.eventType === "INSERT") {
            setHazards((prevHazards) => [...prevHazards, payload.new as { id: number; label: string; created_at: string; latitude: number; longitude: number; icon: string; email: string }]);
          } else if (payload.eventType === "UPDATE") {
            setHazards((prevHazards) =>
              prevHazards.map((h) => (h.id === payload.new.id ? payload.new as { id: number; label: string; created_at: string; latitude: number; longitude: number; icon: string; email: string } : h))
            );
          } else if (payload.eventType === "DELETE") {
            setHazards((prevHazards) => prevHazards.filter((h) => h.id !== payload.old.id));
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
    <View style={styles.container}>
      <Text style={styles.title}>Reported Hazards</Text>
      <FlatList
        data={hazards}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              navigation.navigate("MapScreen", {
                latitude: item.latitude,
                longitude: item.longitude,
              })
            }
          >
            <Text style={styles.cell}>{item.icon}</Text>
            <Text style={styles.cell}>{item.label}</Text>
            <Text style={styles.cell}>{new Date(item.created_at).toLocaleString()}</Text>
            <Text style={styles.cell}>{item.email}</Text>
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
    backgroundColor: "white",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
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
  cell: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
  },
});

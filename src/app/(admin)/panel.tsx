import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
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
    <View style={[styles.container, { backgroundColor: dark ? "#0f0f0f" : "white" }]}>
      <Text style={[styles.title, { color: dark ? colors.text : "black" }]}>Reported Hazards</Text>
      <FlatList
        data={hazards}
        keyExtractor={(item) => item.id.toString()}
        style={{ flex: 1 }} 
        contentContainerStyle={{
          backgroundColor: dark ? "#0f0f0f" : "white",
          flexGrow: 1, 
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, { backgroundColor: dark ? "#0f0f0f" : "white" }]}
          >
            <Text style={[styles.cell, { color: dark ? colors.text : "black" }]}>{item.icon}</Text>
            <Text style={[styles.cell, { color: dark ? colors.text : "black" }]}>{item.label}</Text>
            <Text style={[styles.cell, { color: dark ? colors.text : "black" }]}>{new Date(item.created_at).toLocaleString()}</Text>
            <Text style={[styles.cell, { color: dark ? colors.text : "black" }]}>{item.email}</Text>
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
    marginTop: 55,
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
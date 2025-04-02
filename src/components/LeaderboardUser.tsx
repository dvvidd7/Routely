import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
type User = {
    id: string,
    email: string,
    points: number,
    rank: string,
}
export default function LeaderboardUser (userN:string){
  return (
    <View style={styles.container}>
      <Text>{userN}</Text>
    </View>
  )
}
const styles = StyleSheet.create({
    container: {
        backgroundColor: 'gainsboro',
        borderRadius: 10,
        padding: 10,
        width: '90%',
    },
})
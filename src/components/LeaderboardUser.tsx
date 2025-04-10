import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { useTheme } from '@react-navigation/native'
type User = {
  id: string,
  username: string,
  points: number,
}
type Profile = {
  userN: User
  index: number
}
type IndexNumber = {
  index: number
}
export default function LeaderboardUser ({userN, index}:Profile){
  const {dark} = useTheme();
  if(index == 0 || index == 1 || index == 2){
    return (
      <View style={{...styles.container, backgroundColor: dark ? '#262626' : '#e6e6e6'}}>
      <View style={styles.user}>
        <Text style={{...styles.userText, color: dark ? '#e6e6e6' : 'black'}}><Text style={{color: index == 0 ? 'gold' : (index == 1 ? 'silver' : (index == 2) ? '#CD7F32' : 'gray')}}>#{index+1} </Text>{userN.username}</Text>
        {/* <Text>Rank</Text> */}
      </View>
      <Text style={styles.points}>{userN.points}</Text>
    </View>
    )
  }
  return (
      <View style={{...styles.container, backgroundColor: dark ? '#262626' : '#e6e6e6'}}>
      <View style={styles.user}>
        <Text style={{...styles.userText, color: dark ? '#e6e6e6' : 'black'}}><Text style={{color: dark ? 'white' : 'black'}}>#{index+1} </Text>{userN.username}</Text>
        {/* <Text>Rank</Text> */}
      </View>
      <Text style={styles.points}>{userN.points}</Text>
    </View>
  )
}
const styles = StyleSheet.create({
    container: {
        borderRadius: 10,
        padding: 10,
        width: '95%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 10,
    },
    user:{

    },
    userText:{
      fontWeight: '500',
      fontSize: 20,
    },
    points: {
      fontSize: 20,
      fontWeight: '600',
      color: '#0384fc',
    },

})
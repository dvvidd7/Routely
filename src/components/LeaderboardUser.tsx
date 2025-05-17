import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
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
export default function LeaderboardUser({ userN, index, badge }: Profile & { badge?: { name: string; image: any } }) {
  const { dark } = useTheme();
  const [pressed, setPressed] = useState(false);

  const rankColor = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? '#CD7F32' : 'gray';

  return (
    <View style={{ ...styles.container, backgroundColor: dark ? '#262626' : '#e6e6e6' }}>
      <View style={styles.user}>
        <Text style={{ ...styles.userText, color: dark ? '#e6e6e6' : 'black' }}>
          <Text style={{ color: rankColor }}>#{index + 1} </Text>
          {userN.username}
        </Text>
        {badge && (
          <TouchableOpacity
            style={styles.badgeContainer}
            onPress={() => setPressed(!pressed)} // Toggle the pressed state
          >
            <Image source={badge.image} style={styles.badgeImage} />
            {pressed && (
              <Text style={{ color: dark ? '#e6e6e6' : 'black', fontSize: 12, marginTop: 5 , bottom:1, right:2}}>
                {badge.name}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.points}>{userN.points}</Text>
    </View>
  );
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
  user: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userText: {
    fontWeight: '500',
    fontSize: 20,
  },
  points: {
    fontSize: 20,
    fontWeight: '600',
    color: '#025ef8',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  badgeImage: {
    width: 30,
    height: 30,
    marginRight: 5,
  },

})
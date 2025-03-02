import { View, Text, StyleSheet, Image, TextInput } from 'react-native';
import React from 'react';
import { Stack } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function SignIn() {
  return (
    <View style={styles.container}>
      <Stack.Screen name='sign-in' options={{title:"Sign-In"}} />
      <View style={styles.topImageContainer}>
        <Image source={require('../../../assets/images/topVector.png')} style={styles.topImage} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Sign In</Text>
      </View>

      <View style={styles.inputContainer}>
        <FontAwesome name='user' size={24} color={'#9A9A9A'} />
        <TextInput style={styles.textInput} placeholder='E-mail' />
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        flex:1,
        backgroundColor: 'white',
    },
    topImageContainer:{

    },
    topImage:{
        width:'100%',
        height: 120,
    },
    bottomImageContainer:{

    },
    bottomImage:{

    },
    textContainer:{
        //borderWidth: 2,
    },
    title:{
        fontSize: 40,
        fontWeight: 500,
        textAlign: 'center',
        color: 'black',
    },
    inputContainer:{

    },
    textInput:{

    },
})
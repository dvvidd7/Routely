import { View, Text, StyleSheet, Image, TextInput, Pressable, Alert, ImageBackground, TouchableOpacity } from 'react-native';
import React from 'react';
import { Stack } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';
import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';
import { isLoading } from 'expo-font';

//Social media sign up nu merge apasat (pressable sau ceva)

export default function SignIn() {
  const [hidden, setHidden] = useState<boolean>(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState('');
  const router = useRouter();
  const { dark } = useTheme();
  const [loading, setLoading] = useState(false);
  const resetFields = () => {
    setEmail('');
    setPassword('');
  };
  // const onSignUp = () => {
  //     console.log(`Account created: ${email} ${password} `);
  //     resetFields();
  // };
  async function signUpWithEmail() {
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(true);

    if (error) Alert.alert(error.message);
    setLoading(false);
    resetFields();
  }

  return (

    <View style={dark ? styles.containerDark : styles.container}>
      <Stack.Screen name='sign-in' options={{ title: "Sign-Up", headerShown: false }} />
      <View style={{ ...styles.topImageContainer, opacity: dark ? 0.5 : 1 }}>
        <Image source={require('../../../assets/images/topVector.png')} style={styles.topImage} />
      </View>
      <View style={styles.textContainer}>
        <Text style={{ ...styles.title, color: dark ? 'white' : 'black' }}>Create account</Text>
      </View>

      <View style={{ ...styles.inputContainer, backgroundColor: dark ? '#000' : 'white', borderColor: dark ? '#807f7f' : 'gainsboro', borderWidth: dark ? 2 : 0 }}>
        <FontAwesome name='envelope' size={24} color={'#9A9A9A'} style={styles.inputIcon} />
        <TextInput cursorColor={dark ? 'white' : 'black'} style={{ ...styles.textInput, color: dark ? 'white' : 'black' }} value={email} onChangeText={setEmail} placeholder='E-mail' placeholderTextColor={'gainsboro'} />
      </View>

      <View style={{ ...styles.inputContainer, backgroundColor: dark ? '#000' : 'white', borderColor: dark ? '#807f7f' : 'gainsboro', borderWidth: dark ? 2 : 0 }}>
        <FontAwesome name='lock' size={24} color={'#9A9A9A'} style={styles.inputIcon} />
        <TextInput cursorColor={dark ? 'white' : 'black'} style={{ ...styles.textInput, color: dark ? 'white' : 'black' }} value={password} onChangeText={setPassword} placeholder='Password' placeholderTextColor={'gainsboro'} secureTextEntry={hidden ? true : false} />
        <Pressable onPress={() => { hidden ? setHidden(false) : setHidden(true) }}>
          <FontAwesome name={hidden ? 'eye' : 'eye-slash'} size={24} color={'#9A9A9A'} style={styles.hiddenIcon} />
        </Pressable>
      </View>

      <View style={styles.signInButtonContainer}>
        <Text style={{ ...styles.signIn, color: dark ? 'white' : 'black' }}>Create account</Text>
        <Pressable onPress={signUpWithEmail} disabled={loading} style={({ pressed }) => [styles.signInButton, { opacity: pressed ? 0.5 : 1.0 }]}>
          <AntDesign name='arrowright' size={24} color={'white'} style={{ alignSelf: 'center' }} />
        </Pressable>
      </View>
      <Text style={{ ...styles.footerText, color: dark ? 'white' : 'black' }}>Already have an account? <Text style={{ color: '#0399fc', textDecorationLine: 'underline' }} onPress={() => { router.navigate('/sign-in') }}>Log in</Text> </Text>

      <View style={styles.leftImageContainer}>
        <ImageBackground source={require('../../../assets/images/bottomVector.png')} style={styles.leftImage} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    position: 'relative',
  },
  containerDark: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    position: 'relative',
  },
  topImageContainer: {

  },
  topImage: {
    width: '100%',
    height: 120,
  },
  textContainer: {
  },
  title: {
    fontSize: 40,
    fontWeight: 500,
    textAlign: 'center',
    color: 'black',
    marginVertical: 30,
    marginBottom: 70,
  },
  inputContainer: {
    flexDirection: 'row',
    borderRadius: 20,
    marginHorizontal: 20,
    marginVertical: 20,
    alignItems: 'center',
    height: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 20,
  },
  inputIcon: {
    marginLeft: 15,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
  },
  hiddenIcon: {
    alignSelf: 'flex-end',
    marginHorizontal: 15,
  },
  forgotPassword: {
    fontWeight: 500,
    textAlign: 'right',
    fontSize: 15,
    width: '90%',
    color: '#9A9A9A',
  },
  signInButtonContainer: {
    flexDirection: 'row',
    marginTop: 60,
    width: '97%',
    justifyContent: 'flex-end',
  },
  signInButton: {
    backgroundColor: '#0399fc',
    height: 34,
    width: 56,
    //aspectRatio: 1,
    alignContent: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginHorizontal: 15,
  },
  signIn: {
    fontWeight: 500,
    fontSize: 25,
  },
  footerText: {
    marginTop: 150,
    fontSize: 17,
    textAlign: 'center',
    fontWeight: 400,
  },
  leftImageContainer: {
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
  leftImage: {
    height: 300,
    width: 250,
  }
})
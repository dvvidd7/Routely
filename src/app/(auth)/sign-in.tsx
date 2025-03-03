import { View, Text, StyleSheet, Image, TextInput, Pressable, Alert, ImageBackground } from 'react-native';
import React from 'react';
import { Stack } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';
import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';

//SCHIMB ECRANUL CU ROUTER NU CU LINK LA CREATE ACCOUNT!

export default function SignIn() {
    const [hidden, setHidden] = useState<boolean>(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const os = Platform.OS;
    const forgotPass = () => {
        //De refacut la baza de date:
        Alert.alert("Forgot password?", "You will receive an email with a password reset link.")
    }
    const onSignIn = () => {
        console.log(`Sign in detected: ${email} ${password} `);
        resetFields();
    }
    const resetFields = () => {
        setEmail('');
        setPassword('');
      };
  return (
    
    <View style={styles.container}>
      <Stack.Screen name='sign-in' options={{title:"Sign-In", headerShown: false}} />
      <View style={styles.topImageContainer}>
        <Image source={require('../../../assets/images/topVector.png')} style={styles.topImage} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Sign In</Text>
      </View>

      <View style={{...styles.inputContainer, elevation: 10, borderWidth: Platform.OS === 'ios' ? 2 : 0, borderColor: 'black'}}>
        <FontAwesome name='envelope' size={24} color={'#9A9A9A'} style={styles.inputIcon} />
        <TextInput value={email} onChangeText={setEmail} style={styles.textInput} placeholder='E-mail' placeholderTextColor={'gainsboro'} />
      </View>

      <View style={{...styles.inputContainer, elevation: 10, borderWidth: Platform.OS === 'ios' ? 2 : 0, borderColor: 'black'}}>
        <FontAwesome name='lock' size={24} color={'#9A9A9A'} style={styles.inputIcon} />
        <TextInput value={password} onChangeText={setPassword} style={styles.textInput} placeholder='Password' placeholderTextColor={'gainsboro'} secureTextEntry={hidden ? true : false} />
        <Pressable onPress={()=>{hidden ? setHidden(false) : setHidden(true)}}>
            <FontAwesome name={hidden ? 'eye' : 'eye-slash'} size={24} color={'#9A9A9A'} style={styles.hiddenIcon} />
        </Pressable>
      </View>

      <View>
        <Pressable style={{marginLeft:220}} onPress={forgotPass}>
            <Text style={styles.forgotPassword} >I forgot my password</Text>
        </Pressable>
      </View>
      <View style={styles.signInButtonContainer}>
        <Text style={styles.signIn}>Sign In</Text>
        <Pressable onPress={onSignIn} style={({ pressed }) => [styles.signInButton,{ opacity: pressed ? 0.5 : 1.0 }]}>
            <AntDesign name='arrowright' size={24} color={'white'} style={{alignSelf: 'center'}} />
        </Pressable>        
      </View>
      <Text style={styles.footerText}>Don't have an account yet? <Text style={{color: '#0399fc', textDecorationLine: 'underline'}} onPress={()=>{router.navigate('/sign-up')}}>Create Account</Text> </Text>
        
       <View style={styles.leftImageContainer}>
            <ImageBackground source={require('../../../assets/images/bottomVector.png')} style={styles.leftImage} />
        </View>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        flex:1,
        backgroundColor: 'white',
        position: 'relative',
    },
    topImageContainer:{

    },
    topImage:{
        width:'100%',
        height: 120,
    },
    textContainer:{
    },
    title:{
        fontSize: 40,
        fontWeight: 500,
        textAlign: 'center',
        color: 'black',
        marginVertical: 30,
        marginBottom: 70,
    },
    inputContainer:{
        backgroundColor: 'white',
        flexDirection: 'row',
        borderRadius: 20,
        marginHorizontal: 20,
        marginVertical: 20,
        alignItems: 'center',
        height: 60,
    },
    inputIcon: {
        marginLeft:15,
        marginRight: 10,
    },
    textInput:{
        flex: 1,
    },
    hiddenIcon:{
        alignSelf: 'flex-end',
        marginHorizontal: 15,
    },
    forgotPassword:{
        fontWeight: 500,
        textAlign: 'right',
        fontSize: 15,
        width: '90%',
        color: '#9A9A9A',
    },
    signInButtonContainer:{
        flexDirection: 'row',
        marginTop: 100,
        width: '97%',
        justifyContent: 'flex-end',
    },
    signInButton:{
        backgroundColor: '#0399fc',
        height: 34,
        width: 56,
        //aspectRatio: 1,
        alignContent: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        marginHorizontal: 15,
    },
    signIn:{
        fontWeight: 500,
        fontSize: 25,
    },
    footerText:{
        marginTop: 100,
        fontSize: 17,
        textAlign:'center',
        fontWeight: 400,
    },
    leftImageContainer:{
        position: 'absolute',
        left: 0,
        bottom: 0,
    },
    leftImage:{
        height: 300,
        width: 150,
    },
})
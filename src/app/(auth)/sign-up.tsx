import { View, Text, StyleSheet, Image, TextInput, Pressable, Alert, ImageBackground, TouchableOpacity } from 'react-native';
import React from 'react';
import { Link, Stack } from 'expo-router';
import { Entypo, FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';
import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { opacity } from 'react-native-reanimated/lib/typescript/Colors';

//Social media sign up nu merge apasat (pressable sau ceva)

export default function SignIn() {
    const [hidden, setHidden] = useState<boolean>(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const onSignUp = () => {
        console.log(`Account created: ${email} ${password} `);
    };
    const onFacebookLogin = () => {
      console.log("Facebook login");
    };
    const onGoogleLogin = () => {
      console.log("Google login");
    };
  return (
    
    <View style={styles.container}>
      <Stack.Screen name='sign-in' options={{title:"Sign-Up", headerShown: false}} />
      <View style={styles.topImageContainer}>
        <Image source={require('../../../assets/images/topVector.png')} style={styles.topImage} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Create account</Text>
      </View>


      <View style={{...styles.inputContainer, elevation: 10, borderWidth: Platform.OS === 'ios' ? 2 : 0, borderColor: 'black'}}>
        <FontAwesome name='envelope' size={24} color={'#9A9A9A'} style={styles.inputIcon} />
        <TextInput onChangeText={setEmail} style={styles.textInput} placeholder='E-mail' placeholderTextColor={'gainsboro'} />
      </View>
      <View style={{...styles.inputContainer, elevation: 10, borderWidth: Platform.OS === 'ios' ? 2 : 0, borderColor: 'black'}}>
        <FontAwesome name='lock' size={24} color={'#9A9A9A'} style={styles.inputIcon} />
        <TextInput onChangeText={setPassword} style={styles.textInput} placeholder='Password' placeholderTextColor={'gainsboro'} secureTextEntry={hidden ? true : false} />
        <Pressable onPress={()=>{hidden ? setHidden(false) : setHidden(true)}}>
            <FontAwesome name={hidden ? 'eye' : 'eye-slash'} size={24} color={'#9A9A9A'} style={styles.hiddenIcon} />
        </Pressable>
      </View>
      <Text style={styles.footerText}>Already have an account? <Text style={{color: '#0399fc', textDecorationLine: 'underline'}} onPress={()=>{router.navigate('/sign-in')}}>Log in</Text> </Text>
      <View style={styles.signInButtonContainer}>
        <Text style={styles.signIn}>Create account</Text>
        <Pressable onPress={onSignUp} style={({ pressed }) => [styles.signInButton,{ opacity: pressed ? 0.5 : 1.0 }]}>
            <AntDesign name='arrowright' size={24} color={'white'} style={{alignSelf: 'center'}} />
        </Pressable>        
      </View>

      <View>
          <Text style={styles.socialMediaText}>Or sign up with social media</Text>
      </View>

      <View style={styles.socialMediaContainer}>
        <Pressable style={({pressed}) => [{opacity: pressed ? 0.5 : 1.0}]} onPress={onFacebookLogin}>
          <Entypo style={styles.socialIcon} size={45} name='facebook-with-circle' color={'blue'} />
        </Pressable>
        <Pressable style={({pressed}) => [{opacity: pressed ? 0.5 : 1.0}]} onPress={onGoogleLogin}>
          <AntDesign style={styles.socialIcon} size={45} name='google' color={'red'} />
        </Pressable>
      </View>

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
        marginTop: 20,
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
        width: 300,
    },
    socialMediaText:{
      textAlign: 'center',
      fontSize: 20,
      marginTop: 50,
    },
    socialMediaContainer:{
      display: 'flex',
      flexDirection: 'row',
      marginTop: 20,
      justifyContent: 'center',
      gap: 10,
    },
    socialIcon:{
      backgroundColor: 'white',
      elevation: 20,
      //borderWidth: 5,
      padding: 10,
      borderRadius: 50,
    }
})
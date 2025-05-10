import { View, Text, ActivityIndicator, Image, ImageBackground } from 'react-native';
import React from 'react';
import Button from '../components/Button';
import { Link, Redirect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import SquareButton from '@/components/SquareButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const index = () => {
  const {session, loading, isAdmin} = useAuth();

  if(loading)
    {
      return<ActivityIndicator/>;
    }

  if(!session) {
    return <Redirect href={'/sign-in'}/>
  }
  if(!isAdmin){
    return <Redirect href={'/(user)'} />
  }

  return (
    <View style={{flex: 1}}>
      <ImageBackground style={{flex: 1}} resizeMode='cover' source={require('../../assets/images/citystreets.jpeg')}>
      <View>
        <Image source={require(`../../assets/images/routely-logo.png`)} style={{width: 80, height: 80, left: 25, top: 25}} />
        <Text style={{fontWeight: '500', fontSize: 60, top: 40, left: 30, color: 'white'}}>Welcome!</Text>
        <Text style={{fontWeight: '400', fontSize: 30, top: 30, left: 30, color: 'white'}}>Select your profile:</Text>
      </View>
      <View style={{ justifyContent: 'space-around', padding: 10, flexDirection: 'row', top: 150 }}>
        
        <Link href={'/(user)'} asChild>
          <SquareButton icon={'user'} text="User" />
        </Link>
        <Link href={'/(admin)'} asChild>
          <SquareButton icon={'shield'} text="Admin" />
        </Link>
      </View>
      </ImageBackground>
    </View>
  );
};

export default index;
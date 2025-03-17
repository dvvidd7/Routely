import { View, Text, ActivityIndicator } from 'react-native';
import React from 'react';
import Button from '../components/Button';
import { Link, Redirect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

const index = () => {
  const {session, loading} = useAuth();

  if(loading)
    {
      return<ActivityIndicator/>;
    }

  if(!session) {
    return <Redirect href={'sign-in'}/>
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 10 }}>
      <Link href={'/(user)'} asChild>
        <Button text="User" />
      </Link>
      <Link href={'/sign-in'} asChild>
        <Button text="Sign In" />
      </Link>
    </View>
  );
};

export default index;
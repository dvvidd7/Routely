import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../lib/supabase'; 
import { useRouter } from 'expo-router'; 

export default function NewPass() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSetPassword = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Your password has been updated. Please log in again.');
      await supabase.auth.signOut();
      router.replace('/(auth)/sign-in');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Set New Password</Text>
      <Text style={{ marginBottom: 16 }}>
        Enter your new password below.
      </Text>
      <TextInput
        placeholder="New Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        }}
      />
      <TouchableOpacity
        onPress={handleSetPassword}
        style={{
          backgroundColor: '#025ef8',
          padding: 16,
          borderRadius: 8,
          alignItems: 'center',
        }}
        disabled={!password || loading}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>
          {loading ? 'Updating...' : 'Set Password'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

export default function ForgotPass() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSendReset = async () => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setSent(true);
      Alert.alert('Check your email', 'A password reset link has been sent to your email.');
      router.replace("newPass");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Forgot Password</Text>
      <Text style={{ marginBottom: 16 }}>
        Enter your email and we'll send you a password reset link.
      </Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        }}
      />
      <TouchableOpacity
        onPress={handleSendReset}
        style={{
          backgroundColor: '#025ef8',
          padding: 16,
          borderRadius: 8,
          alignItems: 'center',
        }}
        disabled={!email}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send Reset Link</Text>
      </TouchableOpacity>
      {sent && (
        <Text style={{ color: 'green', marginTop: 16 }}>
          If your email is registered, you will receive a reset link.
        </Text>
      )}
    </View>
  );
}
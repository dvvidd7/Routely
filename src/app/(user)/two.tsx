import React, { JSXElementConstructor, ReactElement, useState, useContext, useEffect } from 'react';
import { StyleSheet, Pressable, TextInput, View, Switch, Alert, Linking, Modal, FlatList, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import { Entypo, Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { Dropdown } from 'react-native-element-dropdown';
import AntDesign from '@expo/vector-icons/AntDesign';
import { ThemeContext } from '../_layout';
import { supabase } from '@/lib/supabase';
import { useNavigation, useRouter } from 'expo-router';
import { useGetPoints, useGetUsers, useUpdateTransport, useUpdateUser } from '@/api/profile';
import { useAuth } from '@/providers/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';
import LeaderboardUser from '@/components/LeaderboardUser';
import { useNotification } from '@/providers/NotificationContext';

const data = [
  { label: 'Bus', value: 'bus' },
  { label: 'Car', value: 'car' },
  { label: 'Both', value: 'both' },
];


export default function TabTwoScreen() {
  const { dark } = useTheme();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [username, setUsername] = useState('User');
  const [newUsername, setNewUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [transport, setTransport] = useState('');
  const [isFocus, setIsFocus] = useState(false);
  const [email, setEmail] = useState('');
  const router = useRouter();
  const { user: dataUsername, profile } = useAuth();
  const { mutate: updateUsername } = useUpdateUser();
  const { mutate: updateTransport } = useUpdateTransport();
  const { data: users, error: usersError } = useGetUsers();
  const { data: points, error } = useGetPoints();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const { notification, setNotification } = useNotification();
  const {isAdmin} = useAuth();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email ?? '');
      }
      if (dataUsername) {
        setUsername(dataUsername);
      }
      if (profile.fav_transport) {
        setTransport(profile.fav_transport);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      console.log("Redirected URL:", event.url);
      const urlParams = new URL(event.url);
      const authCode = urlParams.searchParams.get("code");

      if (authCode) {
        console.log("Uber Auth Code:", authCode);
        Alert.alert("Uber Connected!", `Code: ${authCode}`);
        // TODO: Send authCode to backend to exchange for an access token
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => {
      subscription.remove();
    };
  }, []);

  const openEmail = () => {
    Linking.openURL("mailto: davidmanciu1881@gmail.com")
  }

  const handlePress = () => {
    if (newUsername.trim()) {
      setUsername(newUsername);
      updateUsername({ user: newUsername });
      setNewUsername('');
      setIsEditing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Are you sure?',
      'Do you really want to log out?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            await supabase.auth.signOut();
            router.push('/sign-in');
          }
        },
      ]
    );
  };

  const handlePencilPress = () => {
    setIsEditing(!isEditing);
  };
  const handleCancel = () => {
    setNewUsername('');
    setIsEditing(false);
  }

  const renderItem = (item: { label: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; value: null; }) => {
    return (
      <View style={[styles.item, isDarkMode && styles.itemDark]}>
        <Text style={[styles.textItem, isDarkMode && styles.textItemDark]}>{item.label}</Text>
        {item.value === transport && (
          <AntDesign
            style={styles.icon}
            color={isDarkMode ? '#0384fc' : 'black'}
            name="check"
            size={20}
          />
        )}
      </View>
    );
  };
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#0f0f0f' : 'white' }]}>
      <Text style={[styles.text, { color: isDarkMode ? 'white' : 'black' }]}>
        Account
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable style={{ ...styles.viewLeader, backgroundColor: 'transparent' }} onPress={() => setModalVisible(true)}>
          <Entypo name={'trophy'} size={30} color={'#f5d90a'} />
          <Text style={{ fontSize: 20, marginLeft: 5, fontWeight: '500', color: dark ? 'white' : 'black' }}>View Leaderboard</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Text style={{ fontSize: 30, fontWeight: '500', marginHorizontal: 5, color: dark ? 'white' : 'black' }}>{points?.points}</Text>
          <MaterialCommunityIcons name='star-four-points' color={'#0384fc'} size={30} style={{ marginRight: 20 }} />
        </View>
      </View>


      {/* LEADERBOARD MODAL */}
      <Modal visible={modalVisible} transparent={true} onRequestClose={() => setModalVisible(false)} animationType='slide'>
        <View style={{ ...styles.modal, backgroundColor: dark ? 'black' : 'white' }}>
          {/* {LeaderboardUser(profile)} */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 60 }}>
            <Pressable onPress={() => setModalVisible(false)}>
              <Feather name={'arrow-left'} size={40} color={'#0384fc'} />
            </Pressable>
          </View>

          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 30 }}>
              Leaderboard
            </Text>
          </View>

          <FlatList
            style={{ marginTop: 25 }}
            data={users}
            renderItem={({ item, index }) => {
              return <LeaderboardUser index={index} userN={item} />
            }}
            contentContainerStyle={{ gap: 10 }}
          />
        </View>
      </Modal>


      <View style={[styles.middleContainer, { backgroundColor: isDarkMode ? '#0f0f0f' : 'white' }]}>
      {isAdmin && (
              <View style={styles.adminPage}>
              <TouchableOpacity onPress={()=>router.push('(admin)')} ><Text style={styles.adminText}>Go to admin page</Text></TouchableOpacity>
            </View>
      )}

        <View style={[styles.usernameContainer, isEditing && styles.usernameContainerEditing, { backgroundColor: isDarkMode ? '#0f0f0f' : 'white' }]}>
          <Text style={[styles.username, { color: isDarkMode ? 'white' : 'black' }]}>
            {username}
          </Text>
          <Pressable onPress={handlePencilPress}>
            <FontAwesome name="edit" size={18} color={isDarkMode ? 'white' : 'black'} style={styles.pencilIcon} />
          </Pressable>
        </View>
        {!isEditing && (
          <Text style={[styles.email, { color: isDarkMode ? 'white' : 'black' }]}>
            {email}
          </Text>
        )}
        {isEditing && (
          <>
            <TextInput
              style={[styles.input, { color: isDarkMode ? 'white' : 'black', borderColor: isDarkMode ? 'white' : 'gray' }]}
              placeholder="Enter new name"
              placeholderTextColor={isDarkMode ? 'gray' : 'darkgray'}
              value={newUsername}
              onChangeText={setNewUsername}
            />
            <Pressable style={styles.button} onPress={handlePress}>
              <Text style={styles.buttonText}>Change Name</Text>
            </Pressable>
            <Pressable style={styles.buttonCancel} onPress={handleCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
          </>
        )}
        {!isEditing && (
          <View style={styles.dropdownContainer}>
            <Dropdown
              style={[styles.dropdown, isDarkMode && styles.dropdownDark, isFocus && { borderColor: '#0384fc' }]}
              placeholderStyle={[styles.placeholderStyle, isDarkMode && { color: 'white' }]}
              selectedTextStyle={[styles.selectedTextStyle, isDarkMode && { color: 'white' }]}
              inputSearchStyle={styles.inputSearchStyle}
              iconStyle={styles.iconStyle}
              data={data}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Bus or Car?"
              value={transport}
              onFocus={() => setIsFocus(true)}
              onBlur={() => setIsFocus(false)}
              onChange={item => {
                updateTransport({ fav_transport: item.value });
                setTransport(transport);
                setIsFocus(false);
              }}
              renderLeftIcon={() => (
                <AntDesign style={styles.icon} color={isDarkMode ? '#0384fc' : 'black'} name="car" size={20} />
                // <FontAwesome style={styles.icon} color={isDarkMode ? '#0384fc' : 'black'} name={transport === "bus" ? "bus" : "car"} size={20} />
              )}
              renderItem={renderItem}
            />
            <View style={styles.switchContainer}>
              <Text style={[styles.switchText, { color: isDarkMode ? 'white' : 'black' }]}>Dark Mode</Text>
              <Switch
                trackColor={{ false: '#767577', true: '#0384fc' }}
                thumbColor={isDarkMode ? '#f4f3f4' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleTheme}
                value={isDarkMode}
              />
            </View>
            <View style={styles.notificationSwitchContainer}>
              <Text style={[styles.switchText, { color: isDarkMode ? 'white' : 'black' }]}>Notifications</Text>
              <Switch
                trackColor={{ false: '#767577', true: '#0384fc' }}
                thumbColor={notification ? '#f4f3f4' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={(value) => setNotification(value)} // Toggle the notification state
                value={notification} // Bind the state to the Switch
              />
            </View>
            <View>
              <Pressable onPress={handleLogout} style={styles.logoutButton}>
                <Text style={styles.logoutText}>Log Out</Text>
              </Pressable>
            </View>
            <View>
              <Pressable onPress={openEmail} style={styles.feedbackButton}>
                <Text style={styles.feedbackText}>Feedback</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  adminPage:{
    backgroundColor: '#0384fc',
    width: '40%',
    borderRadius: 5,
    padding: 10,
    bottom: 50,
    right: 100
  },
  adminText:{
    fontWeight: '500',
    fontSize: 15,
  },
  text: {
    fontSize: 40,
    margin: 20,
    textAlign: 'left',
    marginTop: 50,
    fontFamily: 'GaleySemiBold',
    flexDirection: 'row'
  },
  middleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewLeader: {
    flexDirection: 'row',
    left: 20,
    backgroundColor: 'gainsboro',
    borderRadius: 5,
    padding: 5,
  },
  modal: {
    flex: 1,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10, // Adjust this value as needed to move the username closer to the email
  },
  usernameContainerEditing: {
    marginBottom: 20, // Adjust this value as needed to move the username closer to the TextInput
  },
  username: {
    fontSize: 40,
    textAlign: 'center',
  },
  pencilIcon: {
    marginLeft: 10,
  },
  input: {
    height: 50,
    borderWidth: 1,
    marginTop: 20,
    marginBottom: 25,
    paddingHorizontal: 10,
    width: '80%',
    fontSize: 18,
    borderRadius: 15,
    padding: 10,
  },
  button: {
    backgroundColor: '#0384fc',
    padding: 13,
    borderRadius: 30,
    marginBottom: 50,
  },
  buttonCancel: {
    backgroundColor: 'red',
    padding: 13,
    borderRadius: 30,
    marginBottom: 190,
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
  },

  email: {
    fontSize: 20,
    textAlign: 'center',
    marginTop: 10, // Adjust this value as needed to move the email closer to the username
    marginBottom: 20,
  },
  dropdownContainer: {
    width: '80%',
  },
  dropdown: {
    height: 50,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    marginBottom: 50,
  },
  dropdownDark: {
    backgroundColor: 'black',
  },
  icon: {
    marginRight: 5,
  },
  item: {
    padding: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDark: {
    backgroundColor: 'black',
  },
  textItem: {
    flex: 1,
    fontSize: 16,
  },
  textItemDark: {
    color: 'white',
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    alignSelf: 'center',
  },
  notificationSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 60,
    alignSelf: 'center',
  },
  switchText: {
    fontSize: 16,
    marginRight: 10,
  },
  logoutButton: {
    backgroundColor: 'transparent',
    padding: 1,
    width: 100,
    alignItems: 'center',
    alignSelf: 'center',
  },
  feedbackButton: {
    backgroundColor: 'transparent',
    padding: 1,
    width: 100,
    alignItems: 'center',
    alignSelf: 'center',
  },
  logoutText: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  feedbackText: {
    color: '#0384fc',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 64,
  },
});
import React, { JSXElementConstructor, ReactElement, useState, useContext, useEffect } from 'react';
import { StyleSheet, Pressable, TextInput, View, Switch, Alert, Linking, Modal, FlatList, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Text } from '@/components/Themed';
import { Entypo, Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { Dropdown } from 'react-native-element-dropdown';
import AntDesign from '@expo/vector-icons/AntDesign';
import { ThemeContext } from '../_layout';
import { supabase } from '@/lib/supabase';
import { useNavigation, useRouter } from 'expo-router';
import { useGetPoints, useGetUserName, useGetUsers, useUpdateTransport, useUpdateUser } from '@/api/profile';
import { useAuth } from '@/providers/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';
import LeaderboardUser from '@/components/LeaderboardUser';
import { useNotification } from '@/providers/NotificationContext';
import * as Notifications from 'expo-notifications';

const data = [
  { label: 'Bus', value: 'bus' },
  { label: 'Car', value: 'car' },
  { label: 'Both', value: 'both' },
];

const badges = [
  { id: 1, name: "Eco Starter", points: 100, image: require('assets/images/100points.png') },
  { id: 2, name: "Green Commuter", points: 500, image: require('assets/images/500points.png') },
  { id: 3, name: "Planet Saver", points: 1000, image: require('assets/images/plantLover.png') },
  { id: 4, name: "Eco Hero", points: 2000, image: require('assets/images/planetLover.png') },
];

export default function TabTwoScreen() {
  const { dark } = useTheme();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [username, setUsername] = useState('user');
  const [newUsername, setNewUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [transport, setTransport] = useState('');
  const [isFocus, setIsFocus] = useState(false);
  const [email, setEmail] = useState('');
  const router = useRouter();
  const { user: dataUsername, profile, session } = useAuth();
  const { mutate: updateUsername } = useUpdateUser();
  const { mutate: updateTransport } = useUpdateTransport();
  const { data: users, error: usersError } = useGetUsers();
  const { data: points, error } = useGetPoints();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const { notification, setNotification } = useNotification();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { data: getUser } = useGetUserName();
  const earnedBadges = points
    ? badges.filter((badge) => typeof badge.points === 'number' && typeof points === 'number' && points >= badge.points)
    : [];
  const lockedBadges = badges.filter((badge) => typeof badge.points === 'number' && typeof points === 'number' && points < badge.points);
  const hasBadge = (badgePoints: number, userPoints: number | undefined): boolean => {
    return typeof userPoints === 'number' && userPoints >= badgePoints;
  };
  const [previousPoints, setPreviousPoints] = useState<number | null>(null);
  const getHighestBadge = (userPoints: number) => {
    return badges
      .filter((badge) => userPoints >= badge.points)
      .sort((a, b) => b.points - a.points)[0];
  };


  useEffect(() => {
    const channels = supabase.channel('custom-update-channel')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${session?.user.id}` },
        (payload) => {
          setTransport(payload.new.fav_transport);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channels);
    }
  }, [])

  useEffect(() => {
    if (typeof points === 'number' && previousPoints !== null) {
      // Find newly unlocked badges
      const newlyUnlockedBadges = badges.filter(
        (badge) => points >= badge.points && (previousPoints < badge.points)
      );

      // Notify the user about newly unlocked badges
      if (newlyUnlockedBadges.length > 0) {
        const badgeNames = newlyUnlockedBadges.map((badge) => badge.name).join(', ');

        Notifications.scheduleNotificationAsync({
          content: {
            title: "🏅New badge unlocked!",
            body: `You got ${badgeNames} for making the planet a better place.`,
            sound: "default",
          },
          trigger: null,
        });
      }
    }

    // Update previous points
    setPreviousPoints(points ?? null);
  }, [points]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      console.warn(getUser, user?.email);
      if (error) { console.error('Error fetching user: ', error.message); return; }

      if (user) {
        setEmail(user.email ?? '');
      }
      if (!getUser) {
        if (!dataUsername) return;
        setUsername(dataUsername);
      }
      else {
        setUsername(getUser.username);
      }

      if (profile?.fav_transport) {
        setTransport(profile.fav_transport);
      }
    };
    fetchUser();
  }, []);
  useEffect(() => {

    const channels = supabase.channel('profiles-update-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${session?.user.id}` },
        (payload) => {
          setUsername((payload.new as { username: string }).username);
          queryClient.invalidateQueries({ queryKey: ['users'] });
          queryClient.invalidateQueries({ queryKey: ['username'] });
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channels);
    }
  }, [])

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
      // setUsername(newUsername);
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
            setUsername('');
            setEmail('');
            setTransport('');
            setNewUsername('');
            queryClient.clear();
            await supabase.auth.signOut();
            router.push('sign-in');
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
            color={isDarkMode ? '#025ef8' : 'black'}
            name="check"
            size={20}
          />
        )}
      </View>
    );
  };
  const navigation = useNavigation();


  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 100 }}
      style={{ flex: 1, backgroundColor: isDarkMode ? '#0f0f0f' : 'white' }}
    >
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignContent: 'center', alignItems: 'center'}}>
        <Text style={[styles.text, { color: isDarkMode ? 'white' : 'black' }]}>
          Account
        </Text>

        <View style={styles.adminPage}>
          <TouchableOpacity onPress={() => router.push('(admin)')}>
            <Text style={styles.adminText}>Go to admin page</Text>
          </TouchableOpacity>
        </View>

      </View>



      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable style={{ ...styles.viewLeader, backgroundColor: '#025ef8',}} onPress={() => setModalVisible(true)}>
          <Entypo name={'trophy'} size={30} color={'#f5d90a'} />
          <Text style={{ fontSize: 20, marginLeft: 5, fontWeight: '500', color: 'white'}}>View Leaderboard</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Text style={{ fontSize: 30, fontWeight: '500', marginHorizontal: 5, color: dark ? 'white' : 'black' }}>{points}</Text>
          <MaterialCommunityIcons name='star-four-points' color={'#025ef8'} size={30} style={{ marginRight: 20, top: 5 }} />
        </View>
      </View>

      {/* LEADERBOARD MODAL */}
      <Modal visible={modalVisible} transparent={true} onRequestClose={() => setModalVisible(false)} animationType='slide'>
        <View style={{ ...styles.modal, backgroundColor: dark ? 'black' : 'white' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 60 }}>
            <Pressable onPress={() => setModalVisible(false)}>
              <Feather name={'arrow-left'} size={40} color={'#025ef8'} />
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
              const highestBadge = getHighestBadge(item.points);
              return (
                <LeaderboardUser
                  index={index}
                  userN={item}
                  badge={highestBadge}
                />
              );
            }}
            contentContainerStyle={{ gap: 10 }}
          />
        </View>
      </Modal>

      {/*BADGES*/}
      <View style={styles.badgeContainer}>
        <Text style={[styles.badgeTitle, { color: dark ? "white" : "black" }]}>Your Badges</Text>
        <FlatList
          data={badges}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.badgeItem}>
              <Image
                source={item.image}
                style={StyleSheet.flatten([
                  styles.badgeImage,
                  typeof points === 'number' && points >= item.points ? styles.badgeEarned : styles.badgeLocked,
                  hasBadge(item.points, points) ? styles.badgeEarned : styles.badgeLocked,
                ])}
              />
              <Text style={[styles.badgeName, { color: dark ? "white" : "black" }]}>{item.name}</Text>
              <Text style={[styles.badgePoints, { color: dark ? "white" : "black" }]}>
                {typeof points === 'number' && points >= item.points ? "Unlocked" : `Unlock at ${item.points} points`}
              </Text>
            </View>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <View style={[styles.middleContainer, { backgroundColor: isDarkMode ? '#0f0f0f' : 'white' }]}>
        {/* {isAdmin && (
          <View style={styles.adminPage}>
            <TouchableOpacity onPress={() => router.push('(admin)')}>
              <Text style={styles.adminText}>Go to admin page</Text>
            </TouchableOpacity>
          </View>
        )} */}

        {/* Username and Email Section */}
        <View style={[styles.usernameContainer, isEditing && styles.usernameContainerEditing, { backgroundColor: isDarkMode ? '#0f0f0f' : 'white' }]}>
          <Text style={[styles.username, { color: isDarkMode ? 'white' : 'black' }]}>
            {getUser?.username}
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

        {/* Dropdown and Switches */}
        {!isEditing && (
          <View style={styles.dropdownContainer}>
            <Dropdown
              style={[styles.dropdown, isDarkMode && styles.dropdownDark, isFocus && { borderColor: '#025ef8' }]}
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
              onChange={(item) => {
                updateTransport({ fav_transport: item.value });
                setTransport(transport);
                setIsFocus(false);
              }}
              renderLeftIcon={() =>
                transport === 'bus' ? (
                  <FontAwesome style={styles.icon} color={'#025ef8'} name="bus" size={20} />
                ) : (
                  <AntDesign style={styles.icon} color={'#025ef8'} name="car" size={20} />
                )
              }
              renderItem={renderItem}
            />
            <View style={styles.switchContainer}>
              <Text style={[styles.switchText, { color: isDarkMode ? 'white' : 'black' }]}>Dark Mode</Text>
              <Switch
                trackColor={{ false: '#767577', true: '#025ef8' }}
                thumbColor={isDarkMode ? '#f4f3f4' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleTheme}
                value={isDarkMode}
              />
            </View>
            <View style={styles.notificationSwitchContainer}>
              <Text style={[styles.switchText, { color: isDarkMode ? 'white' : 'black' }]}>Notifications</Text>
              <Switch
                trackColor={{ false: '#767577', true: '#025ef8' }}
                thumbColor={notification ? '#f4f3f4' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={(value) => setNotification(value)}
                value={notification}
              />
            </View>
            <View>
              <Pressable onPress={handleLogout} style={styles.logoutButton}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="logout" size={20} color="red" style={{ marginRight: 5, bottom:45 }} />
                  <Text style={styles.logoutText}>Log Out</Text>
                </View>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, // Ensures the content can grow and scroll properly
  },
  adminPage: {
    backgroundColor: '#025ef8',
    top: 20,
    right: 10,
    width: '34%',
    height: 40,
    borderRadius: 45,
    // padding: 8,
    // bottom: 317,
    // left: 120,
    alignItems: 'center',
    justifyContent: 'center'
  },
  adminText: {
    fontWeight: '600',
    fontSize: 12,
    color: 'black'
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
    marginBottom: 10
  },
  viewLeader: {
    flexDirection: 'row',
    left: 20,
    backgroundColor: 'gainsboro',
    borderRadius: 25, 
    padding: 11, 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5, 
    shadowRadius: 4, 
  },
  modal: {
    flex: 1,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  usernameContainerEditing: {
    marginBottom: 20,
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
    marginBottom: 20,
    paddingHorizontal: 10,
    width: '80%',
    fontSize: 18,
    borderRadius: 15,
    padding: 10,
  },
  button: {
    backgroundColor: '#025ef8',
    padding: 13,
    borderRadius: 30,
    marginBottom: 30,
  },
  buttonCancel: {
    backgroundColor: 'red',
    padding: 13,
    borderRadius: 30,
    marginBottom: 140,
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
    marginBottom: 58,
    marginTop: 20,
    alignSelf: 'center',
    bottom: 40,
  },
  notificationSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    bottom: 70,
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
    marginBottom: 30,
    bottom: 30,
  },
  feedbackText: {
    color: '#025ef8',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    bottom: 40,
  },
  ecoMessageContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#e0f7e9',
    borderRadius: 10,
  },
  ecoMessage: {
    fontSize: 16,
    color: '#2e7d32',
    textAlign: 'center',
  },
  badgeContainer: {
    marginTop: 50,
  },
  badgeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  badgeItem: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  badgeImage: {
    width: 80,
    height: 80,
    marginBottom: 5,
  },
  badgeEarned: {
    opacity: 1,
  },
  badgeLocked: {
    opacity: 0.3,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  badgePoints: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
});
import React, { JSXElementConstructor, ReactElement, useState, useContext } from 'react';
import { StyleSheet, Pressable, TextInput, View, Switch } from 'react-native';
import { Text } from '@/components/Themed';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { Dropdown } from 'react-native-element-dropdown';
import AntDesign from '@expo/vector-icons/AntDesign';
import { ThemeContext } from '../_layout';

const data = [
  { label: 'Bus', value: 'bus' },
  { label: 'Car', value: 'car' },
];

export default function TabTwoScreen() {
  const { dark } = useTheme();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [username, setUsername] = useState('User');
  const [newUsername, setNewUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [transport, setTransport] = useState(null);
  const [isFocus, setIsFocus] = useState(false);

  const handlePress = () => {
    if (newUsername.trim()) {
      setUsername(newUsername);
      setNewUsername('');
      setIsEditing(false);
    }
  };

  const handlePencilPress = () => {
    setIsEditing(!isEditing);
  };

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

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#0f0f0f' : 'white' }]}>
      <Text style={[styles.text, { color: isDarkMode ? 'white' : 'black' }]}>
        Profile
      </Text>
      <View style={[styles.middleContainer, { backgroundColor: isDarkMode ? '#0f0f0f' : 'white' }]}>
        <View style={[styles.usernameContainer, isEditing && styles.usernameContainerEditing, { backgroundColor: isDarkMode ? '#0f0f0f' : 'white' }]}>
          <Text style={[styles.username, { color: isDarkMode ? 'white' : 'black' }]}>
            {username}
          </Text>
          <Pressable onPress={handlePencilPress}>
            <FontAwesome name="pencil" size={18} color={isDarkMode ? 'white' : 'black'} style={styles.pencilIcon} />
          </Pressable>
        </View>
        {!isEditing && (
          <Text style={[styles.email, { color: isDarkMode ? 'white' : 'black' }]}>
            ion@gmail.com
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
          </>
        )}
        {!isEditing && (
          <View style={styles.dropdownContainer}>
            <Dropdown
              style={[styles.dropdown, isDarkMode && styles.dropdownDark, isFocus && { borderColor: '#0384fc' }]}
              placeholderStyle={[styles.placeholderStyle, isDarkMode && { color: 'black' }]}
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
                setTransport(item.value);
                setIsFocus(false);
              }}
              renderLeftIcon={() => (
                <AntDesign style={styles.icon} color={isDarkMode ? '#0384fc' : 'black'} name="car" size={20} />
              )}
              renderItem={renderItem}
            />
            <View style={styles.switchContainer}>
              <Text style={[styles.switchText, { color: isDarkMode ? 'white' : 'black' }]}>Dark Mode</Text>
              <Switch
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={isDarkMode ? '#f5dd4b' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleTheme}
                value={isDarkMode}
              />
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
  text: {
    fontSize: 50,
    margin: 20,
    textAlign: 'left',
    marginTop: 60,
    fontFamily: 'GaleySemiBold',
  },
  middleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 50,
    textAlign: 'center',
  },
  pencilIcon: {
    marginLeft: 10,
  },
  input: {
    height: 40,
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
    //marginTop: 20,
    marginBottom:130,
    alignSelf:'center'
  },
  switchText: {
    fontSize: 16,
    marginRight: 10,
  },
});
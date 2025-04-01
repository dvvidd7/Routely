import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { Feather } from '@expo/vector-icons'
import { useTheme } from '@react-navigation/native';

interface SearchRefType {
    searchRef: React.RefObject<any>;
    searchText: string
}

export default function RecentSearch({ searchRef, searchText }: SearchRefType) {
    const {dark} = useTheme();
    const handlePress = () => {
        if (searchRef && searchRef.current) {
            searchRef.current.setAddressText(searchText);
        }
    };

    return (
        <TouchableOpacity onPress={handlePress} style={{...styles.container,backgroundColor: dark ? 'black' : 'white',}}>
            <Feather name='clock' size={24} style={styles.icon} color={dark ? 'white' : 'black'} />
            <Text style={{...styles.text, color: dark ? 'white' : 'black'}}>{searchText}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        
        borderRadius: 10,
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1000,
    },
    text:{
        fontSize: 15,
    },  
    icon: {
        paddingRight: 10,
    }
})
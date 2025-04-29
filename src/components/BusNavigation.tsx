import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { AntDesign, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import {Divider} from 'react-native-paper';

type Stop = {
    from: string;
    fromCoords: {
      lat: any;
      lng: any;
    } 
    toCoords: {
      lat: any;
      lng: any;
    } 
    to: string; line: string; vehicle: string; departureTime?: string; arrivalTime?: string; headsign?: string
  }
type Navigator = {
    station: Stop[],
    onCancel: () => void,
    onIncrease: () => void,
    onDecrease: () => void,
    routeIndex: number,
    multiple: boolean
}
const BusNavigation = ({station, onCancel, routeIndex, onIncrease, onDecrease, multiple} : Navigator) => {
    const {dark} = useTheme();
    if(!station) return null;
  return (
    <View style={styles.container}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text style={styles.title}>Transit Navigator</Text>
            {multiple && (
            <TouchableOpacity style={styles.closeIconContainer} onPress={onDecrease}>
                <FontAwesome style={styles.closeIcon} color='#0384fc' name='backward' size={15} />
            </TouchableOpacity>
            )}
            {multiple && (
            <TouchableOpacity style={styles.closeIconContainer} onPress={onIncrease}>
                <AntDesign style={styles.closeIcon} color='#0384fc' name='forward' size={15} />
            </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.closeIconContainer} onPress={onCancel}>
                <MaterialCommunityIcons style={styles.closeIcon} color='#0384fc' name='close' size={15} />
            </TouchableOpacity>
            
        </View>
        <View style={{...styles.smallContainer, backgroundColor: dark ? 'black' : 'white'}}>
        <View>
            <MaterialCommunityIcons name='bus-marker' size={30} color={'#0384fc'} />
        </View>
        <View>
            <Text style={{...styles.line, color: dark ? 'white' : 'black'}}>Take {station[routeIndex].vehicle.toLowerCase()} line: <Text style={styles.customInput}>{station[routeIndex].line}</Text></Text>
            <Text style={{...styles.line, color: dark ? 'white' : 'black'}}>Headsign: <Text style={styles.customInput}>{station[routeIndex].headsign}</Text></Text>
            <Text style={{...styles.line, color: dark ? 'white' : 'black'}}>From: <Text style={styles.customInput}>{station[routeIndex].from}</Text></Text>
            <Text style={{...styles.line, color: dark ? 'white' : 'black'}}>To: <Text style={styles.customInput}>{station[routeIndex].to}</Text></Text>
            <Divider leftInset={true} style={{margin: 10}} />
            <View style={{flexDirection: 'row'}}>
                <Text style={{...styles.line, color: dark ? 'white' : 'black'}}>Leaving at: <Text style={styles.customInput}>{station[routeIndex].departureTime}</Text></Text>
                <Text style={{...styles.line, color: dark ? 'white' : 'black'}}>Arriving at: <Text style={styles.customInput}>{station[routeIndex].arrivalTime}</Text></Text>
            </View>
        </View>
        </View>
    </View>
  )
}

export default BusNavigation

const styles = StyleSheet.create({
    container:{
        position: "absolute",
        top: 90,
        marginHorizontal: 20,
        backgroundColor: '#0384fc',
        width: '90%',
        borderRadius: 10,
        zIndex: 10,
        elevation: 15,
        shadowRadius: 10,
    },
    smallContainer:{    
        position: "relative",
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        borderTopStartRadius: 2,
        borderTopEndRadius: 2,
        zIndex: 10,
        // elevation: 15,
        // shadowRadius: 10,
    },
    line:{
        marginHorizontal: 15,
    },
    customInput:{
        color: '#0384fc',
        fontWeight: '700',
    },
    title:{
        margin: 10,
        fontWeight: '500',
        color: 'white',
        fontSize: 20,
    },
    closeIconContainer: {
        margin: 10,
        padding: 5,
        backgroundColor: '#cde6fe',
        borderRadius: 30,
        justifyContent: 'center'
    },
    closeIcon: {
        color: '#0384fc',
    }
})
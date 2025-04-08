import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { AntDesign, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
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
type Station = {
    station: Stop,
}
const BusNavigation = ({station} : Station) => {
    if(!station) return null;
  return (
    <View style={styles.container}>
        <View>
            <Text style={styles.title}>Bus Navigator</Text>
        </View>
        <View style={styles.smallContainer}>
        <View>
            <MaterialCommunityIcons name='bus-marker' size={30} color={'#0384fc'} />
        </View>
        <View>
            <Text style={styles.line}>Take bus line <Text style={styles.customInput}>{station.line}</Text></Text>
            <Text style={styles.line}>From <Text style={styles.customInput}>{station.from}</Text></Text>
            <Text style={styles.line}>To <Text style={styles.customInput}>{station.to}</Text></Text>
        </View>
        <View>
            <Text style={styles.line}>Leaving at: <Text style={styles.customInput}>{station.departureTime}</Text></Text>
            <Text style={styles.line}>Arriving at destination: <Text style={styles.customInput}>{station.arrivalTime}</Text></Text>
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
        flexShrink: 1,
    },
    customInput:{
        color: '#0384fc',
        fontWeight: '500',
        flexShrink: 1,
    },
    title:{
        margin: 10,
        fontWeight: '500',
        color: 'white',
        fontSize: 20,
    }
})
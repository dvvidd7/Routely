import React, { useRef, useState } from 'react';
import { View, Button, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { Feather, Fontisto } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
type MicButtonProps = {
  onAverage?: (avg: number) => void;
}
const MicButton = ({onAverage} : MicButtonProps) => {
  const [metering, setMetering] = useState<number | null>(null);
  const [average, setAverage] = useState<number | null>(null);
  const [showMic, setShowMic] = useState<boolean>(false);
  const [showAvg, setShowAvg] = useState<boolean>(false);
  const [polluted, setPolluted] = useState<boolean>(false);
  const meteringValues = useRef<number[]>([]);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const handleMicPress = () => {
    setShowMic((prev) => !prev);
    showMic ? stopRecording() : startRecording();
  }
  const startRecording = async () => {
    setShowAvg(true);
    setAverage(null);
    meteringValues.current = [];
    try {
      await Audio.requestPermissionsAsync();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();

      await recording.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );

      await recording.startAsync();

      recordingRef.current = recording;

      const interval = setInterval(async () => {
        const status = await recording.getStatusAsync();
        if (status.metering) {
            meteringValues.current.push(status.metering);
            setMetering(status.metering); // iOS only
        }
      }, 200);

      recordingRef.current._interval = interval; // Custom ref key

    setTimeout(stopRecording, 5000);

    } catch (err) {
      console.error('Recording failed', err);
    }
  };

  const stopRecording = async () => {
    if (recordingRef.current) {
      clearInterval(recordingRef.current._interval);
      await recordingRef.current.stopAndUnloadAsync();
      recordingRef.current = null;

      if (meteringValues.current.length > 0) {
        const sum = meteringValues.current.reduce((a, b) => a + b, 0);
        const avg = sum / meteringValues.current.length;
        setAverage(avg);
        if(onAverage) onAverage(avg);
        console.warn(average);
      } else console.warn("Metering values <= 0")
    }
    setShowMic(false);
    setTimeout(()=>{setShowAvg(false);}, 3000);
  };

  return (
    // <View style={{ padding: 20 }}>
    //   <Button title="Start Measuring" onPress={startRecording} />
    //   <Button title="Stop Measuring" onPress={stopRecording} />
    //   <Text style={{ marginTop: 20 }}>
    //     Sound Level: {metering !== null && metering > -40 ? ' polluted' : 'clean'}
    //     {'\n'}
    //     Sound Level: {metering !== null ? metering + 'dB' : 'N/A'}
    //     {'\n'}
    //     Average: {average !== null ? average.toFixed(2) + 'dB' : 'N/A'}
    //   </Text>

    //   <TouchableOpacity style={{...styles.micButton, backgroundColor:showMic ? Colors.light.themeColorDarker : "white"}} onPress={handleMicPress}>
    //     <Feather name="mic" size={20} color= { showMic ? "white" : Colors.light.themeColorDarker} />
    //   </TouchableOpacity>
    // </View>
    <>
        <TouchableOpacity style={{...styles.micButton, backgroundColor:showMic ? Colors.light.themeColorDarker : "white"}} onPress={handleMicPress}>
          <Feather name="mic" size={20} color= { showMic ? "red" : Colors.light.themeColorDarker} />
        </TouchableOpacity>
        { showAvg && (
        <View style={styles.avgContainer}>
          <Text style={styles.avg}>Average dB level: {average !== null ? average.toFixed(2) + 'dB' : 'measuring...'}</Text>
          
          {average && average < -20 && (
            <Text style={{fontWeight: '500', color: 'green'}}>Normal level</Text>
          )}
          {average && average > -20 && (
            <Text style={{fontWeight: '500', color: 'red'}}>High level</Text>
          )}
        </View>
        )}
    </>
  );
};
const styles = StyleSheet.create({
  micButton:{
      position: 'absolute',
      top: 180,
      left: 20,
      zIndex: 100,
      padding: 10,
      borderRadius: 60,
  },
  avg:{
    color: Colors.light.themeColorDarker,
    fontWeight: '500'
  },
  avgContainer:{
    position: 'absolute',
    top: 240,
    left: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
  }
})
export default MicButton;

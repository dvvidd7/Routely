import React, { useRef, useState } from 'react';
import { View, Button, Text } from 'react-native';
import { Audio } from 'expo-av';

const SoundLevelMeter = () => {
  const [metering, setMetering] = useState<number | null>(null);
  const [average, setAverage] = useState<number | null>(null);
  const meteringValues = useRef<number[]>([]);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = async () => {
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
        setAverage(sum / meteringValues.current.length);
        console.warn(average);
      } else console.warn("Meterinv values <= 0")
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Button title="Start Measuring" onPress={startRecording} />
      <Button title="Stop Measuring" onPress={stopRecording} />
      <Text style={{ marginTop: 20 }}>
        Sound Level: {metering !== null && metering > -40 ? ' polluted' : 'clean'}
        {'\n'}
        Sound Level: {metering !== null ? metering + 'dB' : 'N/A'}
        {'\n'}
        Average: {average !== null ? average.toFixed(2) + 'dB' : 'N/A'}
      </Text>
    </View>
  );
};

export default SoundLevelMeter;

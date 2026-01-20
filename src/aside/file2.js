import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const ChatBackground = () => {
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#1F2937', '#1F2937']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {/* Cercles décoratifs */}
      <View style={[styles.decorativeCircle, { top: '10%', left: '5%' }]} />
      <View style={[styles.decorativeCircle, { top: '30%', right: '10%' }]} />
      <View style={[styles.decorativeCircle, { bottom: '20%', left: '15%' }]} />
      <View style={[styles.decorativeCircle, { bottom: '40%', right: '5%' }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  decorativeCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#1F2937',
    transform: [{ scale: 1.5 }],
  },
});

export default ChatBackground;
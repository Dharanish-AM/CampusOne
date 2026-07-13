import React from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { Clock } from 'lucide-react-native';

export default function TimetableScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Clock size={48} color="#6366F1" />
        <Text style={styles.title}>Timetable & Schedule</Text>
        <Text style={styles.subtitle}>Daily class schedules and exam lists will appear here soon.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D1A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

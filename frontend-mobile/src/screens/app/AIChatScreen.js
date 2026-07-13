import React from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { MessageSquare } from 'lucide-react-native';

export default function AIChatScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <MessageSquare size={48} color="#8B5CF6" />
        <Text style={styles.title}>AI Chat Assistant</Text>
        <Text style={styles.subtitle}>Chat about timetables, notices, and FAQs will appear here soon.</Text>
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

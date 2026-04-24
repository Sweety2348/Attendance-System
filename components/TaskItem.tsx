import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function TaskItem({ title, isCompleted, onToggle }) {
  return (
    <TouchableOpacity style={styles.container} onPress={onToggle} activeOpacity={0.7}>
      <MaterialCommunityIcons 
        name={isCompleted ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} 
        size={24} 
        color={isCompleted ? "#10B981" : "#0D47A1"} 
      />
      <Text style={[styles.text, isCompleted && styles.completedText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 10,
    elevation: 2,
  },
  text: { marginLeft: 12, fontSize: 16, color: '#1E293B', fontWeight: '500' },
  completedText: { textDecorationLine: 'line-through', color: '#94A3B8' }
});
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function AttendanceAnalytics({ present = 0, total = 22 }) {
  const percentage = Math.round((present / total) * 100);

  return (
    <View style={styles.card}>
      <Text style={styles.header}>Monthly Attendance</Text>
      <View style={styles.row}>
        {/* Progress Circle Visual */}
        <View style={styles.circle}>
          <Text style={styles.percentText}>{percentage}%</Text>
        </View>
        
        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statRow}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#0D47A1" />
            <Text style={styles.statText}>Present: {present} Days</Text>
          </View>
          <View style={styles.statRow}>
            <MaterialCommunityIcons name="calendar-range" size={20} color="#64748B" />
            <Text style={styles.statText}>Total: {total} Days</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', margin: 20, padding: 20, borderRadius: 20, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  header: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 15 },
  row: { flexDirection: 'row', alignItems: 'center' },
  circle: { width: 80, height: 80, borderRadius: 40, borderWidth: 6, borderColor: '#0D47A1', justifyContent: 'center', alignItems: 'center' },
  percentText: { fontSize: 18, fontWeight: 'bold', color: '#0D47A1' },
  stats: { marginLeft: 25 },
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statText: { marginLeft: 10, fontSize: 16, color: '#475569' }
});
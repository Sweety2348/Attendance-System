import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [isPunchedIn, setIsPunchedIn] = useState(false);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* 🚀 Tech Header */}
      <LinearGradient colors={['#1E3A8A', '#2563EB']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greetText}>Morning, Intern</Text>
            <Text style={styles.nameText}>Rishabh Singh</Text>
          </View>
          <MaterialCommunityIcons name="view-grid-plus-outline" size={28} color="white" />
        </View>
      </LinearGradient>

      {/* 📊 Modern Stats Card */}
      <View style={styles.statsWrapper}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>18</Text>
          <Text style={styles.statLabel}>Days Present</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#1E3A8A' }]}>
          <Text style={[styles.statNumber, { color: 'white' }]}>04</Text>
          <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.7)' }]}>Days Left</Text>
        </View>
      </View>

      {/* 🔘 Industrial Punch Button */}
      <View style={styles.punchSection}>
        <Text style={styles.sectionTitle}>Daily Attendance</Text>
        <TouchableOpacity 
          onPress={() => setIsPunchedIn(!isPunchedIn)}
          style={[styles.punchCircle, { borderColor: isPunchedIn ? '#EF4444' : '#10B981' }]}
        >
          <LinearGradient 
            colors={isPunchedIn ? ['#EF4444', '#991B1B'] : ['#10B981', '#065F46']} 
            style={styles.innerPunch}
          >
            <MaterialCommunityIcons name="fingerprint" size={60} color="white" />
            <Text style={styles.punchBtnText}>{isPunchedIn ? 'PUNCH OUT' : 'PUNCH IN'}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.statusInfo}>
          System Status: <Text style={{color: isPunchedIn ? '#10B981' : '#64748B', fontWeight: 'bold'}}>
            {isPunchedIn ? 'Working' : 'Not Started'}
          </Text>
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 30, paddingTop: 60, borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greetText: { color: '#BFDBFE', fontSize: 16 },
  nameText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  
  statsWrapper: { flexDirection: 'row', justifyContent: 'space-around', marginTop: -30, paddingHorizontal: 20 },
  statBox: { backgroundColor: 'white', width: width * 0.4, padding: 20, borderRadius: 20, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#1E3A8A' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 5 },

  punchSection: { padding: 30, alignItems: 'center', marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', alignSelf: 'flex-start', marginBottom: 30 },
  punchCircle: { width: 220, height: 220, borderRadius: 110, borderWidth: 2, padding: 10, justifyContent: 'center', alignItems: 'center' },
  innerPunch: { width: '100%', height: '100%', borderRadius: 100, justifyContent: 'center', alignItems: 'center', elevation: 10 },
  punchBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginTop: 10 },
  statusInfo: { marginTop: 20, color: '#64748B' }
});
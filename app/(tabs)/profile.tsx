import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from "../../firebaseConfig";

export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  const handleLogout = async () => {
    await auth.signOut();
    router.replace('/'); // Login page par bheje
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account" size={50} color="white" />
        </View>
        <Text style={styles.name}>{user?.displayName || "Intern"}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: 'white' },
  profileHeader: { alignItems: 'center', marginTop: 50 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0D47A1', justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 22, fontWeight: 'bold', marginTop: 15 },
  email: { color: '#64748B', marginTop: 5 },
  logoutBtn: { backgroundColor: '#EF4444', padding: 15, borderRadius: 10, marginTop: 40, alignItems: 'center' }
});
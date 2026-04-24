import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { auth, db } from '../../firebaseConfig'; // Corrected path

export default function RecordsScreen() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const q = query(collection(db, "attendance"), where("userId", "==", user.uid), orderBy("timestamp", "desc"));
          const snapshot = await getDocs(q);
          setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) { console.log("Index error?", e); }
      }
      setLoading(false);
    };
    fetchRecords();
  }, []);

  if (loading) return <ActivityIndicator style={{flex:1}} color="#0D47A1" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>
      <FlatList
        data={attendance}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <MaterialCommunityIcons name="calendar-check" size={24} color="#0D47A1" />
            <View style={{ marginLeft: 15 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.date}</Text>
              <Text style={{ color: '#0D47A1' }}>Present ✅</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20, paddingTop: 50 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  card: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 10, alignItems: 'center', elevation: 2 }
});
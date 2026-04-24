import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../firebaseConfig';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert("Required", "Bhai, details fill karna bhul gaye! 🛠️");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        router.replace("/(tabs)"); 
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          name: name,
          email: email,
          role: 'intern',
          createdAt: new Date()
        });
        Alert.alert("Success", "Account created! Welcome to ORPL. ✅");
        setIsLogin(true);
      }
    } catch (error: any) {
      let msg = error.message;
      if (error.code === 'auth/invalid-credential') msg = "Email ya Password galat hai!";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* 🌐 Advanced Connection Branding - Minimalist Hub Style */}
        <View style={styles.brandingSection}>
          <View style={styles.iconContainer}>
            {/* Background Glow Ring */}
            <View style={styles.glowRing} />
            
            {/* Central Node Symbol */}
            <MaterialCommunityIcons name="hubspot" size={90} color="#1E3A8A" style={styles.mainIcon} />
            
            {/* Floating Connectivity Nodes */}
            <MaterialCommunityIcons name="circle-medium" size={30} color="#60A5FA" style={[styles.floatingNode, { top: -10, left: 10 }]} />
            <MaterialCommunityIcons name="circle-medium" size={24} color="#60A5FA" style={[styles.floatingNode, { bottom: 10, right: -5 }]} />
            <MaterialCommunityIcons name="circle-medium" size={20} color="#94A3B8" style={[styles.floatingNode, { top: 30, right: -15 }]} />
          </View>
          
          <Text style={styles.brandName}>ORPL INTERNS</Text>
          <View style={styles.divider} />
          <Text style={styles.tagline}>Connected Intelligence</Text>
        </View>

        {/* Auth Card */}
        <View style={styles.authCard}>
          <Text style={styles.welcomeText}>{isLogin ? "Welcome Back" : "Register Intern"}</Text>

          {!isLogin && (
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="account-outline" size={20} color="#94A3B8" />
              <TextInput 
                style={styles.textInput} 
                placeholder="Full Name" 
                placeholderTextColor="#94A3B8"
                value={name} 
                onChangeText={setName} 
              />
            </View>
          )}

          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="email-outline" size={20} color="#94A3B8" />
            <TextInput 
              style={styles.textInput} 
              placeholder="Email Address" 
              placeholderTextColor="#94A3B8"
              value={email} 
              onChangeText={setEmail} 
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="lock-outline" size={20} color="#94A3B8" />
            <TextInput 
              style={styles.textInput} 
              placeholder="Password" 
              placeholderTextColor="#94A3B8"
              value={password} 
              onChangeText={setPassword} 
              secureTextEntry 
            />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleAuth} disabled={loading}>
            <LinearGradient colors={['#1E3A8A', '#2563EB']} style={styles.gradient}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.btnText}>{isLogin ? "LOG IN" : "SIGN UP"}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.toggleBtn}>
            <Text style={styles.toggleLabel}>
              {isLogin ? "New to ORPL? " : "Already an intern? "}
              <Text style={styles.toggleAction}>{isLogin ? "Sign Up" : "Login"}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 25 },
  
  // 🔗 Connection Branding Styles
  brandingSection: { alignItems: 'center', marginBottom: 40 },
  iconContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  mainIcon: {
    zIndex: 2,
    textShadowColor: 'rgba(30, 58, 138, 0.3)',
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 10,
  },
  floatingNode: { position: 'absolute', zIndex: 1 },
  brandName: { 
    fontSize: 32, 
    fontWeight: '900', 
    color: '#1E3A8A', 
    letterSpacing: 1,
    marginTop: 15 
  },
  divider: { 
    width: 40, 
    height: 3, 
    backgroundColor: '#3B82F6', 
    borderRadius: 2, 
    marginVertical: 8 
  },
  tagline: { 
    fontSize: 12, 
    color: '#64748B', 
    letterSpacing: 3, 
    textTransform: 'uppercase', 
    fontWeight: '700' 
  },

  // Auth Card Styles
  authCard: { 
    backgroundColor: 'white', 
    padding: 30, 
    borderRadius: 25, 
    elevation: 8, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 20 
  },
  welcomeText: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 25, textAlign: 'center' },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC', 
    borderRadius: 12, 
    marginBottom: 15, 
    paddingHorizontal: 15, 
    borderWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  textInput: { flex: 1, paddingVertical: 14, paddingHorizontal: 10, fontSize: 16, color: '#1E293B' },
  submitBtn: { marginTop: 10, borderRadius: 12, overflow: 'hidden' },
  gradient: { padding: 18, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  toggleBtn: { marginTop: 20, alignItems: 'center' },
  toggleLabel: { color: '#64748B' },
  toggleAction: { color: '#1E3A8A', fontWeight: 'bold' }
});
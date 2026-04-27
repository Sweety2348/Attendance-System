import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Path, Svg } from 'react-native-svg';
import { auth, db } from '../../firebaseConfig';

const { width } = Dimensions.get('window');

// ── FloatingBubble (same as HomeHeader) ────────────────────────────────────
interface BubbleProps {
  size: number;
  color: string;
  border?: string;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  duration: number;
  delay?: number;
  tx: number;
  ty: number;
}

function FloatingBubble({
  size, color, border, top, bottom, left, right,
  duration, delay = 0, tx, ty,
}: BubbleProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1, duration: duration / 2, delay,
          easing: Easing.inOut(Easing.sin), useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0, duration: duration / 2,
          easing: Easing.inOut(Easing.sin), useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, tx] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, ty] });

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: color,
          borderWidth: border ? 1 : 0,
          borderColor: border ?? 'transparent',
          top, bottom, left, right,
          transform: [{ translateX }, { translateY }],
        },
      ]}
    />
  );
}

// ── InfoRow ─────────────────────────────────────────────────────────────────
interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  showDivider?: boolean;
  delay?: number;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

function InfoRow({ icon, label, value, showDivider = true, fadeAnim, slideAnim }: InfoRowProps) {
  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={styles.infoRow}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name={icon as any} size={18} color="#0C447C" />
        </View>
        <View style={styles.infoText}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      </View>
      {showDivider && <View style={styles.rowDivider} />}
    </Animated.View>
  );
}

// ── StatChip ────────────────────────────────────────────────────────────────
function StatChip({ icon, val, sub }: { icon: string; val: string; sub: string }) {
  return (
    <View style={styles.statChip}>
      <MaterialCommunityIcons name={icon as any} size={20} color="#185FA5" style={{ marginBottom: 4 }} />
      <Text style={styles.statVal}>{val}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  );
}

// ── Main ProfileScreen ───────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const cardFade  = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(30)).current;
  const statFade  = useRef(new Animated.Value(0)).current;

  // Auth state listener — jab bhi user null ho jaye (logout), login screen pe bhejo
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.replace('/');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(statFade, { toValue: 1, duration: 350, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(cardFade, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(cardSlide, { toValue: 0, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [loading]);

  const handleLogout = async () => {
    await auth.signOut();
    router.replace('/');
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#185FA5" />
      </View>
    );
  }

  const initials = userData?.fullName
    ? userData.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <View style={styles.container}>

      {/* ── Dark Header ── */}
      <View style={styles.header}>

        {/* Floating Bubbles — matches HomeHeader exactly */}
        <FloatingBubble size={180} color="rgba(24,95,165,0.22)"   top={-70}  right={-50} duration={8000} tx={-10} ty={-16} />
        <FloatingBubble size={100} color="rgba(24,95,165,0.14)"  border="rgba(24,95,165,0.22)" top={10}  right={20}  duration={6000} tx={12}  ty={-8} />
        <FloatingBubble size={50}  color="rgba(255,255,255,0.05)" border="rgba(255,255,255,0.1)" top={68}  right={16}  duration={5000} tx={-5}  ty={12} />
        <FloatingBubble size={110} color="rgba(24,95,165,0.12)"   bottom={44} left={-36}  duration={7000} tx={9}   ty={-10} />
        <FloatingBubble size={44}  color="rgba(24,95,165,0.10)"  border="rgba(24,95,165,0.18)" top={100} left={52}   duration={5500} delay={1000} tx={-7} ty={8} />
        <FloatingBubble size={22}  color="rgba(255,255,255,0.06)" border="rgba(255,255,255,0.12)" top={44}  left={148}  duration={4000} delay={500}  tx={-5} ty={12} />
        <FloatingBubble size={140} color="rgba(12,52,110,0.28)"   bottom={20} right={-30}  duration={9000} tx={0}   ty={0} />

        {/* Avatar + Name */}
        <Animated.View style={[styles.headerContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Avatar with initials */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarRing}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          </View>

          <Text style={styles.name}>{userData?.fullName || 'User'}</Text>
        </Animated.View>

        {/* Wave — same path as HomeHeader */}
        <View style={styles.wave}>
          <Svg height="60" width={width} viewBox={`0 0 ${width} 60`}>
            <Path
              fill="#f0f4ff"
              d={`M0,24 C${width * 0.16},44 ${width * 0.32},6 ${width * 0.5},26 C${width * 0.63},40 ${width * 0.79},12 ${width},24 L${width},60 L0,60 Z`}
            />
          </Svg>
        </View>
      </View>

      {/* ── Scrollable Body ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >

        {/* Section label */}
        <Animated.Text style={[styles.sectionLabel, { opacity: cardFade }]}>
          Personal Info
        </Animated.Text>

        {/* Info Card */}
        <Animated.View
          style={[
            styles.card,
            { opacity: cardFade, transform: [{ translateY: cardSlide }] },
          ]}
        >
          <InfoRow
            icon="account-outline"
            label="Full Name"
            value={userData?.fullName || 'N/A'}
            fadeAnim={cardFade}
            slideAnim={cardSlide}
          />
          <InfoRow
            icon="email-outline"
            label="Email ID"
            value={user?.email || 'N/A'}
            fadeAnim={cardFade}
            slideAnim={cardSlide}
          />
          <InfoRow
            icon="office-building-outline"
            label="Department"
            value={userData?.department || 'N/A'}
            fadeAnim={cardFade}
            slideAnim={cardSlide}
          />
          <InfoRow
            icon="calendar-outline"
            label="Joining Date"
            value={userData?.joiningDate || 'N/A'}
            fadeAnim={cardFade}
            slideAnim={cardSlide}
          />
          
        </Animated.View>

        {/* Logout Button */}
        <Animated.View style={{ opacity: cardFade, transform: [{ translateY: cardSlide }] }}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.82}>
            <MaterialCommunityIcons name="logout" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff',
  },

  // ── Header ──
  header: {
    backgroundColor: '#071e45',
    paddingTop: 52,
    paddingHorizontal: 22,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
  },
  bubble: { position: 'absolute' },

  headerContent: {
    alignItems: 'center',
    zIndex: 2,
    width: '100%',
  },

  avatarWrapper: {
    marginBottom: 14,
    position: 'relative',
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: '#185FA5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(133,183,235,0.45)',
    elevation: 8,
    shadowColor: '#185FA5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#071e45',
  },

  name: {
    fontSize: 22,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  role: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.3,
    marginBottom: 18,
  },

  // ── Stats Row ──
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.2,
  },
  statSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.2,
  },
  statsDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  wave: {
    marginHorizontal: -22,
    marginBottom: -1,
    zIndex: 1,
    marginTop: 0,
  },

  // ── Body ──
  body: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#185FA5',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: 14,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E6F1FB',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  infoText: { flex: 1 },
  label: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  rowDivider: {
    height: 0.5,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginLeft: 64,
  },

  // ── Active Badge ──
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dcfce7',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 2,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  activeTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803d',
  },

  // ── Logout ──
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoutText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Path, Svg } from 'react-native-svg';

const { width } = Dimensions.get('window');

type CheckState = 'idle' | 'in';

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function getTimeStr() {
  const now = new Date();
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good Morning';
  if (h >= 12 && h < 17) return 'Good Afternoon';
  if (h >= 17 && h < 21) return 'Good Evening';
  return 'Good Night';
}
function getDateParts() {
  const now = new Date();
  const days = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return {
    day: days[now.getDay()],
    date: String(now.getDate()).padStart(2, '0'),
    month: months[now.getMonth()],
  };
}
function getFullDate() {
  const now = new Date();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

// ── FloatingBubble ─────────────────────────────────────────────────────────
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

function FloatingBubble({ size, color, border, top, bottom, left, right, duration, delay = 0, tx, ty }: BubbleProps) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: duration / 2, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, tx] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, ty] });
  return (
    <Animated.View
      style={[styles.bubble, {
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color,
        borderWidth: border ? 1 : 0,
        borderColor: border ?? 'transparent',
        top, bottom, left, right,
        transform: [{ translateX }, { translateY }],
      }]}
    />
  );
}

// ── RippleRing ─────────────────────────────────────────────────────────────
function RippleRing() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] });
  const opacity = anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.5, 0.3, 0] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', width: 44, height: 44, borderRadius: 22,
        borderWidth: 1.5, borderColor: 'rgba(24,95,165,0.5)',
        left: 13, top: 13,
        transform: [{ scale }], opacity,
      }}
    />
  );
}

// ── CheckInButton ──────────────────────────────────────────────────────────
interface CIButtonProps {
  state: CheckState;
  ciTime: string;
  onPress: () => void;
}

function CheckInButton({ state, ciTime, onPress }: CIButtonProps) {
  const isIn = state === 'in';

  const btnBg      = isIn ? 'rgba(24,95,165,0.14)' : 'rgba(255,255,255,0.07)';
  const btnBorder  = isIn ? 'rgba(24,95,165,0.35)' : 'rgba(255,255,255,0.13)';
  const iconBg     = isIn ? 'rgba(24,95,165,0.22)' : 'rgba(255,255,255,0.09)';
  const iconBorder = isIn ? 'rgba(24,95,165,0.4)'  : 'rgba(255,255,255,0.12)';
  const iconColor  = isIn ? '#185FA5'                : 'rgba(255,255,255,0.75)';
  const hintColor  = isIn ? '#85B7EB'                : 'rgba(255,255,255,0.4)';
  const iconName: 'log-in' | 'check-circle' = isIn ? 'check-circle' : 'log-in';

  return (
    <TouchableOpacity
      activeOpacity={isIn ? 1 : 0.85}
      onPress={isIn ? undefined : onPress}
      style={[styles.ciBtn, { backgroundColor: btnBg, borderColor: btnBorder }]}
    >
      {isIn && <RippleRing />}
      <View style={[styles.ciIconBox, { backgroundColor: iconBg, borderColor: iconBorder }]}>
        <Feather name={iconName} size={20} color={iconColor} />
      </View>
      <View style={styles.ciBody}>
        <Text style={styles.ciLabel}>{isIn ? 'Checked In' : 'Check In'}</Text>
        <Text style={[styles.ciHint, { color: hintColor }]}>{isIn ? `Since ${ciTime}` : 'Tap to mark attendance'}</Text>
      </View>
      <View style={styles.ciRight}>
        {!isIn && <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.3)" />}
      </View>
    </TouchableOpacity>
  );
}

// ── ProjectReport ──────────────────────────────────────────────────────────
function ProjectReport() {
  const [report, setReport] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (!report.trim()) return;
    setSubmitted(true);
  }

  return (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.reportIconBox}>
          <Feather name="file-text" size={16} color="#0C447C" />
        </View>
        <Text style={styles.reportTitle}>Today's project report</Text>
      </View>

      {submitted ? (
        <View style={styles.successRow}>
          <Feather name="check-circle" size={16} color="#185FA5" />
          <Text style={styles.successText}>Report submitted successfully!</Text>
        </View>
      ) : (
        <>
          <TextInput
            style={styles.textArea}
            placeholder="What did you work on today? Tasks, progress, issues..."
            placeholderTextColor="rgba(0,0,0,0.3)"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={report}
            onChangeText={setReport}
          />
          <TouchableOpacity
            style={[styles.submitBtn, !report.trim() ? styles.submitBtnEmpty : styles.submitBtnActive]}
            onPress={report.trim() ? handleSubmit : undefined}
            activeOpacity={report.trim() ? 0.85 : 1}
          >
            <Feather name="send" size={15} color="#fff" />
            <Text style={styles.submitBtnText}>Submit report</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// ── Main HomeHeader ────────────────────────────────────────────────────────
export default function HomeHeader() {
  const [greeting, setGreeting] = useState(getGreeting());
  const [dateParts, setDateParts] = useState(getDateParts());
  const [checkState, setCheckState] = useState<CheckState>('idle');
  const [ciTime, setCiTime] = useState('');

  const slideAnim = useRef(new Animated.Value(14)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay: 100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();

    const timer = setInterval(() => {
      setGreeting(getGreeting());
      setDateParts(getDateParts());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  function handleCheckIn() {
    if (checkState === 'idle') {
      setCheckState('in');
      setCiTime(getTimeStr());
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* ── Dark Header ── */}
        <View style={styles.header}>
          <FloatingBubble size={180} color="rgba(24,95,165,0.22)"   top={-70}  right={-50} duration={8000} tx={-10} ty={-16} />
          <FloatingBubble size={100} color="rgba(24,95,165,0.14)"  border="rgba(24,95,165,0.22)" top={10} right={20} duration={6000} tx={12} ty={-8} />
          <FloatingBubble size={50}  color="rgba(255,255,255,0.05)" border="rgba(255,255,255,0.1)" top={68} right={16} duration={5000} tx={-5} ty={12} />
          <FloatingBubble size={110} color="rgba(24,95,165,0.12)"   bottom={44} left={-36} duration={7000} tx={9} ty={-10} />
          <FloatingBubble size={44}  color="rgba(24,95,165,0.10)"  border="rgba(24,95,165,0.18)" top={100} left={52} duration={5500} delay={1000} tx={-7} ty={8} />
          <FloatingBubble size={22}  color="rgba(255,255,255,0.06)" border="rgba(255,255,255,0.12)" top={44} left={148} duration={4000} delay={500} tx={-5} ty={12} />
          <FloatingBubble size={140} color="rgba(12,52,110,0.28)"   bottom={20} right={-30} duration={9000} tx={0} ty={0} />

          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.topRow}>
              <View style={styles.leftCol}>
                <View style={styles.greetRow}>
                  <Feather name="sun" size={12} color="rgba(255,255,255,0.4)" style={{ marginRight: 4 }} />
                  <Text style={styles.greetLabel}>{greeting}</Text>
                </View>
                <Text style={styles.name}>Sweety Shrivas</Text>
              </View>
              <View style={styles.dateChip}>
                <Text style={styles.dcDay}>{dateParts.day}</Text>
                <Text style={styles.dcDate}>{dateParts.date}</Text>
                <Text style={styles.dcMonth}>{dateParts.month}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <CheckInButton
              state={checkState}
              ciTime={ciTime}
              onPress={handleCheckIn}
            />
          </Animated.View>

          <View style={styles.wave}>
            <Svg height="60" width={width} viewBox={`0 0 ${width} 60`}>
              <Path
                fill="#f0f4ff"
                d={`M0,24 C${width*0.16},44 ${width*0.32},6 ${width*0.5},26 C${width*0.63},40 ${width*0.79},12 ${width},24 L${width},60 L0,60 Z`}
              />
            </Svg>
          </View>
        </View>

        {/* ── Project Report ── */}
        <ProjectReport />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    backgroundColor: '#071e45',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingTop: 52,
    paddingHorizontal: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  bubble: { position: 'absolute' },
  content: { position: 'relative', zIndex: 2 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  leftCol: { flexDirection: 'column', gap: 6 },
  greetRow: { flexDirection: 'row', alignItems: 'center' },
  greetLabel: { fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.2 },
  name: { fontSize: 26, fontWeight: '500', color: '#ffffff', letterSpacing: -0.5, lineHeight: 30 },
  dateChip: { alignItems: 'flex-end', gap: 2 },
  dcDay: { fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.4 },
  dcDate: { fontSize: 22, fontWeight: '500', color: 'rgba(255,255,255,0.88)' },
  dcMonth: { fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.3 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 14 },

  ciBtn: { flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1, borderRadius: 20, padding: 13, marginBottom: 0, overflow: 'hidden', position: 'relative' },
  ciIconBox: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  ciBody: { flex: 1, gap: 3 },
  ciLabel: { fontSize: 14, fontWeight: '500', color: '#ffffff' },
  ciHint: { fontSize: 11 },
  ciRight: { alignItems: 'flex-end', gap: 2 },
  ciClock: { fontSize: 19, fontWeight: '500', color: 'rgba(255,255,255,0.9)' },

  wave: { marginHorizontal: -22, marginBottom: -1, zIndex: 1, marginTop: 18 },

  // ── Report Card ──
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  reportHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  reportIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#E6F1FB', justifyContent: 'center', alignItems: 'center' },
  reportTitle: { fontSize: 14, fontWeight: '500', color: '#1a1a1a', flex: 1 },
  reportDate: { fontSize: 11, color: '#888' },
  textArea: {
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#1a1a1a',
    backgroundColor: '#f8f9fb',
    minHeight: 110,
    lineHeight: 20,
  },
  submitBtn: {
    marginTop: 10,
    borderRadius: 13,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  submitBtnEmpty: {
    backgroundColor: '#185FA5',
    borderWidth: 1,
    borderColor: '#185FA5',
    opacity: 1,
  },
  submitBtnActive: {
    backgroundColor: '#185FA5',
    borderWidth: 1,
    borderColor: '#185FA5',
  },
  submitBtnDisabled: { backgroundColor: '#B5D4F4' },
  submitBtnText: { fontSize: 14, fontWeight: '500', color: '#fff' },
  successRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, backgroundColor: '#E6F1FB', borderRadius: 13 },
  successText: { fontSize: 13, fontWeight: '500', color: '#0C447C' },
});
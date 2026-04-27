import Ionicons from '@expo/vector-icons/Ionicons';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { auth, db } from '../../firebaseConfig';

const { width, height } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS         = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS       = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function getDaysInMonth(y: number, m: number) { return new Date(y, m+1, 0).getDate(); }
function getFirstDay(y: number, m: number)    { return new Date(y, m, 1).getDay(); }

function formatTime(val: any): string {
  if (!val) return '—';
  if (val?.toDate) return val.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (typeof val === 'string') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return val;
  }
  return String(val);
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${DAYS[date.getDay()]}, ${d} ${MONTHS[m - 1]} ${y}`;
}

// ─── Floating Bubble ──────────────────────────────────────────────────────────

interface BubbleCfg {
  size: number; x: number; y: number;
  duration: number; delay: number; opacity: number;
}

const BUBBLE_CONFIGS: BubbleCfg[] = [
  { size: 130, x: width * 0.68, y: 40,  duration: 6200, delay: 0,    opacity: 0.15 },
  { size: 85,  x: -20,          y: 180, duration: 7800, delay: 900,  opacity: 0.11 },
  { size: 55,  x: width * 0.50, y: 310, duration: 5600, delay: 400,  opacity: 0.09 },
  { size: 42,  x: width * 0.15, y: 520, duration: 8200, delay: 1800, opacity: 0.08 },
  { size: 95,  x: width * 0.76, y: 500, duration: 6700, delay: 300,  opacity: 0.12 },
  { size: 32,  x: width * 0.35, y: 700, duration: 7100, delay: 1400, opacity: 0.07 },
  { size: 60,  x: width * 0.05, y: 650, duration: 5900, delay: 2200, opacity: 0.10 },
];

function FloatingBubble({ cfg }: { cfg: BubbleCfg }) {
  const transY = useRef(new Animated.Value(0)).current;
  const transX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(transY, { toValue: -20, duration: cfg.duration, delay: cfg.delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(transY, { toValue: 0,   duration: cfg.duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(transX, { toValue: 12,  duration: cfg.duration * 1.4, delay: cfg.delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(transX, { toValue: -12, duration: cfg.duration * 1.4, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', left: cfg.x, top: cfg.y,
        width: cfg.size, height: cfg.size, borderRadius: cfg.size / 2,
        backgroundColor: `rgba(26, 60, 143, ${cfg.opacity})`,
        transform: [{ translateY: transY }, { translateX: transX }],
      }}
    />
  );
}

// ─── Report Bottom Sheet ───────────────────────────────────────────────────────

interface ReportSheetProps {
  visible: boolean;
  record: any;
  dateStr: string;
  onClose: () => void;
}

function ReportSheet({ visible, record, dateStr, onClose }: ReportSheetProps) {
  const slideAnim   = useRef(new Animated.Value(500)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 1, duration: 280,
          easing: Easing.out(Easing.ease), useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0, useNativeDriver: true,
          damping: 22, stiffness: 200, mass: 1,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 0, duration: 200,
          easing: Easing.in(Easing.ease), useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 500, duration: 240,
          easing: Easing.in(Easing.ease), useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted || !record || !dateStr) return null;

  const checkIn     = formatTime(record.checkIn  ?? record.checkin  ?? record.check_in);
  const checkOut    = formatTime(record.checkOut ?? record.checkout ?? record.check_out);
  const projectNote = record.projectReport ?? record.project ?? record.notes ?? record.remarks ?? '';
  const status      = record.status ?? 'Present';
  const isLate      = record.late ?? record.isLate ?? false;
  const hoursWorked = record.hoursWorked ?? record.hours ?? record.duration ?? null;

  return (
    <Modal transparent visible={mounted} animationType="none" onRequestClose={onClose}>

      {/* Gray overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(0,0,0,0.38)', opacity: overlayAnim },
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Sheet sliding up */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>

        {/* Drag handle */}
        <View style={styles.handle} />

        {/* ── Header: date + close ── */}
        <View style={styles.sheetHeader}>
          <View style={styles.sheetHeaderLeft}>
            <View style={styles.calIconBox}>
              <Ionicons name="calendar-outline" size={22} color={NAV} />
            </View>
            <View>
              <Text style={styles.sheetDate}>{formatDate(dateStr)}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.sheetDivider} />

        {/* ── Check-in / Check-out ── */}
        {checkIn !== '—' && (
          <View style={styles.timeRow}>
            <View style={styles.timeIconBox}>
              <Ionicons name="time-outline" size={18} color={NAV} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.timeLabel}>Check-in</Text>
              {checkOut !== '—' && (
                <Text style={[styles.timeLabel, { marginTop: 6 }]}>Check-out</Text>
              )}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.timeVal}>{checkIn}</Text>
              {checkOut !== '—' && (
                <Text style={[styles.timeVal, { marginTop: 6 }]}>{checkOut}</Text>
              )}
            </View>
          </View>
        )}

        {/* Hours worked */}
        {hoursWorked && (
          <View style={[styles.timeRow, { marginTop: 4 }]}>
            <View style={styles.timeIconBox}>
              <Ionicons name="hourglass-outline" size={18} color={NAV} />
            </View>
            <Text style={[styles.timeLabel, { flex: 1 }]}>Hours Worked</Text>
            <Text style={styles.timeVal}>{hoursWorked}</Text>
          </View>
        )}

        {/* ── Project report ── */}
        {projectNote.length > 0 && (
          <>
            <Text style={styles.projectLabel}>Project report</Text>
            <View style={styles.projectBox}>
              <Text style={styles.projectTxt}>{projectNote}</Text>
            </View>
          </>
        )}

        {/* Empty state */}
        {checkIn === '—' && !projectNote && (
          <View style={styles.emptySheet}>
            <Text style={styles.emptySheetTxt}>No details recorded for this day.</Text>
          </View>
        )}

      </Animated.View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RecordsScreen() {
  const [attendance, setAttendance]       = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [selectedDate, setSelectedDate]   = useState<string | null>(null);
  const [reportVisible, setReportVisible] = useState(false);

  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear,  setCalYear]  = useState(today.getFullYear());

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  const handleDateSelect = (dateStr: string, month?: number, year?: number) => {
    setSelectedDate(dateStr);
    if (month !== undefined) setCalMonth(month);
    if (year  !== undefined) setCalYear(year);
    setReportVisible(true);
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    (async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const q = query(
            collection(db, 'attendance'),
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc'),
          );
          const snap = await getDocs(q);
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setAttendance(docs);
          const todayStr = toYMD(today);
          const match = docs.find((d: any) => d.date === todayStr);
          setSelectedDate(match ? todayStr : docs[0]?.date ?? null);
        } catch (e) { console.log(e); }
      }
      setLoading(false);
    })();
  }, []);

  const presentSet = new Set(attendance.map((a: any) => a.date as string));
  const todayStr   = toYMD(today);

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay    = getFirstDay(calYear, calMonth);
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const chips = [...presentSet].sort();
  const selectedRecord = selectedDate
    ? attendance.find((a: any) => a.date === selectedDate) ?? null
    : null;

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  if (loading) return (
    <View style={styles.loadingScreen}>
      <Text style={styles.loadingTxt}>Loading...</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF2FB" />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {BUBBLE_CONFIGS.map((cfg, i) => <FloatingBubble key={i} cfg={cfg} />)}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.title}>Attendance</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>{presentSet.size} days</Text>
          </View>
        </Animated.View>

        {/* Calendar */}
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.monthNav}>
            <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
              <Text style={styles.navArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{MONTHS[calMonth]} {calYear}</Text>
            <TouchableOpacity style={styles.navBtn} onPress={nextMonth}>
              <Text style={styles.navArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dayRow}>
            {DAYS.map(d => <Text key={d} style={styles.dayHdr}>{d}</Text>)}
          </View>

          <View style={styles.grid}>
            {cells.map((day, idx) => {
              if (!day) return <View key={`e${idx}`} style={styles.cell} />;
              const dateStr    = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const isPresent  = presentSet.has(dateStr);
              const isToday    = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={styles.cell}
                  onPress={() => isPresent && handleDateSelect(dateStr)}
                  activeOpacity={isPresent ? 0.7 : 1}
                >
                  <View style={[
                    styles.dayCircle,
                    isPresent  && !isSelected && styles.dayPresent,
                    isSelected && isPresent   && styles.daySelected,
                    isToday    && !isPresent  && styles.dayToday,
                  ]}>
                    <Text style={[
                      styles.dayNum,
                      isPresent  && !isSelected && styles.dayNumPresent,
                      isSelected && isPresent   && styles.dayNumSelected,
                      isToday    && !isPresent  && styles.dayNumToday,
                    ]}>{day}</Text>
                    {isPresent && <View style={[styles.dot, isSelected && styles.dotSel]} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.divider} />
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#1A3C8F' }]} />
              <Text style={styles.legendTxt}>Present</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { borderWidth: 1.5, borderColor: '#1A3C8F', backgroundColor: 'transparent' }]} />
              <Text style={styles.legendTxt}>Today</Text>
            </View>
          </View>
        </Animated.View>

        {/* Chip label */}
        <Text style={styles.chipLabel}>
          {SHORT_MONTHS[calMonth]} — tap to view report
        </Text>

        {/* Date chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipStrip}
        >
          {chips.map(dateStr => {
            const d = new Date(dateStr);
            const isActive = dateStr === selectedDate;
            return (
              <TouchableOpacity
                key={dateStr}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => handleDateSelect(dateStr, d.getMonth(), d.getFullYear())}
              >
                <Text style={[styles.chipMon, isActive && styles.chipTxtActive]}>
                  {SHORT_MONTHS[d.getMonth()]}
                </Text>
                <Text style={[styles.chipDay, isActive && styles.chipTxtActive]}>
                  {String(d.getDate()).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {attendance.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTxt}>No attendance records yet</Text>
          </View>
        )}
      </ScrollView>

      {/* ── Bottom Sheet Modal ── */}
      <ReportSheet
        visible={reportVisible}
        record={selectedRecord}
        dateStr={selectedDate ?? ''}
        onClose={() => setReportVisible(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const NAV = '#1A3C8F';

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#EEF2FB' },
  loadingScreen: { flex: 1, backgroundColor: '#EEF2FB', alignItems: 'center', justifyContent: 'center' },
  loadingTxt:    { color: NAV, fontSize: 16 },

  header:   { flexDirection: 'row', alignItems: 'center', paddingTop: 54, paddingHorizontal: 20, marginBottom: 18 },
  title:    { fontSize: 28, fontWeight: '700', color: '#111' },
  badge:    { backgroundColor: '#D6E3FA', borderRadius: 20, paddingHorizontal: 11, paddingVertical: 3, marginLeft: 10 },
  badgeTxt: { color: NAV, fontWeight: '600', fontSize: 13 },

  card: {
    backgroundColor: '#fff', borderRadius: 22,
    marginHorizontal: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.08,
    shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },

  monthNav:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn:     { width: 34, height: 34, borderRadius: 9, borderWidth: 1, borderColor: '#DDD', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA' },
  navArrow:   { fontSize: 20, color: '#444', lineHeight: 24 },
  monthLabel: { fontSize: 17, fontWeight: '700', color: '#111' },

  dayRow: { flexDirection: 'row', marginBottom: 4 },
  dayHdr: { flex: 1, textAlign: 'center', fontSize: 11, color: '#BBB', fontWeight: '600' },

  grid:           { flexDirection: 'row', flexWrap: 'wrap' },
  cell:           { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCircle:      { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  dayPresent:     { backgroundColor: '#DDE8FA' },
  daySelected:    { backgroundColor: NAV },
  dayToday:       { borderWidth: 1.5, borderColor: NAV },
  dayNum:         { fontSize: 13, color: '#333', fontWeight: '500' },
  dayNumPresent:  { color: NAV, fontWeight: '700' },
  dayNumSelected: { color: '#fff', fontWeight: '700' },
  dayNumToday:    { color: NAV, fontWeight: '700' },
  dot:            { width: 4, height: 4, borderRadius: 2, backgroundColor: NAV, marginTop: 1 },
  dotSel:         { backgroundColor: '#fff' },

  divider:    { height: 1, backgroundColor: '#F2F2F2', marginVertical: 12 },
  legendRow:  { flexDirection: 'row', gap: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:  { width: 14, height: 14, borderRadius: 4 },
  legendTxt:  { fontSize: 12, color: '#666' },

  chipLabel:     { fontSize: 12, color: '#999', marginTop: 20, marginBottom: 10, marginLeft: 20 },
  chipStrip:     { paddingHorizontal: 16, gap: 10, paddingBottom: 6 },
  chip:          { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  chipActive:    { backgroundColor: NAV },
  chipMon:       { fontSize: 11, color: '#999', fontWeight: '500' },
  chipDay:       { fontSize: 20, fontWeight: '800', color: '#222', marginTop: 2 },
  chipTxtActive: { color: '#fff' },

  emptyBox:  { alignItems: 'center', paddingVertical: 50 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyTxt:  { fontSize: 15, color: '#BBB' },

  // ── Bottom Sheet ──────────────────────────────────────────────────────────
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: -8 },
    elevation: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D0D0',
    marginBottom: 16,
  },

  sheetHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  calIconBox:      { width: 42, height: 42, borderRadius: 12, backgroundColor: '#EEF2FB', alignItems: 'center', justifyContent: 'center' },
  sheetDate:       { fontSize: 15, fontWeight: '700', color: '#111' },
  closeBtn:        { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },

  sheetDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 16 },

  timeRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  timeIconBox: { width: 34, height: 34, borderRadius: 9, backgroundColor: '#EEF2FB', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  timeLabel:   { fontSize: 13, color: '#888' },
  timeVal:     { fontSize: 13, fontWeight: '700', color: '#111' },

  projectLabel: { fontSize: 13, color: '#888', marginBottom: 8, marginTop: 2 },
  projectBox:   {
    backgroundColor: '#F7F9FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E4ECFA',
  },
  projectTxt: { fontSize: 14, color: '#333', lineHeight: 22 },

  emptySheet:    { paddingVertical: 28, alignItems: 'center' },
  emptySheetTxt: { fontSize: 14, color: '#BBB' },
});
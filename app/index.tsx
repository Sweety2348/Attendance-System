import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { auth, db } from '../firebaseConfig';

const { width } = Dimensions.get('window');

// ── Gentle floating bubble ────────────────────────────────────────────────────
const BubbleFloat = ({ size, x, y, delay }: {
    size: number; x: number; y: number; delay: number;
}) => {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim, { toValue: 1, duration: 3000 + delay * 10, useNativeDriver: true, delay }),
                Animated.timing(anim, { toValue: 0, duration: 3000 + delay * 10, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });
    const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 6] });
    const opacity    = anim.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0.3, 0.7, 0.7, 0.3] });

    return (
        <Animated.View style={{
            position: 'absolute',
            top: y,
            left: x,
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: size > 15
                ? 'rgba(96,165,250,0.10)'
                : 'rgba(255,255,255,0.15)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.20)',
            transform: [{ translateY }, { translateX }],
            opacity,
        }} />
    );
};

// ── Bubble positions ──────────────────────────────────────────────────────────
const BUBBLES = [
    { size: 14, x: 20,        y: 30,  delay: 0    },
    { size: 9,  x: 60,        y: 120, delay: 400  },
    { size: 22, x: width-60,  y: 20,  delay: 800  },
    { size: 11, x: width-40,  y: 110, delay: 200  },
    { size: 7,  x: 130,       y: 60,  delay: 1200 },
    { size: 18, x: width/2,   y: 15,  delay: 600  },
    { size: 8,  x: 80,        y: 180, delay: 1000 },
    { size: 13, x: width-100, y: 160, delay: 300  },
    { size: 6,  x: 200,       y: 140, delay: 900  },
    { size: 16, x: 40,        y: 220, delay: 500  },
    { size: 10, x: width-80,  y: 70,  delay: 700  },
    { size: 5,  x: 160,       y: 200, delay: 1100 },
];

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [department, setDepartment] = useState('');
    const [focusedField, setFocusedField] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(0);
    const router = useRouter();

    const tabAnim = useRef(new Animated.Value(0)).current;

    // ── Ref for horizontal swipe ScrollView ───────────────────────────────────
    const cardScrollRef = useRef<ScrollView>(null);

    // ── Switch tab + animate tab indicator (called from button press) ─────────
    const switchMode = (toLogin: boolean) => {
        animateTab(toLogin);
        setIsLogin(toLogin);
        resetFields();
        // Scroll the card horizontally to the correct page
        cardScrollRef.current?.scrollTo({ x: toLogin ? 0 : width, animated: true });
    };

    // ── Switch tab state only, NO scroll (called from swipe end) ─────────────
    const switchModeNoScroll = (toLogin: boolean) => {
        animateTab(toLogin);
        setIsLogin(toLogin);
        resetFields();
    };

    const animateTab = (toLogin: boolean) => {
        Animated.spring(tabAnim, {
            toValue: toLogin ? 0 : 1,
            useNativeDriver: false,
            tension: 80,
            friction: 10,
        }).start();
    };

    const resetFields = () => {
        setPassword(''); setEmail('');
        setName(''); setDepartment('');
        setPasswordStrength(0); setFocusedField('');
    };

    const checkPasswordStrength = (pass: string) => {
        let strength = 0;
        if (pass.length >= 6) strength++;
        if (pass.length >= 10) strength++;
        if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) strength++;
        setPasswordStrength(strength);
    };

    const getStrengthColor = () => {
        if (passwordStrength === 1) return '#EF4444';
        if (passwordStrength === 2) return '#F59E0B';
        if (passwordStrength === 3) return '#10B981';
        return '#E2E8F0';
    };

    const getStrengthLabel = () => {
        if (passwordStrength === 1) return 'Weak';
        if (passwordStrength === 2) return 'Medium';
        if (passwordStrength === 3) return 'Strong';
        return '';
    };

    const handleAuth = async () => {
        if (!email || !password || (!isLogin && (!name || department === ''))) {
            Alert.alert("Required", "Please fill all details!");
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
                    name, email, role: 'intern', department, createdAt: new Date()
                });
                Alert.alert("Success", "Account created! Please login.");
                switchMode(true);
            }
        } catch (error: any) {
            let msg = "Something went wrong.";
            if (error.code === 'auth/user-not-found') msg = "No account found with this email.";
            if (error.code === 'auth/wrong-password') msg = "Incorrect password.";
            if (error.code === 'auth/invalid-credential') msg = "Invalid email or password.";
            if (error.code === 'auth/email-already-in-use') msg = "Email already registered.";
            if (error.code === 'auth/weak-password') msg = "Password must be at least 6 characters.";
            Alert.alert("Error", msg);
        } finally {
            setLoading(false);
        }
    };

    const getBorderColor = (field: string) => focusedField === field ? '#3B82F6' : '#E2E8F0';
    const getIconColor   = (field: string) => focusedField === field ? '#3B82F6' : '#93C5FD';

    const tabIndicatorLeft = tabAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['2%', '51%'],
    });

    // ── Swipe end handler: detect page and sync tab ───────────────────────────
    const handleSwipeEnd = (e: any) => {
        const offsetX = e.nativeEvent.contentOffset.x;
        const page = Math.round(offsetX / width);
        switchModeNoScroll(page === 0);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── HERO ── */}
                <LinearGradient
                    colors={['#0A2547', '#0F3460', '#1A4A8A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.hero}
                >
                    {/* static blobs */}
                    <View style={styles.blob1} />
                    <View style={styles.blob2} />
                    <View style={styles.blob3} />

                    {/* floating bubbles */}
                    {BUBBLES.map((b, i) => (
                        <BubbleFloat key={i} size={b.size} x={b.x} y={b.y} delay={b.delay} />
                    ))}

                    {/* brand */}
                    <View style={styles.brandSection}>
                        <View style={styles.logoRing}>
                            <View style={styles.logoShell}>
                                <MaterialCommunityIcons name="hubspot" size={30} color="#fff" />
                            </View>
                        </View>
                        <Text style={styles.appName}>AttendGo</Text>
                        <View style={styles.accentRow}>
                            <View style={styles.accentDot} />
                            <View style={styles.accentLine} />
                            <View style={styles.accentDot} />
                        </View>
                        <Text style={styles.tagline}>CONNECTED INTELLIGENCE</Text>
                    </View>

                    {/* tabs */}
                    <View style={styles.tabWrapper}>
                        <View style={styles.tabContainer}>
                            <Animated.View style={[styles.tabIndicator, { left: tabIndicatorLeft }]} />
                            <TouchableOpacity style={styles.tabBtn} onPress={() => switchMode(true)} activeOpacity={0.8}>
                                <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Log In</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.tabBtn} onPress={() => switchMode(false)} activeOpacity={0.8}>
                                <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>

                {/* ── WAVE ── */}
                <Svg
                    width={width}
                    height={52}
                    viewBox={`0 0 ${width} 52`}
                    style={{ marginTop: -1, backgroundColor: 'transparent' }}
                >
                    <Path
                        d={`M0,0 C${width*0.15},44 ${width*0.35},58 ${width*0.5},32 C${width*0.65},8 ${width*0.85},48 ${width},28 L${width},52 L0,52 Z`}
                        fill="#EEF2FF"
                    />
                </Svg>

                {/* ── SWIPEABLE CARD AREA ── */}
                <ScrollView
                    ref={cardScrollRef}
                    horizontal
                    pagingEnabled
                    scrollEventThrottle={16}
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleSwipeEnd}
                    decelerationRate="fast"
                    keyboardShouldPersistTaps="handled"
                    style={{ width }}
                    contentContainerStyle={{ width: width * 2 }}
                >
                    {/* ── LOGIN CARD ── */}
                    <View style={{ width }}>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Welcome Back</Text>
                            <Text style={styles.cardSub}>Secure login to your workspace</Text>

                            <View style={[styles.inputRow, { borderColor: getBorderColor('email') }]}>
                                <View style={[styles.iconBox, { borderRightColor: getBorderColor('email') }]}>
                                    <MaterialCommunityIcons name="email-outline" size={20} color={getIconColor('email')} />
                                </View>
                                <TextInput
                                    style={styles.input} placeholder="Email Address" placeholderTextColor="#94A3B8"
                                    value={isLogin ? email : ''} onChangeText={setEmail} autoCapitalize="none"
                                    keyboardType="email-address" autoComplete="email" textContentType="emailAddress"
                                    onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField('')}
                                    underlineColorAndroid="transparent"
                                />
                            </View>

                            <View style={[styles.inputRow, { borderColor: getBorderColor('pass') }]}>
                                <View style={[styles.iconBox, { borderRightColor: getBorderColor('pass') }]}>
                                    <MaterialCommunityIcons name="lock-outline" size={20} color={getIconColor('pass')} />
                                </View>
                                <TextInput
                                    style={styles.input} placeholder="Password" placeholderTextColor="#94A3B8"
                                    value={isLogin ? password : ''} onChangeText={setPassword}
                                    secureTextEntry autoComplete="password" textContentType="password"
                                    onFocus={() => setFocusedField('pass')} onBlur={() => setFocusedField('')}
                                    underlineColorAndroid="transparent"
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.forgotBtn}
                                onPress={() => Alert.alert("Reset Password", "Feature coming soon!")}
                            >
                                <Text style={styles.forgotText}>Forgot password?</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.ctaBtn} onPress={isLogin ? handleAuth : undefined} disabled={loading} activeOpacity={0.85}>
                                <LinearGradient
                                    colors={['#0A2547', '#0F3460', '#2563EB']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={styles.gradient}
                                >
                                    {loading && isLogin ? <ActivityIndicator color="white" /> : (
                                        <View style={styles.ctaInner}>
                                            <Text style={styles.ctaText}>LOG IN</Text>
                                            <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
                                        </View>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            

                           
                        </View>
                    </View>

                    {/* ── SIGNUP CARD ── */}
                    <View style={{ width }}>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Create Account</Text>
                            <Text style={styles.cardSub}>Let's set up your workspace</Text>

                            <View style={[styles.inputRow, { borderColor: getBorderColor('name') }]}>
                                <View style={[styles.iconBox, { borderRightColor: getBorderColor('name') }]}>
                                    <MaterialCommunityIcons name="account-outline" size={20} color={getIconColor('name')} />
                                </View>
                                <TextInput
                                    style={styles.input} placeholder="Full Name" placeholderTextColor="#94A3B8"
                                    value={name} onChangeText={setName}
                                    onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField('')}
                                    underlineColorAndroid="transparent"
                                />
                            </View>

                            <View style={[styles.inputRow, { borderColor: getBorderColor('dept') }]}>
                                <View style={[styles.iconBox, { borderRightColor: getBorderColor('dept') }]}>
                                    <MaterialCommunityIcons name="domain" size={20} color={getIconColor('dept')} />
                                </View>
                                <View style={styles.pickerWrap}>
                                    <Picker
                                        selectedValue={department}
                                        onValueChange={(val) => { setDepartment(val); setFocusedField('dept'); }}
                                        style={[styles.picker, { color: department === '' ? '#94A3B8' : '#0F172A' }]}
                                        dropdownIconColor="#93C5FD"
                                    >
                                        <Picker.Item label="Select Department" value=""      color="#94A3B8" />
                                        <Picker.Item label="IoT / Electronics"  value="iot"  color="#0F172A" />
                                        <Picker.Item label="ALML"               value="alml" color="#0F172A" />
                                        <Picker.Item label="Web Developer"      value="web"  color="#0F172A" />
                                    </Picker>
                                </View>
                            </View>

                            <View style={[styles.inputRow, { borderColor: getBorderColor('semail') }]}>
                                <View style={[styles.iconBox, { borderRightColor: getBorderColor('semail') }]}>
                                    <MaterialCommunityIcons name="email-outline" size={20} color={getIconColor('semail')} />
                                </View>
                                <TextInput
                                    style={styles.input} placeholder="Email Address" placeholderTextColor="#94A3B8"
                                    value={!isLogin ? email : ''} onChangeText={setEmail} autoCapitalize="none"
                                    keyboardType="email-address" autoComplete="email" textContentType="emailAddress"
                                    onFocus={() => setFocusedField('semail')} onBlur={() => setFocusedField('')}
                                    underlineColorAndroid="transparent"
                                />
                            </View>

                            <View style={[styles.inputRow, { borderColor: getBorderColor('spass') }]}>
                                <View style={[styles.iconBox, { borderRightColor: getBorderColor('spass') }]}>
                                    <MaterialCommunityIcons name="lock-outline" size={20} color={getIconColor('spass')} />
                                </View>
                                <TextInput
                                    style={styles.input} placeholder="Create Password" placeholderTextColor="#94A3B8"
                                    value={!isLogin ? password : ''}
                                    onChangeText={(val) => { setPassword(val); checkPasswordStrength(val); }}
                                    secureTextEntry autoComplete="password" textContentType="password"
                                    onFocus={() => setFocusedField('spass')} onBlur={() => setFocusedField('')}
                                    underlineColorAndroid="transparent"
                                />
                            </View>

                            {password.length > 0 && !isLogin && (
                                <View style={styles.strengthRow}>
                                    {[1, 2, 3].map(i => (
                                        <View key={i} style={[styles.strengthBar, {
                                            backgroundColor: i <= passwordStrength ? getStrengthColor() : '#E2E8F0'
                                        }]} />
                                    ))}
                                    <Text style={[styles.strengthLabel, { color: getStrengthColor() }]}>
                                        {getStrengthLabel()}
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity style={styles.ctaBtn} onPress={!isLogin ? handleAuth : undefined} disabled={loading} activeOpacity={0.85}>
                                <LinearGradient
                                    colors={['#0A2547', '#0F3460', '#2563EB']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={styles.gradient}
                                >
                                    {loading && !isLogin ? <ActivityIndicator color="white" /> : (
                                        <View style={styles.ctaInner}>
                                            <Text style={styles.ctaText}>CREATE ACCOUNT</Text>
                                            <MaterialCommunityIcons name="account-plus-outline" size={18} color="#fff" style={{ marginLeft: 8 }} />
                                        </View>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            

                            
                        </View>
                    </View>
                </ScrollView>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#EEF2FF' },
    scrollContainer: { flexGrow: 1, paddingBottom: 40 },

    hero: {
        paddingTop: 52, paddingBottom: 40, paddingHorizontal: 24,
        position: 'relative', overflow: 'hidden',
    },
    blob1: {
        position: 'absolute', width: 220, height: 220, borderRadius: 110,
        backgroundColor: 'rgba(255,255,255,0.05)', top: -80, right: -60,
    },
    blob2: {
        position: 'absolute', width: 140, height: 140, borderRadius: 70,
        backgroundColor: 'rgba(255,255,255,0.04)', top: 40, left: -40,
    },
    blob3: {
        position: 'absolute', width: 80, height: 80, borderRadius: 40,
        backgroundColor: 'rgba(96,165,250,0.08)', bottom: 60, right: 30,
    },

    brandSection: { alignItems: 'center', marginBottom: 28 },
    logoRing: {
        width: 86, height: 86, borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 14,
    },
    logoShell: {
        width: 68, height: 68, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center', alignItems: 'center',
    },
    appName: { fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: -0.8, marginBottom: 6 },
    accentRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    accentDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#60A5FA' },
    accentLine: { width: 40, height: 2.5, backgroundColor: '#60A5FA', borderRadius: 2 },
    tagline: { fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 3.5, fontWeight: '700' },

    tabWrapper: { paddingHorizontal: 4 },
    tabContainer: {
        flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16, padding: 4, height: 48, position: 'relative',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    },
    tabIndicator: {
        position: 'absolute', top: 4, width: '47%', height: 40,
        backgroundColor: '#fff', borderRadius: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
    },
    tabBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    tabText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
    tabTextActive: { color: '#0F3460', fontWeight: '800' },

    card: {
        backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 28,
        padding: 24, shadowColor: '#0F3460',
        shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.12,
        shadowRadius: 30, elevation: 14, marginTop: 0,
    },
    cardTitle: {
        fontSize: 22, fontWeight: '800', color: '#0F172A',
        textAlign: 'center', marginBottom: 4, letterSpacing: -0.3,
    },
    cardSub: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginBottom: 22, fontWeight: '500' },

    inputRow: {
        flexDirection: 'row', height: 54, borderRadius: 14,
        borderWidth: 1.5, overflow: 'hidden', marginBottom: 13, backgroundColor: '#FAFCFF',
    },
    iconBox: {
        width: 50, justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#EEF4FF', borderRightWidth: 1.5, borderRightColor: '#E2E8F0',
    },
    input: { flex: 1, paddingHorizontal: 14, fontSize: 15, color: '#0F172A', backgroundColor: '#FAFCFF' },
    pickerWrap: { flex: 1, justifyContent: 'center', backgroundColor: '#FAFCFF' },
    picker: { width: '100%' },

    strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10, marginTop: -5 },
    strengthBar: { flex: 1, height: 4, borderRadius: 2 },
    strengthLabel: { fontSize: 11, fontWeight: '700', minWidth: 46, textAlign: 'right' },

    forgotBtn: { alignSelf: 'flex-end', marginBottom: 16, marginTop: -4 },
    forgotText: { fontSize: 12, color: '#2563EB', fontWeight: '700' },

    ctaBtn: {
        borderRadius: 14, overflow: 'hidden', marginBottom: 18,
        shadowColor: '#0F3460', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
    },
    gradient: { paddingVertical: 16, alignItems: 'center' },
    ctaInner: { flexDirection: 'row', alignItems: 'center' },
    ctaText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 1.5 },

    trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
    trustText: { fontSize: 11, color: '#93C5FD', fontWeight: '500' },

    swipeHint: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 5, marginTop: 14,
    },
    swipeHintText: { fontSize: 11, color: '#CBD5E1', fontWeight: '500' },
});
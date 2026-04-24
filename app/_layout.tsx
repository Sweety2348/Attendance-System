import { Stack } from "expo-router";
import { KeyboardProvider } from "react-native-keyboard-controller";

export default function RootLayout() {
  return (
    <KeyboardProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* 'index' matlab Login page */}
        <Stack.Screen name="index" /> 
        {/* 'intern' matlab Dashboard page */}
        <Stack.Screen name="intern" />
      </Stack>
    </KeyboardProvider>
  );
}
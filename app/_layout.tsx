import { Stack } from "expo-router";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "../global.css";

export default function RootLayout() {
  return (
    <KeyboardProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* 1. Login Page (app/index.tsx) */}
        <Stack.Screen name="index" /> 

        {/* 2. Dashboard Folder (app/(tabs)/ folder) */}
        <Stack.Screen name="(tabs)" />
        
        {/* 3. Modal (agar file banayi hai toh) */}
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </KeyboardProvider> 
  );
}
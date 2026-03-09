import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        // Transições suaves
        animation: 'fade',
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="despensas" />
      <Stack.Screen name="avisos" />
      <Stack.Screen name="listas" />
      <Stack.Screen name="gastos" />
    </Stack>
  );
}

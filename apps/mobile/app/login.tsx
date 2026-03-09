import LoginScreen from '../src/screens/LoginScreen';
import { useRouter } from 'expo-router';

export default function Login() {
  const router = useRouter();
  
  return <LoginScreen navigation={router} />;
}

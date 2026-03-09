import DespensasScreen from '../src/screens/DespensasScreen';
import { useRouter } from 'expo-router';

export default function Despensas() {
  const router = useRouter();
  
  return <DespensasScreen navigation={router} />;
}

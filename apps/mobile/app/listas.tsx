import ListasScreen from '../src/screens/ListasScreen';
import { useRouter } from 'expo-router';

export default function Listas() {
  const router = useRouter();
  
  return <ListasScreen navigation={router} />;
}

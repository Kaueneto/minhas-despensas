import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Package, Bell, ClipboardList, DollarSign } from 'lucide-react-native';

const navItems = [
  { name: 'Despensas', href: '/despensas', IconComponent: Package },
  { name: 'Avisos', href: '/avisos', IconComponent: Bell },
  { name: 'Listas', href: '/listas', IconComponent: ClipboardList },
  { name: 'Gastos', href: '/gastos', IconComponent: DollarSign },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <View style={styles.container}>
      <BlurView intensity={10} tint="light" style={styles.blurWrapper}>
        <View style={styles.navBarInner}>
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.IconComponent;
            
            return (
              <TouchableOpacity
                key={item.name}
                style={styles.navItem}
                onPress={() => router.push(item.href as any)}
                activeOpacity={0.6}
              >
                <View style={[
                  styles.iconContainer,
                  active && styles.iconContainerActive
                ]}>
                  <Icon 
                    size={22} 
                    color={active ? '#3B82F6' : '#6B7280'} 
                    strokeWidth={2} // FIXO: Não altera a espessura
                  />
                </View>
                
                <Text style={[
                  styles.label,
                  active && styles.labelActive
                ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: 'transparent',
  },
  blurWrapper: {
  borderRadius: 28,
  overflow: 'hidden',

  borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.6)',
    borderLeftColor: 'rgba(255,255,255,0.3)',
    borderRightColor: 'rgba(255,255,255,0.3)',
    borderBottomColor: 'rgba(255,255,255,0.2)',

  backgroundColor: 'rgba(255,255,255,0.15)',

  ...Platform.select({
    ios: {
      shadowColor: '#fff',       // luz da borda
      shadowOffset: { width: 0, height: -1 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    android: {
      elevation: 10,
    },
  }),
},
  navBarInner: {
    flexDirection: 'row',
    height: 65,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconContainerActive: {
  
    transform: [{ scale: 1.15 }],
  },
  label: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500', 
  },
  labelActive: {
    color: '#3B82F6',
    fontWeight: '500',
  },
});
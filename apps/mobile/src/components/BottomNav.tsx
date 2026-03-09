import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

// Importar ícones
const despensaIcon = require('../../assets/despensas.png');
const despensaActiveIcon = require('../../assets/despensas-selected.png');
const avisosIcon = require('../../assets/avisos.png');
const avisosActiveIcon = require('../../assets/avisos.png');
const listasIcon = require('../../assets/listas.png');
const listasActiveIcon = require('../../assets/listas-selected.png');
const gastosIcon = require('../../assets/gastos.png');
const gastosActiveIcon = require('../../assets/gastos-selected.png');

const navItems = [
  { 
    name: 'Despensas', 
    href: '/despensas',
    icon: despensaIcon,
    iconActive: despensaActiveIcon,
  },
  { 
    name: 'Avisos', 
    href: '/avisos',
    icon: avisosIcon,
    iconActive: avisosActiveIcon,
  },
  { 
    name: 'Listas', 
    href: '/listas',
    icon: listasIcon,
    iconActive: listasActiveIcon,
  },
  { 
    name: 'Gastos', 
    href: '/gastos',
    icon: gastosIcon,
    iconActive: gastosActiveIcon,
  },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <View style={styles.navBarInner}>
          {navItems.map((item) => {
            const active = isActive(item.href);
            
            return (
              <TouchableOpacity
                key={item.name}
                style={styles.navItem}
                onPress={() => router.push(item.href as any)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.iconContainer,
                  active && styles.iconContainerActive
                ]}>
                  <Image
                    source={active ? item.iconActive : item.icon}
                    style={styles.iconImage}
                    resizeMode="contain"
                  />
                </View>
                
                <Text style={[
                  styles.label,
                  active && styles.labelActive
                ]}>
                  {item.name}
                </Text>
                
                {active && (
                  <View style={styles.activeIndicator} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
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
    paddingBottom: 32,
    paddingTop: 16,
  },
  navBar: {
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
    // Efeito glassmorphism sem BlurView
    backdropFilter: 'blur(20px)',
  },
  navBarInner: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
    position: 'relative',
  },
  iconContainer: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  iconContainerActive: {
    transform: [{ scale: 1.1 }],
  },
  iconImage: {
    width: 24,
    height: 24,
  },
  label: {
    fontSize: 9,
    color: '#1F2937',
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  labelActive: {
    color: '#3B82F6',
    fontWeight: '800',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
});
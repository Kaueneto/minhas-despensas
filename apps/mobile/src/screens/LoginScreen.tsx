import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { signIn, signUp } from '../services/auth'

type TabType = 'login' | 'register'

export default function LoginScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<TabType>('login')
  const [isLoading, setIsLoading] = useState(false)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form state
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await signIn(loginEmail, loginPassword)
      
      if (error) {
        Alert.alert(
          'Erro ao fazer login',
          error.message === 'Invalid login credentials' 
            ? 'Email ou senha incorretos' 
            : error.message
        )
        return
      }

      navigation.replace('/despensas')
    } catch {
      Alert.alert('Erro', 'Ocorreu um erro ao fazer login. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!registerName || !registerEmail || !registerPassword || !registerConfirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos')
      return
    }

    if (registerPassword !== registerConfirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem')
      return
    }

    if (registerPassword.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await signUp(registerEmail, registerPassword, registerName)
      
      if (error) {
        Alert.alert('Erro', error.message)
        return
      }

      Alert.alert(
        'Sucesso!',
        'Conta criada com sucesso! Verifique seu email para confirmar.',
        [
          {
            text: 'OK',
            onPress: () => {
              setActiveTab('login')
              setRegisterName('')
              setRegisterEmail('')
              setRegisterPassword('')
              setRegisterConfirmPassword('')
            }
          }
        ]
      )
    } catch {
      Alert.alert('Erro', 'Ocorreu um erro ao criar conta. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Título */}
          <Text style={styles.title}>Minhas Despensas</Text>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <View style={styles.tabsBar}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'login' && styles.tabActive
                ]}
                onPress={() => setActiveTab('login')}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === 'login' && styles.tabTextActive
                ]}>
                  Entrar
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'register' && styles.tabActive
                ]}
                onPress={() => setActiveTab('register')}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === 'register' && styles.tabTextActive
                ]}>
                  Cadastre-se
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Card do Formulário */}
          <View style={styles.card}>
            {/* Login Form */}
            {activeTab === 'login' && (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>E-mail</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="seu@email.com"
                    value={loginEmail}
                    onChangeText={setLoginEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Senha</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    secureTextEntry
                    editable={!isLoading}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Login</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Register Form */}
            {activeTab === 'register' && (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nome</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Seu nome completo"
                    value={registerName}
                    onChangeText={setRegisterName}
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>E-mail</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="seu@email.com"
                    value={registerEmail}
                    onChangeText={setRegisterEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Senha</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    value={registerPassword}
                    onChangeText={setRegisterPassword}
                    secureTextEntry
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirmar Senha</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    value={registerConfirmPassword}
                    onChangeText={setRegisterConfirmPassword}
                    secureTextEntry
                    editable={!isLoading}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleRegister}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Criar Conta</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#111827',
    marginBottom: 32,
  },
  tabsContainer: {
    marginBottom: 16,
  },
  tabsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(229, 231, 235, 0.7)',
    borderRadius: 6,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  tabTextActive: {
    color: '#374151',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#2d3a4f',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})

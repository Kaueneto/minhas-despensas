'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp, signInWithGoogle, signInWithApple } from '../../services/auth'

type TabType = 'login' | 'register'

export default function LoginPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('login')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form state
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!loginEmail || !loginPassword) {
      setError('Por favor, preencha todos os campos')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await signIn(loginEmail, loginPassword)
      
      if (error) {
        setError(error.message === 'Invalid login credentials' 
          ? 'Email ou senha incorretos' 
          : error.message)
        return
      }

      router.push('/despensas')
    } catch {
      setError('Ocorreu um erro ao fazer login. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!registerName || !registerEmail || !registerPassword || !registerConfirmPassword) {
      setError('Por favor, preencha todos os campos')
      return
    }

    if (registerPassword !== registerConfirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (registerPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await signUp(registerEmail, registerPassword, registerName)
      
      if (error) {
        setError(error.message)
        return
      }

      setSuccess('Conta criada com sucesso! Verifique seu email para confirmar.')
      setActiveTab('login')
      setRegisterName('')
      setRegisterEmail('')
      setRegisterPassword('')
      setRegisterConfirmPassword('')
    } catch {
      setError('Ocorreu um erro ao criar conta. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setIsLoading(true)
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setError('Erro ao fazer login com Google')
      }
    } catch {
      setError('Erro ao fazer login com Google')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAppleLogin = async () => {
    setError(null)
    setIsLoading(true)
    try {
      const { error } = await signInWithApple()
      if (error) {
        setError('Erro ao fazer login com Apple')
      }
    } catch {
      setError('Erro ao fazer login com Apple')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center bg-linear-to-br from-gray-50 to-gray-100">
      <div className="mt-16 w-full max-w-md px-4">
        {/* Título */}
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8 font-sans">
          Minhas Despensas
        </h1>

        {/* Container Tabs */}
        <div className="w-full">
          {/* Barra de Tabs */}
          <div className="h-10 mb-2">
            <div 
              className="h-10 flex items-center justify-center rounded-md bg-gray-200/70 p-1 text-gray-500 w-full"
              role="tablist"
            >
              <button
                type="button"
                role="tab"
                onClick={() => { setActiveTab('login'); setError(null); setSuccess(null) }}
                className={`flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                  activeTab === 'login'
                    ? 'bg-white text-gray-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                role="tab"
                onClick={() => { setActiveTab('register'); setError(null); setSuccess(null) }}
                className={`flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                  activeTab === 'register'
                    ? 'bg-white text-gray-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                Cadastre-se
              </button>
            </div>
          </div>

          {/* Card do Formulário */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
              {success}
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm text-gray-700 mb-1.5">
                  E-mail
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#2d3a4f] focus:ring-2 focus:ring-[#2d3a4f]/20 outline-none transition-all text-gray-900 placeholder-gray-400"
                  placeholder="seu@email.com"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm text-gray-700 mb-1.5">
                  Senha
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#2d3a4f] focus:ring-2 focus:ring-[#2d3a4f]/20 outline-none transition-all text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#2d3a4f] text-white font-semibold rounded-lg hover:bg-[#3d4a5f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Entrando...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="register-name" className="block text-sm text-gray-700 mb-1.5">
                  Nome
                </label>
                <input
                  id="register-name"
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#2d3a4f] focus:ring-2 focus:ring-[#2d3a4f]/20 outline-none transition-all text-gray-900 placeholder-gray-400"
                  placeholder="Seu nome"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="register-email" className="block text-sm text-gray-700 mb-1.5">
                  E-mail
                </label>
                <input
                  id="register-email"
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#2d3a4f] focus:ring-2 focus:ring-[#2d3a4f]/20 outline-none transition-all text-gray-900 placeholder-gray-400"
                  placeholder="seu@email.com"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="register-password" className="block text-sm text-gray-700 mb-1.5">
                  Senha
                </label>
                <input
                  id="register-password"
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#2d3a4f] focus:ring-2 focus:ring-[#2d3a4f]/20 outline-none transition-all text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="register-confirm-password" className="block text-sm text-gray-700 mb-1.5">
                  Confirme sua Senha
                </label>
                <input
                  id="register-confirm-password"
                  type="password"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#2d3a4f] focus:ring-2 focus:ring-[#2d3a4f]/20 outline-none transition-all text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#2d3a4f] text-white font-semibold rounded-lg hover:bg-[#3d4a5f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cadastrando...
                  </>
                ) : (
                  'Confirmar Cadastro'
                )}
              </button>
            </form>
          )}

          {/* Social Login Divider */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Entrar com Google"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={handleAppleLogin}
              disabled={isLoading}
              className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Entrar com Apple"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#333">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

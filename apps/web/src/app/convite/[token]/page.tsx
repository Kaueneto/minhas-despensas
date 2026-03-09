'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../../../../../packages/supabase'

interface ConviteData {
  id: string
  despensa_id: string
  email: string
  status: string
  expira_em: string
  despensa: {
    nome: string
    owner_id: string
  }
}

export default function ConvitePage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [convite, setConvite] = useState<ConviteData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const loadConvite = async () => {
      if (!token) {
        setError('Token inválido')
        setIsLoading(false)
        return
      }

      // Buscar convite pelo token
      const { data, error: fetchError } = await supabase
        .from('convites')
        .select(`
          id,
          despensa_id,
          email,
          status,
          expira_em,
          despensas:despensa_id (
            nome,
            owner_id
          )
        `)
        .eq('token', token)
        .single()

      if (fetchError || !data) {
        setError('Convite não encontrado')
        setIsLoading(false)
        return
      }

      // Verificar se já foi usado
      if (data.status !== 'pending') {
        setError('Este convite já foi utilizado')
        setIsLoading(false)
        return
      }

      // Verificar se expirou
      if (new Date(data.expira_em) < new Date()) {
        setError('Este convite expirou')
        setIsLoading(false)
        return
      }

      setConvite({
        ...data,
        despensa: data.despensas as unknown as { nome: string; owner_id: string }
      })
      setIsLoading(false)
    }

    loadConvite()
  }, [token])

  const handleAccept = async () => {
    if (!convite) return

    setIsAccepting(true)
    setError(null)

    // Verificar se está logado
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      // Salvar token e redirecionar para login
      sessionStorage.setItem('pendingConvite', token)
      router.push('/Login')
      return
    }

    // Verificar se o email do usuário logado é o mesmo do convite
    if (session.user.email?.toLowerCase() !== convite.email.toLowerCase()) {
      setError(`Este convite é para ${convite.email}. Faça login com essa conta para aceitar.`)
      setIsAccepting(false)
      return
    }

    try {
      // Adicionar usuário como membro da despensa
      const { error: memberError } = await supabase
        .from('despensa_membros')
        .insert({
          despensa_id: convite.despensa_id,
          user_id: session.user.id,
          role: 'member'
        })

      if (memberError) {
        if (memberError.code === '23505') {
          setError('Você já é membro desta despensa')
        } else {
          setError('Erro ao aceitar convite: ' + memberError.message)
        }
        setIsAccepting(false)
        return
      }

      // Atualizar status do convite
      await supabase
        .from('convites')
        .update({ status: 'accepted' })
        .eq('id', convite.id)

      setSuccess(true)

      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/despensas')
      }, 2000)
    } catch {
      setError('Ocorreu um erro. Tente novamente.')
      setIsAccepting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    )
  }

  if (error && !convite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Ops!</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors"
          >
            Ir para o início
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Convite aceito!</h1>
          <p className="text-gray-600">Você agora faz parte da despensa &quot;{convite?.despensa.nome}&quot;</p>
          <p className="text-gray-400 text-sm mt-4">Redirecionando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Convite para Despensa</h1>
          <p className="text-gray-600">Você foi convidado para participar de:</p>
        </div>

        {/* Despensa Info */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900">{convite?.despensa.nome}</h2>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleAccept}
            disabled={isAccepting}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isAccepting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Aceitando...
              </span>
            ) : (
              'Aceitar Convite'
            )}
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Recusar
          </button>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          Convite para: {convite?.email}
        </p>
      </div>
    </div>
  )
}

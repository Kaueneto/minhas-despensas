'use client'

import { useState, useEffect } from 'react'
import { createDespensa, createConvite } from '../services/despensas'
import { supabase } from '../lib/supabase'

interface NewDespensaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function NewDespensaModal({ isOpen, onClose, onSuccess }: NewDespensaModalProps) {
  const [nome, setNome] = useState('')
  const [addMembers, setAddMembers] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [memberEmails, setMemberEmails] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

 
  useEffect(() => {
    if (isOpen) {
      setNome('')
      setAddMembers(false)
      setMemberEmail('')
      setMemberEmails([])
      setError(null)
      setSuccessMessage(null)
      
      // buscar email do usuário logado
      const getUserEmail = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          setUserEmail(user.email.toLowerCase())
        }
      }
      getUserEmail()
    }
  }, [isOpen])

  const handleAddMemberEmail = () => {
    const email = memberEmail.toLowerCase().trim()
    if (!email) return
    
    // validacao basica de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email inválido')
      return
    }

    // nao permite adicioanr proprio email 
    if (email === userEmail) {
      setError('Você não pode convidar a si mesmo')
      return
    }

    if (memberEmails.includes(email)) {
      setError('Este email já foi adicionado')
      return
    }

    setMemberEmails([...memberEmails, email])
    setMemberEmail('')
    setError(null)
  }

  const handleRemoveMemberEmail = (email: string) => {
    setMemberEmails(memberEmails.filter(e => e !== email))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!nome.trim()) {
      setError('Digite o nome da despensa')
      return
    }

    setIsLoading(true)

    try {
      const { data: despensa, error: createError } = await createDespensa(nome.trim())
      
      if (createError || !despensa) {
        setError(createError?.message || 'Erro ao criar despensa')
        return
      }

      // add  membros se necessario
      let convitesEnviados = 0
      const convitesComErro: string[] = []
      
      for (const email of memberEmails) {
        const result = await createConvite(despensa.id, email)
        if (result.success) {
          convitesEnviados++
        } else {
          convitesComErro.push(email)
        }
      }

      // mostrar mensagem de sucesso
      if (memberEmails.length > 0) {
        if (convitesEnviados === memberEmails.length) {
          setSuccessMessage(`Despensa criada! ${convitesEnviados} convite${convitesEnviados > 1 ? 's' : ''} enviado${convitesEnviados > 1 ? 's' : ''} com sucesso.`)
        } else if (convitesEnviados > 0) {
          setSuccessMessage(`Despensa criada! ${convitesEnviados} convite${convitesEnviados > 1 ? 's' : ''} enviado${convitesEnviados > 1 ? 's' : ''}. Falha ao enviar para: ${convitesComErro.join(', ')}`)
        } else {
          setSuccessMessage('Despensa criada, mas houve erro ao enviar os convites.')
        }
      } else {
        setSuccessMessage('Despensa criada com sucesso!')
      }

      // wait 2 segundos para mostrar a mensagem e depois fechar
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)
    } catch {
      setError('Ocorreu um erro. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* modal */}
      <div className="fixed inset-x-0 bottom-0 z-60 animate-slide-up">
        <div className="bg-white rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto">
          {/* handle bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* header */}
          <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Nova Despensa</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* sucesso */}
            {successMessage && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {successMessage}
              </div>
            )}

            {/* erro */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* nome da despensa */}
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1.5">
                Nome da Despensa
              </label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-gray-900 placeholder-gray-400"
                placeholder="Ex: Casa da Praia"
                disabled={isLoading}
                autoFocus
              />
            </div>

            {/* toggle de adicionar membros */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Convidar membros?</span>
              <button
                type="button"
                onClick={() => setAddMembers(!addMembers)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  addMembers ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              >
                <span 
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    addMembers ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* membros */}
            {addMembers && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Email dos membros
                </label>
                
                {/* lista de emails adicionados */}
                {memberEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {memberEmails.map((email) => (
                      <span 
                        key={email}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-full"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => handleRemoveMemberEmail(email)}
                          className="p-0.5 hover:bg-blue-100 rounded-full"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* input de email */}
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMemberEmail())}
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-gray-900 placeholder-gray-400"
                    placeholder="email@exemplo.com"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={handleAddMemberEmail}
                    disabled={isLoading || !memberEmail}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* criar despensa */}
            <button
              type="submit"
              disabled={isLoading || !nome.trim()}
              className="w-full py-3.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Criando...
                </>
              ) : (
                'Criar Despensa'
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

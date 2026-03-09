'use client'

import { useState } from 'react'
import { createLista } from '../services/listas'
import { useRouter } from 'next/navigation'

interface NewListaModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function NewListaModal({ isOpen, onClose }: NewListaModalProps) {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return

    setIsLoading(true)
    const { success, data } = await createLista(nome.trim(), observacoes.trim() || undefined)
    
    if (success && data) {
      setNome('')
      setObservacoes('')
      onClose()
      // redirecionar para a lista criada
      router.push(`/listas/${data.id}`)
    }
    
    setIsLoading(false)
  }

  const handleClose = () => {
    if (!isLoading) {
      setNome('')
      setObservacoes('')
      onClose()
    }
  }

  return (
    <>
      {/* overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-[60] animate-in fade-in duration-200"
        onClick={handleClose}
      />
      
      {/* modal */}
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
        <div 
          className="bg-white rounded-t-3xl sm:rounded-3xl shadow-xl w-full max-w-md animate-in slide-in-from-bottom duration-300 sm:slide-in-from-bottom-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Nova lista</h2>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                Nome da lista
              </label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Compras do mês"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                maxLength={50}
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-2">
                Observações (opcional)
              </label>
              <textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações sobre esta lista..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                rows={3}
                maxLength={200}
                disabled={isLoading}
              />
            </div>

            {/* actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!nome.trim() || isLoading}
                className="flex-1 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Criando...
                  </>
                ) : (
                  'Criar lista'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

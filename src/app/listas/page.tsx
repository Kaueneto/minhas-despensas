'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { getListas, deleteLista } from '../../services/listas'
import type { ListaCompras } from '../../types'
import { signOut } from '../../services/auth'
import NewListaModal from '../../components/NewListaModal'
import BottomNav from '../../components/BottomNav'

export default function ListasPage() {
  const router = useRouter()
  const [listas, setListas] = useState<ListaCompras[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [user, setUser] = useState<{ email?: string; nome?: string } | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedListas, setSelectedListas] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/Login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('nome, email')
        .eq('id', session.user.id)
        .single()

      setUser({
        email: session.user.email,
        nome: userData?.nome || session.user.user_metadata?.full_name
      })

      await loadListas()
    }

    checkAuth()
  }, [router])

  const loadListas = async () => {
    setIsLoading(true)
    const data = await getListas()
    setListas(data)
    setIsLoading(false)
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/Login')
  }

  const handleDeleteSelected = async () => {
    if (selectedListas.length === 0) return
    
    setIsDeleting(true)
    
    for (const id of selectedListas) {
      await deleteLista(id)
    }
    
    setListas(listas.filter(l => !selectedListas.includes(l.id)))
    
    setIsDeleting(false)
    setSelectedListas([])
    setIsSelectionMode(false)
  }

  const toggleSelectLista = (id: string) => {
    setSelectedListas(prev => 
      prev.includes(id) 
        ? prev.filter(listaId => listaId !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedListas.length === listas.length) {
      setSelectedListas([])
    } else {
      setSelectedListas(listas.map(l => l.id))
    }
  }

  const exitSelectionMode = () => {
    setIsSelectionMode(false)
    setSelectedListas([])
  }

  const getInitials = () => {
    const name = user?.nome || user?.email || ''
    if (!name) return '?'
    
    if (user?.nome) {
      const parts = user.nome.trim().split(' ')
      if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      }
      return parts[0].substring(0, 2).toUpperCase()
    }
    
    const emailPart = name.split('@')[0]
    return emailPart.substring(0, 2).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 pb-24">
      {/* header */}
      <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Listas de Compras</h1>
          
          <div className="flex items-center gap-3">
            {/* menu de opções */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                title="Opções"
              >
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>

              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute top-12 right-0 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 min-w-45 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      onClick={() => {
                        setIsSelectionMode(true)
                        setShowMenu(false)
                      }}
                      className="w-full px-4 py-3 text-left text-gray-800 hover:bg-gray-50 transition-colors text-sm"
                    >
                      Selecionar listas
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* avatar */}
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-md"
              title="Sair"
            >
              {getInitials()}
            </button>
          </div>
        </div>
      </header>

      {/* barra de seleção */}
      {isSelectionMode && (
        <div className="bg-blue-500 text-white px-3 py-2.5 sticky top-15 z-10 shadow-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={exitSelectionMode}
                className="p-1 hover:bg-blue-600 rounded-lg transition-colors shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <span className="font-medium text-sm truncate">
                {selectedListas.length > 0 
                  ? `${selectedListas.length} item${selectedListas.length > 1 ? 's' : ''}`
                  : 'Selecione'}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0">
              {listas.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="p-2 hover:bg-blue-600 rounded-full transition-colors"
                  title={selectedListas.length === listas.length ? 'Desmarcar todas' : 'Selecionar todas'}
                >
                  {selectedListas.length === listas.length ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  )}
                </button>
              )}
              
              {selectedListas.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="px-3 py-1.5 bg-red-500/90 backdrop-blur-md hover:bg-red-500 rounded-full text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-lg"
                  title="Excluir selecionadas"
                >
                  {isDeleting ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* conteudo */}
      <main className="px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : listas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Você ainda não tem listas</p>
            <p className="text-gray-400 text-sm mt-1">
              Clique em &quot;Nova lista&quot; para criar
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {listas.map((lista) => {
              const isSelected = selectedListas.includes(lista.id)
              
              return (
                <div
                  key={lista.id}
                  className={`relative bg-white rounded-xl p-4 shadow-sm border transition-all ${
                    isSelected 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-100 hover:shadow-md'
                  }`}
                >
                  {isSelectionMode ? (
                    <div 
                      className="flex items-start gap-3 cursor-pointer"
                      onClick={() => toggleSelectLista(lista.id)}
                    >
                      <div className="shrink-0 mt-1">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'border-gray-300 hover:border-blue-400'
                        }`}>
                          {isSelected && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {lista.nome}
                          </h3>
                          
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {lista.total_itens} {lista.total_itens === 1 ? 'item' : 'itens'}
                          </span>
                                </div>
                            </div>
                    </div>
                  ) : (
                    <div 
                      className="cursor-pointer"
                      onClick={() => router.push(`/listas/${lista.id}`)}
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {lista.nome}
                      </h3>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {lista.total_itens} {lista.total_itens === 1 ? 'item' : 'itens'}
                        </span>
                        
                        {lista.observacoes && (
                          <span className="text-gray-400 text-xs truncate max-w-50">
                            {lista.observacoes}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* bt de nova lista */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-30 right-4 flex items-center gap-2 px-5 py-3 bg-white rounded-full shadow-lg border border-gray-200 text-gray-700 font-medium hover:shadow-xl transition-shadow z-40"
      >
        Nova lista
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <NewListaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <BottomNav />
    </div>
  )
}

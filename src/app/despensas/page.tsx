'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { getDespensas, deleteDespensa } from '../../services/despensas'
import { signOut } from '../../services/auth'
import NewDespensaModal from '../../components/NewDespensaModal'
import BottomNav from '../../components/BottomNav'
import type { DespensaComDetalhes } from '../../types'

type FilterType = 'todas' | 'vazias'

export default function DespensasPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterType>('todas')
  const [despensas, setDespensas] = useState<DespensaComDetalhes[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [user, setUser] = useState<{ email?: string; nome?: string } | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; nome: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // verificar autenticação e buscar dados
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/Login')
        return
      }

      // buscar dados do usuário na tabela users
      const { data: userData } = await supabase
        .from('users')
        .select('nome, email')
        .eq('id', session.user.id)
        .single()

      setUser({
        email: session.user.email,
        nome: userData?.nome || session.user.user_metadata?.full_name
      })

      await loadDespensas()
    }

    checkAuth()
  }, [router])

  const loadDespensas = async () => {
    setIsLoading(true)
    const data = await getDespensas()
    setDespensas(data)
    setIsLoading(false)
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/Login')
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    
    setIsDeleting(true)
    const { success, error } = await deleteDespensa(deleteConfirm.id)
    
    if (success) {
      setDespensas(despensas.filter(d => d.id !== deleteConfirm.id))
    } else {
      console.error('Erro ao deletar:', error)
    }
    
    setIsDeleting(false)
    setDeleteConfirm(null)
  }

  // filtrar as  despensas do usuario
  const filteredDespensas = despensas.filter(d => {
    if (filter === 'vazias') return d.total_itens === 0
    return true
  })

  // gerar iniciais do avatar
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
    
    // se não tem nome, usar email no avatarr
    const emailPart = name.split('@')[0]
    return emailPart.substring(0, 2).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Despensas</h1>
          {/* avatar de nome */}
          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-md"
            title="Sair"
          >
            {getInitials()}
          </button>
        </div>
      </header>

      {/* conteudo */}
      <main className="px-4 py-4">
        {/* filtros */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('todas')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'todas'
                ? 'bg-blue-300 text-white border-blue-800'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('vazias')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'vazias'
                ? 'bg-blue-300 text-white border-blue-800'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Vazias
          </button>
        </div>

        {/* suas despensas */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : filteredDespensas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {filter === 'vazias' 
                ? 'Nenhuma despensa vazia' 
                : 'Você ainda não tem despensas'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Clique em &quot;Nova despensa&quot; para criar
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDespensas.map((despensa) => (
              <div
                key={despensa.id}
                className="relative bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => router.push(`/despensas/${despensa.id}`)}
                >
                  <h3 className="font-semibold text-gray-900 mb-2 pr-8">
                    {despensa.nome}
                  </h3>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* membros */}
                    {(despensa.total_membros || 0) > 0 && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {despensa.total_membros} {despensa.total_membros === 1 ? 'Membro' : 'Membros'}
                      </span>
                    )}
                    
                    {/* total de itens da despensa */}
                    {despensa.total_itens > 0 ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        {despensa.total_itens} {despensa.total_itens === 1 ? 'item' : 'itens'}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">
                        Nenhum item
                      </span>
                    )}
                  </div>
                </div>

                {/* Botão de menu */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpenId(menuOpenId === despensa.id ? null : despensa.id)
                  }}
                  className="absolute top-4 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </button>

                {/* Menu dropdown */}
                {menuOpenId === despensa.id && (
                  <>
                    {/* Overlay para fechar */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setMenuOpenId(null)}
                    />
                    <div className="absolute top-12 right-3 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[140px] animate-in fade-in zoom-in-95 duration-150">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuOpenId(null)
                          setDeleteConfirm({ id: despensa.id, nome: despensa.nome })
                        }}
                        className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Excluir
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* adicionar nova despensa */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-30 right-4 flex items-center gap-2 px-5 py-3 bg-white rounded-full shadow-lg border border-gray-200 text-gray-700 font-medium hover:shadow-xl transition-shadow z-40"
      >
        Nova despensa
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* modal de nova despensa */}
      <NewDespensaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadDespensas}
      />

      {/* Modal de confirmação de exclusão */}
      {deleteConfirm && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => !isDeleting && setDeleteConfirm(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Excluir despensa?
              </h3>
              <p className="text-gray-500 text-center text-sm mb-6">
                A despensa <strong>&quot;{deleteConfirm.nome}&quot;</strong> será excluída permanentemente. Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Excluindo...
                    </>
                  ) : (
                    'Excluir'
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* botao navigation */}
      <BottomNav />
    </div>
  )
}

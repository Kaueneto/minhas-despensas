'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../../../../../packages/supabase'
import {
  getLista,
  getItensLista,
  addItemLista,
  toggleCheckItem,
  updateQuantidade,
  updatePreco,
  deleteItemLista
} from '../../../services/listas'
import type { ListaCompras, ItemLista } from '../../../types'
import BottomNav from '../../../components/BottomNav'

export default function ListaDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const listaId = params.id as string

  const [lista, setLista] = useState<ListaCompras | null>(null)
  const [itens, setItens] = useState<ItemLista[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [novoItem, setNovoItem] = useState('')
  const [precificarItens, setPrecificarItens] = useState(false)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedItens, setSelectedItens] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [ordenacao, setOrdenacao] = useState<'recentes' | 'adquiridos' | 'faltando' | 'maior-preco' | 'menor-preco' | 'alfabetica'>('recentes')
  const [showOrdenacaoMenu, setShowOrdenacaoMenu] = useState(false)
  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({})

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/Login')
        return
      }

      await loadLista()
      await loadItens()
    }

    checkAuth()
  }, [router, listaId])

  const loadLista = async () => {
    const { success, data } = await getLista(listaId)
    if (success && data) {
      setLista(data)
    }
  }

  const loadItens = async () => {
    setIsLoading(true)
    const data = await getItensLista(listaId)
    setItens(data)
    
    // Verificar se algum item tem preço para ativar precificação automaticamente
    if (data.some(item => item.price !== null && item.price > 0)) {
      setPrecificarItens(true)
    }
    
    setIsLoading(false)
  }

  // Ordenar itens
  const itensOrdenados = [...itens].sort((a, b) => {
    switch (ordenacao) {
      case 'recentes':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'adquiridos':
        if (a.is_checked && !b.is_checked) return -1
        if (!a.is_checked && b.is_checked) return 1
        return 0
      case 'faltando':
        if (!a.is_checked && b.is_checked) return -1
        if (a.is_checked && !b.is_checked) return 1
        return 0
      case 'maior-preco':
        return (b.price || 0) - (a.price || 0)
      case 'menor-preco':
        return (a.price || 0) - (b.price || 0)
      case 'alfabetica':
        return a.descricao.localeCompare(b.descricao)
      default:
        return 0
    }
  })

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novoItem.trim()) return

    const { success, data } = await addItemLista(listaId, novoItem.trim())
    if (success && data) {
      setItens([...itens, data])
      setNovoItem('')
      await loadLista()
    }
  }

  const handleToggleCheck = async (itemId: string, is_checked: boolean) => {
    const { success } = await toggleCheckItem(itemId, is_checked)
    if (success) {
      setItens(itens.map(item => 
        item.id === itemId ? { ...item, is_checked: is_checked } : item
      ))
    }
  }

  const handleUpdateQtde = async (itemId: string, delta: number) => {
    const item = itens.find(i => i.id === itemId)
    if (!item) return

    const novaQtde = Math.max(1, item.qtde + delta)
    const { success } = await updateQuantidade(itemId, novaQtde)
    
    if (success) {
      setItens(itens.map(i => 
        i.id === itemId ? { ...i, qtde: novaQtde } : i
      ))
    }
  }

  const handlePrecoChange = (itemId: string, valor: string) => {
    // Permite digitar apenas números, vírgula e ponto
    const valorLimpo = valor.replace(/[^\d,\.]/g, '')
    setEditingPrices({ ...editingPrices, [itemId]: valorLimpo })
  }

  const handlePrecoBlur = async (itemId: string) => {
    const valorDigitado = editingPrices[itemId]
    if (valorDigitado === undefined) return

    // Converter vírgula para ponto e parsear
    const valorNumerico = valorDigitado.trim() === '' ? null : parseFloat(valorDigitado.replace(',', '.'))
    
    if (valorNumerico !== null && (isNaN(valorNumerico) || valorNumerico < 0)) {
      // Limpar se inválido
      const { [itemId]: _, ...rest } = editingPrices
      setEditingPrices(rest)
      return
    }
    
    const { success } = await updatePreco(itemId, valorNumerico)
    
    if (success) {
      setItens(itens.map(i => 
        i.id === itemId ? { ...i, price: valorNumerico } : i
      ))
      // Limpar estado de edição
      const { [itemId]: _, ...rest } = editingPrices
      setEditingPrices(rest)
    }
  }

  const getPrecoDisplay = (itemId: string, price: number | null): string => {
    // Se está editando, mostrar valor digitado
    if (editingPrices[itemId] !== undefined) {
      return editingPrices[itemId]
    }
    // Senão, formatar o preço salvo
    if (!price) return ''
    return price.toFixed(2).replace('.', ',')
  }

  const handleDeleteSelected = async () => {
    if (selectedItens.length === 0) return
    
    setIsDeleting(true)
    
    for (const id of selectedItens) {
      await deleteItemLista(id, listaId)
    }
    
    setItens(itens.filter(i => !selectedItens.includes(i.id)))
    await loadLista()
    
    setIsDeleting(false)
    setSelectedItens([])
    setIsSelectionMode(false)
  }

  const toggleSelectItem = (id: string) => {
    setSelectedItens(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedItens.length === itens.length) {
      setSelectedItens([])
    } else {
      setSelectedItens(itens.map(i => i.id))
    }
  }

  const exitSelectionMode = () => {
    setIsSelectionMode(false)
    setSelectedItens([])
  }

  // Calcular totais
  const calcularTotais = () => {
    let totalGeral = 0
    let totalMarcados = 0

    itens.forEach(item => {
      const valorItem = (item.price || 0) * item.qtde
      totalGeral += valorItem
      
      if (item.is_checked) {
        totalMarcados += valorItem
      }
    })

    return { totalGeral, totalMarcados }
  }

  const { totalGeral, totalMarcados } = calcularTotais()

  const formatarData = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!lista) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-md border border-gray-200/50 hover:bg-white/80 flex items-center justify-center transition-all shadow-sm"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate">{lista.nome}</h1>
            {lista.observacoes && (
              <p className="text-xs text-gray-500 truncate">{lista.observacoes}</p>
            )}
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                <div className="absolute top-12 right-0 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 min-w-45">
                  <button
                    onClick={() => {
                      setIsSelectionMode(true)
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-3 text-left text-gray-800 hover:bg-gray-50 transition-colors text-sm"
                  >
                    Excluir itens
                  </button>
                </div>
              </>
            )}
          </div>

          {/* botao de ordenar */}
          <div className="relative">
            <button
              onClick={() => setShowOrdenacaoMenu(!showOrdenacaoMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Ordenar"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            </button>

            {showOrdenacaoMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowOrdenacaoMenu(false)}
                />
                <div className="absolute top-12 right-0 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 min-w-50">
                  <button
                    onClick={() => {
                      setOrdenacao('recentes')
                      setShowOrdenacaoMenu(false)
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-sm ${
                      ordenacao === 'recentes' ? 'text-blue-600 font-medium' : 'text-gray-800'
                    }`}
                  >
                    Mais recentes
                  </button>
                  <button
                    onClick={() => {
                      setOrdenacao('adquiridos')
                      setShowOrdenacaoMenu(false)
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-sm ${
                      ordenacao === 'adquiridos' ? 'text-blue-600 font-medium' : 'text-gray-800'
                    }`}
                  >
                    Adquiridos primeiro
                  </button>
                  <button
                    onClick={() => {
                      setOrdenacao('faltando')
                      setShowOrdenacaoMenu(false)
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-sm ${
                      ordenacao === 'faltando' ? 'text-blue-600 font-medium' : 'text-gray-800'
                    }`}
                  >
                    Faltando primeiro
                  </button>
                  {precificarItens && (
                    <>
                      <button
                        onClick={() => {
                          setOrdenacao('maior-preco')
                          setShowOrdenacaoMenu(false)
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-sm ${
                          ordenacao === 'maior-preco' ? 'text-blue-600 font-medium' : 'text-gray-800'
                        }`}
                      >
                        Maior preço
                      </button>
                      <button
                        onClick={() => {
                          setOrdenacao('menor-preco')
                          setShowOrdenacaoMenu(false)
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-sm ${
                          ordenacao === 'menor-preco' ? 'text-blue-600 font-medium' : 'text-gray-800'
                        }`}
                      >
                        Menor preço
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setOrdenacao('alfabetica')
                      setShowOrdenacaoMenu(false)
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-sm ${
                      ordenacao === 'alfabetica' ? 'text-blue-600 font-medium' : 'text-gray-800'
                    }`}
                  >
                    Ordem alfabética
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Barra de seleção */}
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
                {selectedItens.length > 0 
                  ? `${selectedItens.length} item${selectedItens.length > 1 ? 's' : ''}`
                  : 'Selecione'}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0">
              {itens.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="p-2 hover:bg-blue-600 rounded-full transition-colors"
                  title={selectedItens.length === itens.length ? 'Desmarcar todos' : 'Selecionar todos'}
                >
                  {selectedItens.length === itens.length ? (
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
              
              {selectedItens.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="px-3 py-1.5 bg-red-500/90 backdrop-blur-md hover:bg-red-500 rounded-full text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-lg"
                >
                  {isDeleting ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
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

      {/* Conteúdo */}
      <main className="px-4 py-4">
        {/* Toggle Precificar */}
        <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-gray-700">Precificar itens</span>
            <button
              type="button"
              onClick={() => setPrecificarItens(!precificarItens)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                precificarItens ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  precificarItens ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        </div>

        {/* Totalizadores */}
        {precificarItens && itens.length > 0 && (
          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total geral</p>
                <p className="text-lg font-semibold text-gray-900">
                  R$ {totalGeral.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total adquirido</p>
                <p className="text-lg font-semibold text-green-600">
                  R$ {totalMarcados.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form adicionar item */}
        <form onSubmit={handleAddItem} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={novoItem}
              onChange={(e) => setNovoItem(e.target.value)}
              placeholder="Adicionar item..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              type="submit"
              disabled={!novoItem.trim()}
              className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </form>

        {/* Lista de itens */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : itens.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            Nenhum item na lista ainda
          </div>
        ) : (
          <div className="space-y-3">
            {itensOrdenados.map((item) => {
              const isSelected = selectedItens.includes(item.id)
              
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${
                    isSelected 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : item.is_checked
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-100'
                  }`}
                >
                  {isSelectionMode ? (
                    <div 
                      className="flex items-start gap-3 cursor-pointer"
                      onClick={() => toggleSelectItem(item.id)}
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
                        <p className="text-gray-900 font-medium">{item.descricao}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatarData(item.created_at)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => handleToggleCheck(item.id, !item.is_checked)}
                          className="shrink-0 mt-1"
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                            item.is_checked 
                              ? 'bg-green-500 border-green-500 scale-110' 
                              : 'border-gray-300 hover:border-green-400'
                          }`}>
                            {item.is_checked && (
                              <svg className="w-4 h-4 text-white animate-in zoom-in duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${item.is_checked ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {item.descricao}
                          </p>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <p className="text-xs text-gray-400">
                              {formatarData(item.created_at)}
                            </p>
                            {precificarItens && item.price && item.price > 0 && (
                              <p className="text-xs font-medium text-gray-600">
                                Total: R$ {(item.price * item.qtde).toFixed(2).replace('.', ',')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quantidade e Preço */}
                      <div className="flex items-center gap-3 pl-9">
                        {/* Quantidade */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateQtde(item.id, -1)}
                            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          
                          <span className="text-sm font-medium text-gray-700 w-6 text-center">
                            {item.qtde}
                          </span>
                          
                          <button
                            onClick={() => handleUpdateQtde(item.id, 1)}
                            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>

                        {/* Preço */}
                        {precificarItens && (
                          <div className="flex-1 flex items-center gap-2">
                            <div className="flex items-center gap-1 flex-1">
                              <span className="text-xs text-gray-500">R$</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={getPrecoDisplay(item.id, item.price)}
                                onChange={(e) => handlePrecoChange(item.id, e.target.value)}
                                onBlur={() => handlePrecoBlur(item.id)}
                                placeholder="0,00"
                                className="flex-1 min-w-0 px-2 py-1 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                              />
                            </div>
                          </div>
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

      <BottomNav />
    </div>
  )
}

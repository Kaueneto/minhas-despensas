import { supabase } from '../lib/supabase'
import type { ListaCompras, ItemLista } from '../types'

// listar todas as listas de compras do usuário
export async function getListas(): Promise<ListaCompras[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('listascompras')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar listas:', error)
    return []
  }
}

// criar uma nova lista de compras
export async function createLista(nome: string, observacoes?: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { data, error } = await supabase
      .from('listascompras')
      .insert({
        user_id: user.id,
        nome,
        observacoes,
        total_itens: 0
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao criar lista:', error)
    return { success: false, error }
  }
}

// deletar uma lista de compras
export async function deleteLista(id: string) {
  try {
    const { error } = await supabase
      .from('listascompras')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar lista:', error)
    return { success: false, error }
  }
}

// buscar detalhes de uma lista específica
export async function getLista(id: string) {
  try {
    const { data, error } = await supabase
      .from('listascompras')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao buscar lista:', error)
    return { success: false, error }
  }
}

// listar itens de uma lista
export async function getItensLista(listaId: string): Promise<ItemLista[]> {
  try {
    const { data, error } = await supabase
      .from('itens_lista')
      .select('*')
      .eq('listacompras_id', listaId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar itens da lista:', error)
    return []
  }
}

// add item à lista
export async function addItemLista(listaId: string, descricao: string, qtde: number = 1, price: number | null = null) {
  try {
    const { data, error } = await supabase
      .from('itens_lista')
      .insert({
        listacompras_id: listaId,
        descricao,
        qtde,
        price,
        is_checked: false
      })
      .select()
      .single()

    if (error) throw error

    // atualizar total de itens na lista
    await atualizarTotalItens(listaId)

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao adicionar item:', error)
    return { success: false, error }
  }
}

// atualizar item da lista
export async function updateItemLista(itemId: string, updates: Partial<ItemLista>) {
  try {
    const { data, error } = await supabase
      .from('itens_lista')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao atualizar item:', error)
    return { success: false, error }
  }
}

// deletar item da lista
export async function deleteItemLista(itemId: string, listaId: string) {
  try {
    const { error } = await supabase
      .from('itens_lista')
      .delete()
      .eq('id', itemId)

    if (error) throw error

    // att total de itens na lista
    await atualizarTotalItens(listaId)

    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar item:', error)
    return { success: false, error }
  }
}

// att total de itens na lista
async function atualizarTotalItens(listaId: string) {
  try {
    const { count } = await supabase
      .from('itens_lista')
      .select('*', { count: 'exact', head: true })
      .eq('listacompras_id', listaId)

    await supabase
      .from('listascompras')
      .update({ total_itens: count || 0 })
      .eq('id', listaId)
  } catch (error) {
    console.error('Erro ao atualizar total de itens:', error)
  }
}

// toggle check do item
export async function toggleCheckItem(itemId: string, checked: boolean) {
  return updateItemLista(itemId, { is_checked: checked })
}

// att quantidade do item
export async function updateQuantidade(itemId: string, qtde: number) {
  if (qtde < 1) qtde = 1
  return updateItemLista(itemId, { qtde })
}

// att preço do item
export async function updatePreco(itemId: string, price: number | null) {
  return updateItemLista(itemId, { price })
}

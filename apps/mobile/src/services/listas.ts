import { supabase } from './supabase'
import type { ListaCompras } from '../types'

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

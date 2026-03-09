import { supabase } from './supabase'
import type { Despensa, DespensaComDetalhes } from '../types'

export async function getDespensas(): Promise<DespensaComDetalhes[]> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  // buscar despensas onde o usuário é owner
  const { data: despensas, error } = await supabase
    .from('despensas')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar despensas:', error.message)
    return []
  }

  if (!despensas || despensas.length === 0) {
    return []
  }

  // pra cada despensa, contar itens
  const despensasComDetalhes: DespensaComDetalhes[] = await Promise.all(
    despensas.map(async (despensa: Despensa) => {
      // contar itens
      let totalItens = 0
      try {
        const { count } = await supabase
          .from('despensa_itens')
          .select('*', { count: 'exact', head: true })
          .eq('despensa_id', despensa.id)
        totalItens = count || 0
      } catch {
        // ignore erros de contagem
      }

      // contar qtde de membros
      let totalMembros = 0
      try {
        const { count } = await supabase
          .from('despensa_membros')
          .select('*', { count: 'exact', head: true })
          .eq('despensa_id', despensa.id)
        totalMembros = count || 0
      } catch {
        // Ignorar erro de contagem
      }

      return {
        ...despensa,
        membros: [],
        total_itens: totalItens,
        total_membros: totalMembros
      }
    })
  )

  return despensasComDetalhes
}

export async function createDespensa(nome: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { data, error } = await supabase
      .from('despensas')
      .insert({
        nome,
        owner_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao criar despensa:', error)
    return { success: false, error }
  }
}

export async function deleteDespensa(id: string) {
  try {
    const { error } = await supabase
      .from('despensas')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar despensa:', error)
    return { success: false, error }
  }
}

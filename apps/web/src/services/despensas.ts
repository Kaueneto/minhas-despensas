import { supabase } from "../../../../packages/supabase"
import type { Despensa, DespensaComDetalhes } from "../types"

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

  // pra cada despensa, contar itens (sem buscar membros por enquanto para evitar recursão)
  const despensasComDetalhes: DespensaComDetalhes[] = await Promise.all(
    despensas.map(async (despensa: Despensa) => {
      // contar 
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

export async function createDespensa(nome: string): Promise<{ data: Despensa | null, error: Error | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: new Error('Usuário não autenticado') }
  }

  const { data, error } = await supabase
    .from('despensas')
    .insert({
      nome,
      owner_id: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar despensa:', error.message)
    return { data: null, error: new Error(error.message) }
  }

  return { data: data as Despensa, error: null }
}

export async function createConvite(despensaId: string, email: string): Promise<{ success: boolean, error: string | null }> {
  // buscar dados do usuario logado e da despensa
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'Usuário não autenticado' }
  }

  // buscar nome do usuario
  const { data: userData } = await supabase
    .from('users')
    .select('nome, email')
    .eq('id', user.id)
    .single()

  const nomeRemetente = userData?.nome || userData?.email?.split('@')[0] || 'Alguém'

  // buscar nome da despensa
  const { data: despensaData } = await supabase
    .from('despensas')
    .select('nome')
    .eq('id', despensaId)
    .single()

  const nomeDespensa = despensaData?.nome || 'Despensa'

  // gerar token unico
  const token = crypto.randomUUID()
  
  // expira em sete dias
  const expiraEm = new Date()
  expiraEm.setDate(expiraEm.getDate() + 7)

  const { error } = await supabase
    .from('convites')
    .insert({
      despensa_id: despensaId,
      email: email.toLowerCase().trim(),
      token,
      status: 'pending',
      expira_em: expiraEm.toISOString(),
      criado_em: new Date().toISOString()
    })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Já existe um convite pendente para este email' }
    }
    return { success: false, error: error.message }
  }

  //enviar email via api route quando configurar o serviço de email por enquanto,
  //o convite fica salvo no banco e pode ser compartilhado manualmente
  console.log(`Convite criado para ${email}. Token: ${token}`)

  return { success: true, error: null }
}

export async function deleteDespensa(despensaId: string): Promise<{ success: boolean, error: string | null }> {
  const { error } = await supabase
    .from('despensas')
    .delete()
    .eq('id', despensaId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

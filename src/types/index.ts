export interface Despensa {
  id: string
  nome: string
  owner_id: string
  created_at: string
}

export interface DespensaMembro {
  id: string
  despensa_id: string
  user_id: string
  role: 'owner' | 'member'
  created_at: string
}

export interface DespensaItem {
  id: string
  despensa_id: string
  nome: string
  quantidade: number
  unidade: string
  created_at: string
}

export interface Convite {
  id: string
  despensa_id: string
  email: string
  token: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  expira_em: string
}

export interface DespensaComDetalhes extends Despensa {
  membros: DespensaMembro[]
  total_itens: number
  total_membros?: number
}

export interface User {
  id: string
  email: string
  nome?: string
  created_at?: string
}

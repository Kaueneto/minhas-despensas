import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../services/supabase'
import { getDespensas, createDespensa, deleteDespensa } from '../services/despensas'
import { signOut } from '../services/auth'
import type { DespensaComDetalhes } from '../types'
import BottomNav from '../components/BottomNav'
import { Ionicons } from '@expo/vector-icons';

type FilterType = 'todas' | 'vazias'

export default function DespensasScreen() {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterType>('todas')
  const [despensas, setDespensas] = useState<DespensaComDetalhes[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [novaDespensaNome, setNovaDespensaNome] = useState('')
  const [user, setUser] = useState<{ email?: string; nome?: string } | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedDespensas, setSelectedDespensas] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  // verificar autenticação e buscar dados
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.replace('/login')
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

  const loadDespensas = async () => {
    setIsLoading(true)
    const data = await getDespensas()
    setDespensas(data)
    setIsLoading(false)
  }

  const handleLogout = async () => {
    Alert.alert(
      'Sair',
      'Deseja realmente sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await signOut()
            router.replace('/login')
          }
        }
      ]
    )
  }

  const handleCreateDespensa = async () => {
    if (!novaDespensaNome.trim()) {
      Alert.alert('Erro', 'Digite um nome para a despensa')
      return
    }

    const result = await createDespensa(novaDespensaNome.trim())
    if (result.success) {
      setIsModalOpen(false)
      setNovaDespensaNome('')
      await loadDespensas()
    } else {
      Alert.alert('Erro', 'Não foi possível criar a despensa')
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedDespensas.length === 0) return
    
    Alert.alert(
      'Confirmar exclusão',
      `Deseja excluir ${selectedDespensas.length} ${selectedDespensas.length > 1 ? 'despensas' : 'despensa'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true)
            
            for (const id of selectedDespensas) {
              await deleteDespensa(id)
            }
            
            setDespensas(despensas.filter(d => !selectedDespensas.includes(d.id)))
            
            setIsDeleting(false)
            setSelectedDespensas([])
            setIsSelectionMode(false)
          }
        }
      ]
    )
  }

  const toggleSelectDespensa = (id: string) => {
    setSelectedDespensas(prev => 
      prev.includes(id) 
        ? prev.filter(despensaId => despensaId !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    const filtered = filteredDespensas
    if (selectedDespensas.length === filtered.length) {
      setSelectedDespensas([])
    } else {
      setSelectedDespensas(filtered.map(d => d.id))
    }
  }

  const exitSelectionMode = () => {
    setIsSelectionMode(false)
    setSelectedDespensas([])
  }

  // filtrar as despensas do usuario
  const filteredDespensas = despensas.filter(d => {
    if (filter === 'vazias') return d.total_itens === 0
    if (filter === 'naoVazias') return d.total_itens > 0
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
    
    const emailPart = name.split('@')[0]
    return emailPart.substring(0, 2).toUpperCase()
  }

  const renderDespensaItem = ({ item }: { item: DespensaComDetalhes }) => {
    const isSelected = selectedDespensas.includes(item.id)

    return (
      <TouchableOpacity
        style={[
          styles.despensaCard,
          isSelected && styles.despensaCardSelected
        ]}
        onPress={() => {
          if (isSelectionMode) {
            toggleSelectDespensa(item.id);
          } else {
            // Navegar para a tela de itens passando os parâmetros necessários
            router.push({
              pathname: '/despensa/[id]',
              params: { 
                id: item.id, 
                nome: item.nome 
              }
            });
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.despensaContent}>
          <Text style={styles.despensaNome}>{item.nome}</Text>
          
          <View style={styles.badges}>
            {(item.total_membros || 0) > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.total_membros} {item.total_membros === 1 ? 'membro' : 'membros'}
                </Text>
              </View>
            )}
            
            {item.total_itens > 0 ? (
              <View style={[styles.badge, styles.badgeBlue]}>
                <Text style={[styles.badgeText, styles.badgeTextBlue]}>
                  {item.total_itens} {item.total_itens === 1 ? 'item' : 'itens'}
                </Text>
              </View>
            ) : (
              <View style={[styles.badge, styles.badgeGray]}>
                <Text style={[styles.badgeText, styles.badgeTextGray]}>
                  Vazia
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Despensas</Text>
        
        <View style={styles.headerActions}>
          {/* icone de lixeira que ativa o omodo de selecao */}
          <TouchableOpacity
            style={styles.trashButton}
            onPress={() => setIsSelectionMode(true)}
          >
         <Ionicons name="trash-outline" size={20} color="#4B5563" />
          </TouchableOpacity>

          {/* Avatar */}
          <TouchableOpacity
            style={styles.avatar}
            onPress={handleLogout}
          >
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Barra de seleção */}
      {isSelectionMode && (
        <View style={styles.selectionBar}>
          <View style={styles.selectionLeft}>
            <TouchableOpacity
              style={styles.selectionButton}
              onPress={exitSelectionMode}
            >
              <Text style={styles.selectionButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.selectionText}>
              {selectedDespensas.length > 0 
                ? `${selectedDespensas.length} ${selectedDespensas.length > 1 ? 'itens' : 'item'}`
                : 'Selecione'}
            </Text>
          </View>
          
          <View style={styles.selectionRight}>
            {filteredDespensas.length > 0 && (
              <TouchableOpacity
                style={styles.selectAllButton}
                onPress={handleSelectAll}
              >
                <Text style={styles.selectAllText}>
                  {selectedDespensas.length === filteredDespensas.length ? 'Desmarcar todas' : 'Selecionar todas'}
                </Text>
              </TouchableOpacity>
            )}
            
        {selectedDespensas.length > 0 && (
          <TouchableOpacity
            style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
            onPress={handleDeleteSelected}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="trash-outline" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        )}
          </View>
        </View>
      )}

      {/* Filtros */}
      <View style={styles.filters}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'todas' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('todas')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'todas' && styles.filterButtonTextActive
          ]}>
            Todas
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'vazias' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('vazias')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'vazias' && styles.filterButtonTextActive
          ]}>
            Vazias
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'naoVazias' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('naoVazias')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'naoVazias' && styles.filterButtonTextActive
          ]}>
            Não vazias
          </Text>
        </TouchableOpacity>

      </View>

      {/* Conteúdo */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : filteredDespensas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {filter === 'vazias' 
              ? 'Nenhuma despensa vazia' 
              : 'Você ainda não tem despensas'}
          </Text>
          <Text style={styles.emptySubtext}>
            Clique em "Nova despensa" para criar
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredDespensas}
          renderItem={renderDespensaItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Botão adicionar nova despensa */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsModalOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabText}>Nova despensa</Text>
      </TouchableOpacity>

      {/* Modal de nova despensa */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKeyboardView}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsModalOpen(false)}
          >
            <TouchableOpacity
              style={styles.modalContent}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
            <Text style={styles.modalTitle}>Nova Despensa</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nome da despensa"
              value={novaDespensaNome}
              onChangeText={setNovaDespensaNome}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setIsModalOpen(false)
                  setNovaDespensaNome('')
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCreate]}
                onPress={handleCreateDespensa}
              >
                <Text style={styles.modalButtonTextCreate}>Criar</Text>
              </TouchableOpacity>
            </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Navegação Inferior */}
      <BottomNav />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trashButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trashIcon: {
    fontSize: 18,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  selectionBar: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  selectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  selectionButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  selectionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  selectAllButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectAllText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#93C5FD',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 120,
  },
  despensaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  despensaCardSelected: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },
  despensaContent: {
    flex: 1,
  },
  despensaNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  badgeBlue: {
    backgroundColor: '#DBEAFE',
  },
  badgeGray: {
    backgroundColor: '#F3F4F6',
  },
  badgeText: {
    fontSize: 12,
    color: '#4B5563',
  },
  badgeTextBlue: {
    color: '#1E40AF',
  },
  badgeTextGray: {
    color: '#6B7280',
  },
  fab: {
    position: 'absolute',
    bottom: 140,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  fabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  modalKeyboardView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonCreate: {
    backgroundColor: '#3B82F6',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modalButtonTextCreate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
})

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
import { supabase } from '../services/supabase'
import { getListas, createLista, deleteLista } from '../services/listas'
import { signOut } from '../services/auth'
import type { ListaCompras } from '../types'
import BottomNav from '../components/BottomNav'
import { Ionicons } from '@expo/vector-icons';
export default function ListasScreen({ navigation }: any) {
  const [listas, setListas] = useState<ListaCompras[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [novaListaNome, setNovaListaNome] = useState('')
  const [novaListaObs, setNovaListaObs] = useState('')
  const [user, setUser] = useState<{ email?: string; nome?: string } | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedListas, setSelectedListas] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      navigation.replace('/login')
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

  const loadListas = async () => {
    setIsLoading(true)
    const data = await getListas()
    setListas(data)
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
            navigation.replace('/login')
          }
        }
      ]
    )
  }

  const handleCreateLista = async () => {
    if (!novaListaNome.trim()) {
      Alert.alert('Erro', 'Digite um nome para a lista')
      return
    }

    const result = await createLista(novaListaNome.trim(), novaListaObs.trim() || undefined)
    if (result.success) {
      setIsModalOpen(false)
      setNovaListaNome('')
      setNovaListaObs('')
      await loadListas()
    } else {
      Alert.alert('Erro', 'Não foi possível criar a lista')
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedListas.length === 0) return
    
    Alert.alert(
      'Confirmar exclusão',
      `Deseja excluir ${selectedListas.length} ${selectedListas.length > 1 ? 'listas' : 'lista'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true)
            
            for (const id of selectedListas) {
              await deleteLista(id)
            }
            
            setListas(listas.filter(l => !selectedListas.includes(l.id)))
            
            setIsDeleting(false)
            setSelectedListas([])
            setIsSelectionMode(false)
          }
        }
      ]
    )
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

  const renderListaItem = ({ item }: { item: ListaCompras }) => {
    const isSelected = selectedListas.includes(item.id)

    return (
      <TouchableOpacity
        style={[
          styles.listaCard,
          isSelected && styles.listaCardSelected
        ]}
        onPress={() => {
          if (isSelectionMode) {
            toggleSelectLista(item.id)
          } else {
            // Navegar para detalhes da lista
            // navigation.navigate('ItensLista', { id: item.id })
          }
        }}
        activeOpacity={0.7}
      >
        {isSelectionMode && (
          <View style={styles.checkbox}>
            <View style={[
              styles.checkboxInner,
              isSelected && styles.checkboxSelected
            ]}>
              {isSelected && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
          </View>
        )}
        
        <View style={styles.listaContent}>
          <Text style={styles.listaNome}>{item.nome}</Text>
          
          <View style={styles.badges}>
            <View style={[styles.badge, styles.badgeBlue]}>
              <Text style={[styles.badgeText, styles.badgeTextBlue]}>
                {item.total_itens} {item.total_itens === 1 ? 'item' : 'itens'}
              </Text>
            </View>
            
            {item.observacoes && (
              <Text style={styles.observacoes} numberOfLines={1}>
                {item.observacoes}
              </Text>
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
        <Text style={styles.headerTitle}>Listas de Compras</Text>
        
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
              {selectedListas.length > 0 
                ? `${selectedListas.length} item${selectedListas.length > 1 ? 's' : ''}`
                : 'Selecione'}
            </Text>
          </View>
          
          <View style={styles.selectionRight}>
            {listas.length > 0 && (
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={handleSelectAll}
              >
                <Text style={styles.selectionButtonText}>
                  {selectedListas.length === listas.length ? '☒' : '☐'}
                </Text>
              </TouchableOpacity>
            )}
            
           {selectedListas.length > 0 && (
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

      {/* Conteúdo */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : listas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Você ainda não tem listas</Text>
          <Text style={styles.emptySubtext}>
            Clique em "Nova lista" para criar
          </Text>
        </View>
      ) : (
        <FlatList
          data={listas}
          renderItem={renderListaItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Botão adicionar nova lista */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsModalOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabText}>Nova lista</Text>
      </TouchableOpacity>

      {/* Modal de nova lista */}
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
            <Text style={styles.modalTitle}>Nova Lista</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nome da lista"
              value={novaListaNome}
              onChangeText={setNovaListaNome}
              autoFocus
            />
            
            <TextInput
              style={[styles.input, styles.inputTextArea]}
              placeholder="Observações (opcional)"
              value={novaListaObs}
              onChangeText={setNovaListaObs}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setIsModalOpen(false)
                  setNovaListaNome('')
                  setNovaListaObs('')
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCreate]}
                onPress={handleCreateLista}
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
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuDots: {
    fontSize: 20,
    color: '#4B5563',
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
  menuOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  menuDropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 180,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 14,
    color: '#374151',
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
  listaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listaCardSelected: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listaContent: {
    flex: 1,
  },
  listaNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
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
  badgeText: {
    fontSize: 12,
    color: '#4B5563',
  },
  badgeTextBlue: {
    color: '#1E40AF',
  },
  observacoes: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
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
    marginBottom: 12,
  },
   trashButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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

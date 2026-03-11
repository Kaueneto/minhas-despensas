import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../services/supabase';
import { Ionicons } from '@expo/vector-icons'; //para o botão de voltar e ícones rápidos

interface ItemDespensa {
  id: string;
  nome: string;
  data_vencimento: string;
  quantidade: number;
  unidade: string;
  caminho_img?: string;
  aberto: boolean;
}

export default function ItensDespensaScreen() {
  const { id: despensaId, nome: despensaNome } = useLocalSearchParams();
  const router = useRouter();
  const [filter, setFilter] = useState<'todos' | 'zeradas' | 'vencimento' | 'abertos' | 'fechados'>('todos');
  const [itens, setItens] = useState<ItemDespensa[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatarData = (dataString: string) => {
    // Se a data já está no formato DD/MM/AAAA, retorna como está
    if (dataString && dataString.includes('/')) {
      return dataString;
    }
    
    // Se a data está em outro formato, tenta converter
    try {
      const data = new Date(dataString);
      if (isNaN(data.getTime())) {
        return dataString; // Retorna original se inválida
      }
      
      const dia = data.getDate().toString().padStart(2, '0');
      const mes = (data.getMonth() + 1).toString().padStart(2, '0');
      const ano = data.getFullYear();
      
      return `${dia}/${mes}/${ano}`;
    } catch (error) {
      return dataString; // Retorna original se der erro
    }
  };

  useEffect(() => {
    fetchItens();
  }, [filter]);

  useFocusEffect(
    React.useCallback(() => {
      //recarregar dados quando a tela receber foco
      fetchItens();
    }, [])
  );

const fetchItens = async () => {
  setIsLoading(true);
  try {
    let query = supabase
      .from('despensa_itens') // sua tabela de itens
      .select('*')
      .eq('despensa_id', despensaId); // filtra apenas itens desta despensa específica

    // aplicar filtros
    if (filter === 'zeradas') {
      query = query.eq('quantidade', 0);
    } else if (filter === 'vencimento') {
      // ordenar por data de vencimento mais próxima
      query = query.order('data_vencimento', { ascending: true });
    } else if (filter === 'abertos') {
      query = query.eq('aberto', true);
    } else if (filter === 'fechados') {
      query = query.eq('aberto', false);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (data) setItens(data);
  } catch (error) {
    console.error('Erro ao carregar itens:', error);
    Alert.alert('Erro', 'Não foi possível carregar os itens desta despensa.');
  } finally {
    setIsLoading(false);
  }
};

  const renderItem = ({ item }: { item: ItemDespensa }) => (
    <View style={styles.card}>
      <View style={styles.cardImageContainer}>
        {item.caminho_img ? (
          <Image source={{ uri: item.caminho_img }} style={styles.productImage} />
        ) : (
          <View style={styles.placeholderImage}>
             <Ionicons name="fast-food-outline" size={24} color="#9CA3AF" />
          </View>
        )}
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.productName}>{item.nome}</Text>
        <Text style={styles.productVencimento}>Vence em {formatarData(item.data_vencimento)}</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, item.aberto ? styles.statusAberto : styles.statusFechado]}>
            <Text style={[styles.statusText, item.aberto ? styles.statusTextoAberto : styles.statusTextoFechado]}>
              {item.aberto ? 'Aberto' : 'Fechado'}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.productQuantity}>
        {item.quantidade} {item.quantidade === 1 ? 'unidade' : 'unidades'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color="#9CA3AF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{despensaNome || 'Itens da Despensa'}</Text>

        <TouchableOpacity
          style={styles.avatar}
          onPress={() => {/* logout logic if needed */}}
        >
          <Text style={styles.avatarText}>FC</Text>
        </TouchableOpacity>
      </View>

      {/* filtros como Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filtersScrollContainer}
        contentContainerStyle={styles.filtersContainer}
      >
        <TouchableOpacity 
          style={[styles.filterChip, filter === 'todos' && styles.filterChipActive]}
          onPress={() => setFilter('todos')}
        >
          <Text style={[styles.filterChipText, filter === 'todos' && styles.filterChipTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterChip, filter === 'zeradas' && styles.filterChipActive]}
          onPress={() => setFilter('zeradas')}
        >
          <Text style={[styles.filterChipText, filter === 'zeradas' && styles.filterChipTextActive]}>
            Zeradas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterChip, filter === 'vencimento' && styles.filterChipActive]}
          onPress={() => setFilter('vencimento')}
        >
          <Text style={[styles.filterChipText, filter === 'vencimento' && styles.filterChipTextActive]}>
            Data Próxima
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterChip, filter === 'abertos' && styles.filterChipActive]}
          onPress={() => setFilter('abertos')}
        >
          <Text style={[styles.filterChipText, filter === 'abertos' && styles.filterChipTextActive]}>
            Abertos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterChip, filter === 'fechados' && styles.filterChipActive]}
          onPress={() => setFilter('fechados')}
        >
          <Text style={[styles.filterChipText, filter === 'fechados' && styles.filterChipTextActive]}>
            Fechados
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* lista de Itens */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 50 }} />
      ) : itens.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {filter === 'zeradas' 
              ? 'Nenhum item zerado na despensa'
              : filter === 'vencimento'
              ? 'Nenhum item próximo do vencimento'
              : filter === 'abertos'
              ? 'Nenhum item aberto na despensa'
              : filter === 'fechados' 
              ? 'Nenhum item fechado na despensa'
              : 'Esta despensa está vazia'}
          </Text>
          <Text style={styles.emptySubtext}>
            Adicione itens para começar a organizar sua despensa
          </Text>
        </View>
      ) : (
        <FlatList
          data={itens}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* botao flutuante (Adicionar + Scanner) */}
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={styles.fabMain} 
          activeOpacity={0.8}
          onPress={() => {
            console.log('Botão adicionar clicado!');
            try {
              router.push({
                pathname: '/adicionar-item',
                params: { 
                  despensaId: String(despensaId), 
                  despensaNome: String(despensaNome) 
                }
              });
            } catch (error) {
              console.error('Erro na navegação:', error);
              Alert.alert('Erro', 'Erro ao navegar para adicionar item');
            }
          }}
        >
          <Ionicons name="add" size={24} color="#4B5563" />
          <Text style={styles.fabText}>Adicionar itens</Text>
        </TouchableOpacity>
        <View style={styles.fabSeparator} />
        <TouchableOpacity 
          style={styles.fabScanner}
          onPress={() => {
            console.log('Botão scanner clicado!');
            console.log('Tentando navegar para /scanner');
            console.log('Parâmetros:', { despensaId, despensaNome });
            
            try {
             
              router.push('/scanner');
            } catch (error) {
              console.error('Erro na navegação scanner:', error);
              Alert.alert('Erro', `Erro ao navegar para scanner: ${error.message}`);
            }
          }}
        >
          <Ionicons name="barcode-outline" size={24} color="#4B5563" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
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
  filtersScrollContainer: {
    maxHeight: 60,
    marginBottom: 20,
  },
  filtersContainer: {
    paddingHorizontal: 15,
    alignItems: 'center',
    gap: 5,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterTabActive: {
    backgroundColor: '#93C5FD',
    borderColor: '#3B82F6',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    // Sombra suave conforme protótipo
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  productImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  placeholderImage: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  productVencimento: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusContainer: {
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusAberto: {
    backgroundColor: '#FEF3C7',
  },
  statusFechado: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusTextoAberto: {
    color: '#92400E',
  },
  statusTextoFechado: {
    color: '#065F46',
  },
  productQuantity: {
    fontSize: 13,
    color: '#6B7280',
  },
  // Botão flutuante estilo protótipo
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fabMain: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 15,
  },
  fabText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '500',
  },
  fabSeparator: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },
  fabScanner: {
    paddingLeft: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Alert,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../services/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function AdicionarItemScreen() {
  const searchParams = useLocalSearchParams();
  const router = useRouter();
  
  const despensaId = searchParams.despensaId as string;
  const despensaNome = searchParams.despensaNome as string;
  const codigo = searchParams.codigo as string;
  const nome = searchParams.nome as string;
  const imagemUrl = searchParams.imagemUrl as string;
  const marca = searchParams.marca as string;
  
  console.log('Parâmetros recebidos:', { despensaId, despensaNome, codigo, nome, imagemUrl, marca });
  
  const [codigoState, setCodigoState] = useState(codigo || '');
  const [nomeState, setNomeState] = useState(nome || '');
  const [dataVencimento, setDataVencimento] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [aberto, setAberto] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imagemProduto, setImagemProduto] = useState(imagemUrl || '');

  // pré-preencher nome se vier do scanner e tiver marca
  useEffect(() => {
    if (nome && marca && !nomeState) {
      setNomeState(`${nome} - ${marca}`);
    } else if (nome && !marca && !nomeState) {
      setNomeState(nome);
    }
  }, [nome, marca]);

  // pré-preencher imagem se vier do scanner
  useEffect(() => {
    if (imagemUrl && !imagemProduto) {
      setImagemProduto(imagemUrl);
    }
  }, [imagemUrl]);

  const formatDate = (text: string) => {
    // remove tudo que não é número
    const numbers = text.replace(/\D/g, '');
    
    // aplica a máscara DD/MM/AAAA
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  };

  const handleDateChange = (text: string) => {
    const formatted = formatDate(text);
    setDataVencimento(formatted);
  };



  const fetchProductByBarcode = async (barcode: string) => {
    if (!barcode || barcode.length < 8) return;
    
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status === 1 && data.product) {
        const productName = data.product.product_name || '';
        const brand = data.product.brands || '';
        const imageUrl = data.product.image_url || '';
        
        if (productName) {
          setNomeState(brand ? `${productName} - ${brand}` : productName);
        }
        if (imageUrl) {
          setImagemProduto(imageUrl);
        }
      }
    } catch (error) {
      console.log('Erro ao buscar produto:', error);
    }
  };

  const handleCodigoChange = (text: string) => {
    setCodigoState(text);
    // Buscar produto automaticamente quando código tiver tamanho adequado
    if (text.length >= 8) {
      fetchProductByBarcode(text);
    }
  };

  const handleSalvar = async () => {
    if (!nomeState.trim()) {
      Alert.alert('Erro', 'Digite o nome do item');
      return;
    }

    if (!dataVencimento.trim() || dataVencimento.length !== 10) {
      Alert.alert('Erro', 'Digite uma data de vencimento válida (DD/MM/AAAA)');
      return;
    }

    if (!quantidade.trim() || parseInt(quantidade) <= 0) {
      Alert.alert('Erro', 'Digite uma quantidade válida');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Data de vencimento:', dataVencimento);
      
      const dadosItem = {
        despensa_id: despensaId,
        nome: nomeState.trim(),
        quantidade: parseInt(quantidade),
        unidade: 'unidade',
        data_vencimento: dataVencimento,
        aberto: aberto,
        caminho_img: imagemProduto || null,
      };
      
      console.log('Dados a serem salvos:', dadosItem);
    
      const { error } = await supabase
        .from('despensa_itens')
        .insert([dadosItem]);

      if (error) throw error;

      Alert.alert('Sucesso', 'Item adicionado com sucesso!', [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]);
    } catch (error: any) {
      console.error('Erro ao adicionar item:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o item');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={28} color="#9CA3AF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Novo item</Text>
        
        {/* Espaço vazio para centralizar o título */}
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Imagem do produto */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ 
              uri: imagemProduto || 'https://via.placeholder.com/120x120/E5E7EB/9CA3AF?text=Produto' 
            }} 
            style={styles.productImage}
          />
        </View>

        {/* Campo Código */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Código</Text>
          <TextInput
            style={styles.input}
            value={codigoState}
            onChangeText={handleCodigoChange}
            placeholder="Digite o código ou escaneie"
            editable={true}
            keyboardType="numeric"
          />
        </View>

        {/* Campo Nome/Descrição */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome/Descrição</Text>
          <TextInput
            style={styles.input}
            value={nomeState}
            onChangeText={setNomeState}
            placeholder=""
          />
        </View>

        {/* Linha com Data Vencimento e Quantidade */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Data Vencimento</Text>
            <TextInput
              style={styles.input}
              value={dataVencimento}
              onChangeText={handleDateChange}
              placeholder="DD/MM/AAAA"
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Quantidade</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => {
                  const newQty = Math.max(1, parseInt(quantidade || '1') - 1);
                  setQuantidade(newQty.toString());
                }}
              >
                <Text style={styles.quantityButtonText}>−</Text>
              </TouchableOpacity>
              
              <TextInput
                style={styles.quantityInput}
                value={quantidade}
                onChangeText={setQuantidade}
                keyboardType="numeric"
                textAlign="center"
              />
              
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => {
                  const newQty = parseInt(quantidade || '0') + 1;
                  setQuantidade(newQty.toString());
                }}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Botão Aberto/Fechado */}
        <View style={styles.statusContainer}>
          <TouchableOpacity 
            style={[styles.statusButton, !aberto && styles.statusButtonActive]}
            onPress={() => setAberto(false)}
          >
            <Text style={[styles.statusButtonText, !aberto && styles.statusButtonTextActive]}>
              Fechado
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.statusButton, aberto && styles.statusButtonActive]}
            onPress={() => setAberto(true)}
          >
            <Text style={[styles.statusButtonText, aberto && styles.statusButtonTextActive]}>
              Aberto
            </Text>
          </TouchableOpacity>
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSalvar}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  halfWidth: {
    flex: 1,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  quantityButton: {
    width: 40,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '500',
  },
  quantityInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    paddingVertical: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 30,
  },
  statusButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  statusButtonActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  statusButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#60A5FA',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
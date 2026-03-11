import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface OpenFoodFactsProduct {
  status: number;
  product?: {
    product_name?: string;
    brands?: string;
    image_url?: string;
  };
}

export default function ScannerScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  
  const despensaId = searchParams.despensaId as string || 'test';
  const despensaNome = searchParams.despensaNome as string || 'Test Despensa';
  
  console.log('ScannerScreen carregado!');
  console.log('Scanner - Parâmetros recebidos:', { despensaId, despensaNome });
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const fetchProductInfo = async (barcode: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data: OpenFoodFactsProduct = await response.json();
      
      if (data.status === 1 && data.product) {
        //se produto encontrado, por enquanto navegar pra tela de adiucionar
        router.push({
          pathname: '/adicionar-item',
          params: {
            despensaId: String(despensaId),
            despensaNome: String(despensaNome),
            codigo: barcode,
            nome: data.product.product_name || '',
            imagemUrl: data.product.image_url || '',
            marca: data.product.brands || '',
          }
        });
      } else {
        // produto não encontrado, navegar para adicionar item só com código
        Alert.alert(
          'Produto não encontrado',
          'Não foi possível encontrar informações sobre este produto. Você pode adicionar manualmente.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.push({
                  pathname: '/adicionar-item',
                  params: {
                    despensaId: String(despensaId),
                    despensaNome: String(despensaNome),
                    codigo: barcode,
                  }
                });
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      Alert.alert(
        'Erro',
        'Não foi possível buscar informações do produto. Tente novamente.',
        [
          {
            text: 'Tentar novamente',
            onPress: () => setScanned(false)
          },
          {
            text: 'Adicionar manualmente',
            onPress: () => {
              router.push({
                pathname: '/adicionar-item',
                params: {
                  despensaId: String(despensaId),
                  despensaNome: String(despensaNome),
                  codigo: barcode,
                }
              });
            }
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarcodeScanned = (scanningResult: any) => {
    if (scanningResult && scanningResult.data) {
      setScanned(true);
      fetchProductInfo(scanningResult.data);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Solicitando permissão da câmera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="camera-outline" size={64} color="#6B7280" />
          <Text style={styles.noPermissionText}>
            É necessário permitir o acesso à câmera para escanear códigos de barras
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Escanear código de barras</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* scanner */}
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.scanner}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39"],
          }}
        />
        
        {/* overlay com moldura de scanner */}
        <View style={styles.overlay}>
          <View style={styles.topOverlay} />
          <View style={styles.middleContainer}>
            <View style={styles.sideOverlay} />
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <View style={styles.sideOverlay} />
          </View>
          <View style={styles.bottomOverlay} />
        </View>
      </View>

      {/* instruções */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          Posicione o código de barras dentro da moldura
        </Text>
        
        {scanned && (
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.retryButtonText}>Escanear novamente</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Buscando informações do produto...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scanner: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  middleContainer: {
    flexDirection: 'row',
    height: 250,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionsContainer: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
  },
  instructionsText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noPermissionText: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  backButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
});
# App Mobile - Minhas Despensas

App mobile desenvolvido com React Native e Expo para gerenciar despensas e listas de compras.

## 🚀 Configuração Inicial

### 1. Instalar Dependências

```bash
cd apps/mobile
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto mobile (`apps/mobile/.env`) baseado no `.env.example`:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

> **Importante:** Substitua `your_supabase_url_here` e `your_supabase_anon_key_here` pelas credenciais do seu projeto Supabase.

### 3. Rodar o Projeto

```bash
# Iniciar o Expo
npm start

# Rodar no Android
npm run android

# Rodar no iOS
npm run ios
```

## 📱 Telas Implementadas

### ✅ LoginScreen
- Autenticação com email/senha
- Registro de novos usuários
- Validação de formulários

### ✅ DespensasScreen
- Listagem de despensas do usuário
- Filtros (Todas/Vazias)
- Modo de seleção para exclusão
- Criação de novas despensas
- Contador de itens e membros

### ✅ ListasScreen
- Listagem de listas de compras
- Modo de seleção para exclusão múltipla
- Criação de novas listas com observações
- Contador de itens

## 🏗️ Estrutura do Projeto

```
apps/mobile/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── DespensasScreen.tsx
│   │   ├── ListasScreen.tsx
│   │   └── ItensListaScreen.tsx
│   ├── services/
│   │   ├── supabase.ts
│   │   ├── auth.ts
│   │   ├── despensas.ts
│   │   └── listas.ts
│   ├── types/
│   │   └── index.ts
│   ├── components/
│   ├── hooks/
│   └── navigation/
├── .env
├── .env.example
├── app.json
└── package.json
```

## 🔧 Tecnologias

- **React Native** - Framework mobile
- **Expo** - Toolchain e plataforma
- **TypeScript** - Tipagem estática
- **Supabase** - Backend e autenticação
- **React Navigation** - Navegação entre telas

## 📝 Próximos Passos

1. Configurar navegação entre telas
2. Implementar tela de detalhes da despensa
3. Implementar tela de itens da lista
4. Adicionar funcionalidade de convites
5. Adicionar testes

## 🐛 Troubleshooting

### Erro de módulo @supabase/supabase-js

```bash
cd apps/mobile
npm install @supabase/supabase-js
```

### Variáveis de ambiente não funcionam

Certifique-se de que:
1. O arquivo `.env` está na pasta `apps/mobile/`
2. As variáveis começam com `EXPO_PUBLIC_`
3. Você reiniciou o Expo após criar o `.env`

## 📄 Licença

Este projeto está sob a licença MIT.

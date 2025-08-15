# Dashboard de Gestão de Pátio - Oficina Chevron

Este é um painel de controle no estilo Kanban para gerenciar o fluxo de Ordens de Serviço em uma oficina mecânica. A aplicação é construída com HTML, TailwindCSS, JavaScript puro e utiliza o Firebase Realtime Database como backend.

## Funcionalidades

- Visualização do pátio em colunas de status (Kanban).
- Criação e edição de Ordens de Serviço (O.S.).
- Histórico detalhado para cada O.S., com logs de status, serviços, peças e valores.
- Upload de mídia (fotos/vídeos) para o histórico, via ImgBB.
- Painel de alertas para status que exigem atenção imediata.
- Autenticação de usuário baseada em perfis.
- Design responsivo para uso em desktops e dispositivos móveis.

---

## 🚀 Como Configurar e Implantar

Siga estes passos para colocar o projeto no ar usando o GitHub Pages.

### 1. Crie o Arquivo de Configuração

As chaves de API do Firebase e do ImgBB são mantidas em um arquivo separado para segurança e **não devem ser enviadas para o repositório público**.

1.  Dentro da pasta `public/js/`, crie um novo arquivo chamado `config.js`.
2.  Copie o conteúdo do arquivo `config.example.js` e cole no seu novo `config.js`.
3.  Substitua os valores `placeholder` pelas suas chaves de API reais.

O conteúdo do seu `public/js/config.js` deve ser assim:

```javascript
// Chaves de API para os serviços utilizados na aplicação.
// ESTE ARQUIVO NÃO DEVE SER ENVIADO PARA O GITHUB.
// Ele está listado no .gitignore para ser ignorado pelo Git.

const firebaseConfig = {
  apiKey: "AIzaSyB5JpYm8l0AlF5ZG3HtkyFZgmrpsUrDhv0",
  authDomain: "dashboard-oficina-pro.firebaseapp.com",
  databaseURL: "https://dashboard-oficina-pro-default-rtdb.firebaseio.com",
  projectId: "dashboard-oficina-pro",
  storageBucket: "dashboard-oficina-pro.appspot.com",
  messagingSenderId: "736157192887",
  appId: "1:736157192887:web:c23d3daade848a33d67332"
};

const imgbbApiKey = "57cb1c5a02fb6e5ef2700543d6245b70";
```

### 2. Envie para o GitHub

1.  Inicie um repositório Git no seu projeto: `git init`
2.  Adicione todos os arquivos: `git add .`
3.  Faça o commit inicial: `git commit -m "Versão inicial refatorada e segura"`
4.  Adicione seu repositório remoto do GitHub e envie os arquivos: `git push`

**Importante:** Graças ao `.gitignore`, o arquivo `config.js` com suas chaves **não será enviado**.

### 3. Implantação no GitHub Pages

1.  No seu repositório do GitHub, vá para **Settings > Pages**.
2.  Na seção "Build and deployment", em "Source", selecione **Deploy from a branch**.
3.  Selecione o branch `main` (ou `master`) e a pasta `/` (raiz) como a fonte de publicação. Clique em **Save**.
4.  **Atenção:** Como o `config.js` não é enviado ao GitHub, a versão online não funcionará. Para projetos simples como este, a solução mais direta é:
    *   **Remover temporariamente** a linha `public/js/config.js` do arquivo `.gitignore`.
    *   Fazer um `git add .` e `git commit -m "Deploy com config"`.
    *   Fazer o `git push`.
    *   **Imediatamente após a publicação**, desfazer o commit anterior ou adicionar a linha de volta ao `.gitignore` e fazer um novo commit para proteger suas chaves novamente.
    *   **Esta abordagem não é ideal para segurança máxima, mas é a mais simples para este cenário sem um pipeline de build.**

---


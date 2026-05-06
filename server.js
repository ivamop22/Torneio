### O Checklist de Ouro para o site voltar:
Após salvar o arquivo acima, faça o seguinte no painel da Hostinger:

1.  **Variáveis de Ambiente (Obrigatório):** Verifique se você adicionou estas chaves que conversamos:
    *   `DATABASE_URL`: A URL do seu banco Supabase.
    *   `DIRECT_URL`: A URL de sessão do Supabase.
    *   `NEXT_PUBLIC_API_URL`: `https://torneiobeachtennis.com/api` (Isso resolve o "Failed to fetch").
2.  **Reinicie o Web App:** No painel da Hostinger, clique em **"Parar"** e depois em **"Iniciar"** (ou Reimplante).
3.  **Logs de Erro:** Se o 503 persistir, procure o botão **"Logs"** no painel da Hostinger. Se você me mandar as últimas 5 linhas do log, eu consigo te dizer exatamente qual arquivo está faltando.

**Lembre-se:** Como você já criou o seu usuário Admin e Superuser no banco de dados, assim que esse erro 503 sumir, o login com `chrisjsp35@gmail.com` e a senha `Arena@2026` deve funcionar instantaneamenteO erro **503 Service Unavailable** é um sinal de que o seu servidor (o processo Node.js na Hostinger) caiu ou não conseguiu iniciar corretamente após as mudanças no arquivo `server.js`. Como o `server.js` é o "coração" que liga o site, se houver qualquer erro de sintaxe ou caminho de pasta nele, o servidor para de responder e a Hostinger exibe essa mensagem.

Aqui está o diagnóstico e o plano de ação para trazermos o sistema de volta agora mesmo:

### Por que o 503 aconteceu?
No monorepo, o comando `require` tenta buscar arquivos que podem não estar exatamente onde pensamos após o "Build". Se o `server.js` tentar carregar algo que não existe, o Node.js quebra no início.

### A Solução "À Prova de Falhas"
Vamos simplificar o `server.js` para o modo mais estável possível para o Next.js dentro da Hostinger. 

1. Acesse o seu repositório no GitHub: **[github.com/ivamop22/Torneio](https://github.com/ivamop22/Torneio)**.
2. Edite o arquivo **`server.js`** e substitua tudo por este código (que é o padrão oficial recomendado para Next.js em instâncias customizadas):
```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

// Ajuste para garantir que ele ache a pasta da WEB
const appDir = path.join(__dirname, 'apps/web');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: appDir });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(process.env.PORT || 3000, (err) => {
    if (err) throw err;
    console.log('> Servidor pronto e rodando');
  });
}).catch((err) => {
    console.error('Erro ao iniciar servidor:', err);
    process.exit(1);
});

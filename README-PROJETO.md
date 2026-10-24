# ruKo — Frontend FPS 3D (Protótipo multiplayer 0.4)

Frontend experimental de FPS low-poly para navegador, pensado primeiro para celular. Usa Three.js por CDN, sem etapa de build obrigatória.

## O que já existe
- Arena 3D low-poly com obstáculos e alvos de treino.
- Câmera em primeira pessoa e arma provisória.
- Controles móveis: joystick, gesto de olhar, disparo e pulo.
- Controles de computador: WASD, mouse e clique para disparar.
- HUD, vida e pontuação de teste.
- Camada `NetworkClient` separada e protocolo inicial documentado.

## Multiplayer inicial
O frontend está configurado para conectar a `wss://ruko-server.onrender.com`. Ao entrar, recebe um ponto de surgimento do servidor e mostra os outros jogadores usando avatares simples. Alvos, disparos e pontuação ainda são locais; esta etapa sincroniza principalmente jogadores e movimento, não é ainda um sistema completo de combate multiplayer.

## Testar localmente
Como o JavaScript usa módulos ES, abra com um servidor HTTP local (não apenas dando duplo clique no HTML).

Se tiver Python instalado, na pasta do projeto rode:

```bash
python -m http.server 8000
```

Depois abra `http://localhost:8000`.

Também pode usar a extensão Live Server do VS Code.

## Publicar no GitHub Pages
1. Crie um repositório no GitHub, por exemplo `ruko-game`.
2. Envie todos os arquivos e pastas deste projeto.
3. Em **Settings → Pages**, escolha a publicação a partir da branch `main` e da pasta `/ (root)`.
4. Aguarde a publicação e abra a URL que o GitHub Pages fornecer.

O Three.js é importado por CDN; para carregar o jogo, o navegador precisa de conexão à internet.

## Configuração do backend atual
Em `src/config.js`, a URL atual do servidor já está configurada:

```js
websocketUrl: "wss://ruko-server.onrender.com",
networkEnabled: true,
```

O servidor Node.js precisa estar ativo e aceitar o protocolo JSON de `join`, `input`, `welcome` e `snapshot`. Como o frontend está em HTTPS, a conexão usa `wss://`.

### Protocolo inicial proposto
Cliente → servidor:
- `join`: modo e apelido temporário
- `input`: sequência, direção, yaw/pitch, disparo e pulo

Servidor → cliente:
- `welcome`: ID e dados iniciais
- `snapshot`: tick e estado autoritativo de jogadores, zumbis e projéteis
- `event`: eventos como dano, eliminação e fim de onda

O servidor deverá validar movimento, colisões, cadência de tiro e dano. Nunca confie no cliente para decidir se um inimigo foi atingido ou eliminado.

## Próximas etapas
1. Melhorar movimentação/câmera e teste em celulares reais.
2. Testar sincronização de dois clientes em dispositivos diferentes.
3. Tornar o servidor autoritativo para movimento e tiros.
4. Adicionar zumbis e ondas cooperativas.
5. Adicionar salas e, depois, Battle Royale.


## Correções da revisão v0.3
- Ponto inicial movido para uma área livre da arena.
- Pulo corrigido para usar uma altura vertical persistente do jogador.
- Limites de movimento ajustados para aproveitar melhor a arena sem atravessar as paredes.
- Clique no jogo volta a solicitar o bloqueio do mouse após sair com Esc.
- Estado do pulo agora acompanha a subida e é limpo ao aterrissar.
- Removida chamada duplicada de atualização da mira no controle por toque.


### Atualizações v0.3
- Arena ampliada para 80 × 80 unidades.
- Árvores dentro do perímetro das paredes, com margem livre entre as copas e o muro.
- Colisão simples nos troncos.
- Pedras distribuídas com verificações de distância de caixas, pontos de surgimento dos alvos e outras pedras.

### Atualizações v0.4 — ruKo online
- Nome visual alterado para ruKo.
- Frontend configurado para `wss://ruko-server.onrender.com`.
- Entrada envia apelido temporário e usa o ponto de surgimento do servidor.
- Snapshots desenham outros jogadores com avatares e nomes interpolados.
- HUD mostra estado da conexão e quantidade de jogadores.
- Tiros, alvos e pontuação continuam locais nesta etapa.

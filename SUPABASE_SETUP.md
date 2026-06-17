# LIVORA — Supabase Ready

Esta versão mantém o visual premium da LIVORA e acrescenta uma camada preparada para Supabase.

## Ficheiros novos

- `supabase_schema.sql` — cria tabelas, RLS, triggers, gifts e função de envio de gift.
- `livora_config.js` — onde colocas a URL e a anon key do Supabase.
- `livora_supabase.js` — camada de dados com Supabase + fallback localStorage.
- `livora_page_bindings.js` — liga páginas existentes ao Supabase.
- `diagnostico_supabase.html` — página simples para testar a ligação.

## Passo 1 — Criar projeto Supabase

1. Vai a Supabase.
2. Cria um novo projeto.
3. Abre `SQL Editor`.
4. Cola o conteúdo de `supabase_schema.sql`.
5. Clica em `Run`.

## Passo 2 — Configurar a LIVORA

Abre `livora_config.js` e troca:

```js
SUPABASE_URL: "COLOCA_AQUI_A_TUA_SUPABASE_URL",
SUPABASE_ANON_KEY: "COLOCA_AQUI_A_TUA_SUPABASE_ANON_KEY",
DEMO_MODE: true
```

por:

```js
SUPABASE_URL: "https://o-teu-projeto.supabase.co",
SUPABASE_ANON_KEY: "a-tua-anon-public-key",
DEMO_MODE: false
```

## Passo 3 — Auth

No Supabase:

1. Vai a `Authentication > URL Configuration`.
2. Em `Site URL`, coloca o link do teu GitHub Pages.
3. Em `Redirect URLs`, adiciona também o link do teu site.
4. Para testar rápido, podes desligar temporariamente `Confirm email` em `Authentication > Providers > Email`.

## Passo 4 — Testar

Abre:

```txt
diagnostico_supabase.html
```

Depois testa:

- `entrada_livora.html` para criar conta e entrar.
- `go_live.html` para criar live.
- `live_room.html` para abrir sala.
- `perfil.html` para preparar gestão de perfil.

## Estado desta versão

Funcional como MVP preparado:

- Registo e login com Supabase Auth.
- Criação automática de perfil.
- Criação de live na tabela `lives`.
- Sistema de gifts preparado.
- Comentários preparados.
- Denúncias preparadas.
- Fallback localStorage caso `DEMO_MODE` esteja ativo.

## Próximo passo depois desta versão

Ligar em tempo real:

- chat live com Supabase Realtime;
- contador de espectadores;
- gifts a aparecerem em tempo real;
- ranking global;
- battle 1 vs 1 real.

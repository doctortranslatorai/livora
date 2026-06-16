# LIVORA

Protótipo premium de live stream, vídeo chat, matches e presentes digitais.

## Ficheiros
- `index.html` — plataforma principal com ligação Supabase.
- `entrada_livora.html` — login/criação de conta com Supabase Auth.
- `supabase_livora.sql` — tabelas, RLS e políticas de segurança.

## Passos
1. Supabase → SQL Editor → New query.
2. Cola o conteúdo de `supabase_livora.sql`.
3. Clica em Run.
4. GitHub → repositório `livora` → Add file → Upload files.
5. Envia `index.html`, `entrada_livora.html` e `README.md`.
6. GitHub → Settings → Pages → Deploy from branch → main → /root → Save.

## Supabase
Project URL: `https://cgitrfqsnipqlecejwtd.supabase.co`

A anon public key está integrada no frontend. Nunca publiques service_role nem senha do banco.

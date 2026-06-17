// LIVORA — Configuração Supabase
// 1) Cria um projeto em https://supabase.com
// 2) Cola o conteúdo de supabase_schema.sql no SQL Editor
// 3) Substitui os valores abaixo pela tua Project URL e anon public key

window.LIVORA_CONFIG = {
  SUPABASE_URL: "COLOCA_AQUI_A_TUA_SUPABASE_URL",
  SUPABASE_ANON_KEY: "COLOCA_AQUI_A_TUA_SUPABASE_ANON_KEY",

  // true = mantém tudo a funcionar em demonstração/localStorage.
  // false = tenta usar Supabase real.
  DEMO_MODE: true,

  APP_NAME: "LIVORA",
  DEFAULT_COINS: 12450,
  DEFAULT_LEVEL: 592
};

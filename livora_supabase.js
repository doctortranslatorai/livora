// LIVORA — camada de dados Supabase + fallback localStorage
(function(){
  const cfg = window.LIVORA_CONFIG || {};

  function isConfigured(){
    return !!(
      !cfg.DEMO_MODE &&
      cfg.SUPABASE_URL &&
      cfg.SUPABASE_ANON_KEY &&
      !String(cfg.SUPABASE_URL).includes('COLOCA_AQUI') &&
      !String(cfg.SUPABASE_ANON_KEY).includes('COLOCA_AQUI') &&
      window.supabase
    );
  }

  const client = isConfigured()
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
    : null;

  function normalizeUsername(username){
    const clean = String(username || '').trim().toLowerCase().replace(/^@+/, '');
    return clean ? '@' + clean.replace(/[^a-z0-9._-]/g, '') : '@creator';
  }

  function localUser(){
    try {
      return JSON.parse(localStorage.getItem('livora_user')) || null;
    } catch(e) {
      return null;
    }
  }

  function saveLocalUser(user){
    const finalUser = {
      name: user.name || user.display_name || 'Pedro Creator',
      username: normalizeUsername(user.username || '@pedrocreator'),
      email: user.email || 'demo@livora.app',
      role: user.role || 'creator',
      plan: user.plan || 'demo',
      coins: Number(user.coins ?? cfg.DEFAULT_COINS ?? 12450),
      level: Number(user.level ?? cfg.DEFAULT_LEVEL ?? 592),
      createdAt: user.createdAt || new Date().toISOString()
    };
    localStorage.setItem('livora_user', JSON.stringify(finalUser));
    return finalUser;
  }

  async function getSession(){
    if (!client) return { user: localUser(), source: 'local' };
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return { user: data.session?.user || null, session: data.session || null, source: 'supabase' };
  }

  async function getProfile(){
    if (!client) {
      return localUser() || saveLocalUser({});
    }

    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    const authUser = sessionData.session?.user;
    if (!authUser) return null;

    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async function signUp({name, username, email, password, role}){
    username = normalizeUsername(username);

    if (!client) {
      return { source: 'local', user: saveLocalUser({ name, username, email, role }) };
    }

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name,
          username,
          role
        }
      }
    });
    if (error) throw error;

    // Se o Supabase devolver sessão ativa, reforçamos o perfil.
    // Se email confirmation estiver ativo, o trigger SQL cria o perfil automaticamente.
    if (data.user && data.session) {
      await client.from('profiles').upsert({
        id: data.user.id,
        email,
        display_name: name,
        username,
        role,
        plan: 'free',
        coins: Number(cfg.DEFAULT_COINS ?? 12450),
        level: Number(cfg.DEFAULT_LEVEL ?? 592)
      }, { onConflict: 'id' });
    }

    saveLocalUser({ name, username, email, role, plan: 'free' });
    return { source: 'supabase', user: data.user, needsConfirmation: !data.session };
  }

  async function signIn({identifier, password}){
    const id = String(identifier || '').trim();

    if (!client) {
      const saved = localUser();
      if (!saved) throw new Error('Ainda não existe conta guardada neste navegador.');
      const wanted = id.toLowerCase().replace(/^@+/, '');
      const ok = id === saved.email || wanted === String(saved.username || '').replace(/^@+/, '').toLowerCase();
      if (!ok) throw new Error('Conta não encontrada neste protótipo local.');
      return { source: 'local', user: saved };
    }

    let email = id;
    if (!id.includes('@') || id.startsWith('@')) {
      const username = normalizeUsername(id);
      const { data, error } = await client
        .from('profiles')
        .select('email')
        .eq('username', username)
        .maybeSingle();
      if (error) throw error;
      if (!data?.email) throw new Error('Username não encontrado. Experimenta entrar com email.');
      email = data.email;
    }

    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const profile = await getProfile();
    if (profile) {
      saveLocalUser({
        name: profile.display_name,
        username: profile.username,
        email: profile.email,
        role: profile.role,
        plan: profile.plan,
        coins: profile.coins,
        level: profile.level
      });
    }

    return { source: 'supabase', user: data.user, profile };
  }

  async function signOut(){
    if (client) await client.auth.signOut();
    localStorage.removeItem('livora_user');
  }

  async function createLive(payload){
    const live = {
      title: payload.title || 'Live LIVORA',
      category: payload.category || 'Conversa',
      goal_coins: Number(payload.goal || 0),
      description: payload.desc || '',
      status: 'live',
      started_at: new Date().toISOString()
    };

    if (!client) {
      const localLive = { ...payload, id: 'demo-live-' + Date.now(), startedAt: live.started_at };
      localStorage.setItem('livora_live', JSON.stringify(localLive));
      return { source: 'local', live: localLive };
    }

    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    const user = sessionData.session?.user;
    if (!user) throw new Error('Precisas de entrar na tua conta antes de criar uma live.');

    const { data, error } = await client
      .from('lives')
      .insert({ ...live, creator_id: user.id })
      .select('*')
      .single();
    if (error) throw error;

    localStorage.setItem('livora_live_id', data.id);
    localStorage.setItem('livora_live', JSON.stringify({
      id: data.id,
      title: data.title,
      category: data.category,
      goal: data.goal_coins,
      desc: data.description,
      startedAt: data.started_at
    }));

    return { source: 'supabase', live: data };
  }

  async function listLives(limit = 12){
    if (!client) return [];
    const { data, error } = await client
      .from('lives')
      .select('*, profiles:creator_id(display_name, username, avatar_url, is_verified)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  async function sendComment({body, live_id, battle_id}){
    const text = String(body || '').trim();
    if (!text) return null;

    if (!client) {
      const all = JSON.parse(localStorage.getItem('livora_comments') || '[]');
      const item = { id: 'local-' + Date.now(), body: text, live_id, battle_id, created_at: new Date().toISOString() };
      all.push(item);
      localStorage.setItem('livora_comments', JSON.stringify(all));
      return item;
    }

    const { data: sessionData } = await client.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) throw new Error('Precisas de entrar para comentar.');

    const { data, error } = await client
      .from('comments')
      .insert({ body: text, live_id: live_id || null, battle_id: battle_id || null, user_id: user.id })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async function sendGift({gift_name, emoji, coin_cost, live_id, battle_id, to_user_id}){
    if (!client) return { source: 'local', gift_name, emoji, coin_cost };

    const { data: sessionData } = await client.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) throw new Error('Precisas de entrar para enviar gifts.');

    const { data, error } = await client.rpc('send_livora_gift', {
      p_from_user: user.id,
      p_to_user: to_user_id || null,
      p_live_id: live_id || null,
      p_battle_id: battle_id || null,
      p_gift_name: gift_name || 'Gift',
      p_emoji: emoji || '🎁',
      p_coin_cost: Number(coin_cost || 0)
    });
    if (error) throw error;
    return data;
  }

  async function reportContent({type, origin, description, priority}){
    if (!client) return { source: 'local' };
    const { data: sessionData } = await client.auth.getSession();
    const user = sessionData.session?.user;
    const { data, error } = await client
      .from('reports')
      .insert({
        reporter_id: user?.id || null,
        type: type || 'Conteúdo',
        origin: origin || window.location.pathname,
        description: description || '',
        priority: priority || 'medium',
        status: 'pending'
      })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  window.Livora = {
    client,
    isConfigured,
    localUser,
    saveLocalUser,
    getSession,
    getProfile,
    signUp,
    signIn,
    signOut,
    createLive,
    listLives,
    sendComment,
    sendGift,
    reportContent
  };
})();

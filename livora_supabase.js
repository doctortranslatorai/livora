// LIVORA — Supabase Data Layer
(function () {
  const cfg = window.LIVORA_CONFIG || {};
  const hasSupabaseLib = typeof window.supabase !== 'undefined';
  const isConfigured = () => Boolean(
    !cfg.DEMO_MODE &&
    cfg.SUPABASE_URL &&
    cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_URL.includes('o-teu-projeto') &&
    hasSupabaseLib
  );

  const client = isConfigured()
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
    : null;

  function normalizeUsername(username) {
    const value = String(username || '').trim();
    if (!value) return '';
    return value.startsWith('@') ? value.toLowerCase() : '@' + value.toLowerCase();
  }

  async function signUp({ name, username, email, password, role }) {
    if (!isConfigured()) throw new Error('Supabase ainda não está configurado.');

    const displayName = String(name || 'Creator').trim();
    const cleanUsername = normalizeUsername(username || displayName.replace(/\s+/g, ''));

    const { data, error } = await client.auth.signUp({
      email: String(email || '').trim(),
      password,
      options: {
        data: {
          display_name: displayName,
          username: cleanUsername,
          role: role || 'viewer'
        }
      }
    });

    if (error) throw error;

    const localUser = {
      id: data.user?.id || null,
      name: displayName,
      username: cleanUsername,
      email: String(email || '').trim(),
      role: role || 'viewer',
      plan: 'free',
      coins: 12450,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem('livora_user', JSON.stringify(localUser));
    return data;
  }

  async function resolveEmail(loginId) {
    const raw = String(loginId || '').trim();
    if (raw.includes('@') && !raw.startsWith('@')) return raw;

    const username = normalizeUsername(raw);
    const { data, error } = await client
      .from('profiles')
      .select('email')
      .eq('username', username)
      .maybeSingle();

    if (error) throw error;
    if (!data?.email) throw new Error('Username não encontrado. Entra com o email ou cria conta.');
    return data.email;
  }

  async function signIn({ loginId, password }) {
    if (!isConfigured()) throw new Error('Supabase ainda não está configurado.');

    const email = await resolveEmail(loginId);
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const profile = await getProfile(data.user.id);
    localStorage.setItem('livora_user', JSON.stringify({
      id: data.user.id,
      name: profile?.display_name || data.user.email,
      username: profile?.username || '',
      email: data.user.email,
      role: profile?.role || 'viewer',
      plan: profile?.plan || 'free',
      coins: profile?.coins ?? 0,
      createdAt: profile?.created_at || new Date().toISOString()
    }));

    return { data, profile };
  }

  async function signOut() {
    if (client) await client.auth.signOut();
    localStorage.removeItem('livora_user');
  }

  async function getSession() {
    if (!isConfigured()) return null;
    const { data } = await client.auth.getSession();
    return data.session;
  }

  async function getProfile(userId) {
    if (!isConfigured() || !userId) return null;
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function getCurrentProfile() {
    const session = await getSession();
    if (!session?.user?.id) return null;
    return getProfile(session.user.id);
  }

  async function loadGifts() {
    if (!isConfigured()) return [];
    const { data, error } = await client
      .from('gifts')
      .select('*')
      .eq('is_active', true)
      .order('coin_cost', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function createLive({ title, category, description, goal_coins }) {
    if (!isConfigured()) throw new Error('Supabase ainda não está configurado.');
    const session = await getSession();
    if (!session?.user?.id) throw new Error('Tens de entrar primeiro.');

    const { data, error } = await client
      .from('lives')
      .insert({
        creator_id: session.user.id,
        title,
        category: category || 'Conversa',
        description: description || '',
        status: 'scheduled',
        goal_coins: Number(goal_coins || 0)
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async function listLives(limit = 12) {
    if (!isConfigured()) return [];
    const { data, error } = await client
      .from('lives')
      .select('*, profiles(username, display_name, avatar_url, is_verified)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  async function sendGift({ to_user, live_id, battle_id, gift_name, emoji, coin_cost }) {
    if (!isConfigured()) throw new Error('Supabase ainda não está configurado.');
    const session = await getSession();
    if (!session?.user?.id) throw new Error('Tens de entrar primeiro.');

    const { data, error } = await client.rpc('send_livora_gift', {
      p_from_user: session.user.id,
      p_to_user: to_user || null,
      p_live_id: live_id || null,
      p_battle_id: battle_id || null,
      p_gift_name: gift_name,
      p_emoji: emoji || '🎁',
      p_coin_cost: Number(coin_cost || 0)
    });

    if (error) throw error;
    return data;
  }

  window.Livora = {
    config: cfg,
    client,
    isConfigured,
    normalizeUsername,
    signUp,
    signIn,
    signOut,
    getSession,
    getProfile,
    getCurrentProfile,
    loadGifts,
    createLive,
    listLives,
    sendGift
  };
})();

// LIVORA — ligações das páginas ao Supabase quando configurado
(function(){
  function toast(message){
    if (typeof window.showToast === 'function') window.showToast(message);
    else console.log('[LIVORA]', message);
  }

  function roleValue(){
    try {
      if (typeof selectedRole !== 'undefined') return selectedRole;
    } catch(e) {}
    return 'creator';
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (window.lucide) window.lucide.createIcons();

    const badge = document.createElement('div');
    badge.className = 'fixed left-4 bottom-20 z-50 hidden md:block rounded-full border px-3 py-2 text-[10px] font-black backdrop-blur-xl ' +
      (window.Livora?.isConfigured() ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : 'border-yellow-400/30 bg-yellow-500/10 text-yellow-200');
    badge.textContent = window.Livora?.isConfigured() ? 'SUPABASE ON' : 'DEMO LOCAL';
    document.body.appendChild(badge);

    try {
      const profile = await window.Livora?.getProfile?.();
      if (profile) {
        document.querySelectorAll('[data-livora-name]').forEach(el => el.textContent = profile.display_name || profile.name || 'Creator');
        document.querySelectorAll('[data-livora-username]').forEach(el => el.textContent = profile.username || '@creator');
        document.querySelectorAll('[data-livora-coins]').forEach(el => el.textContent = Number(profile.coins || 0).toLocaleString('pt-PT'));
      }
    } catch(e) {}
  });

  // Entrada / registo
  window.submitSignup = async function(event){
    event.preventDefault();
    const button = event.target.querySelector('button[type="submit"]');
    const oldText = button ? button.textContent : '';
    if (button) button.textContent = 'A criar conta...';

    try {
      const result = await window.Livora.signUp({
        name: document.getElementById('signup-name').value.trim(),
        username: document.getElementById('signup-username').value.trim(),
        email: document.getElementById('signup-email').value.trim(),
        password: document.getElementById('signup-password').value,
        role: roleValue()
      });

      if (result.needsConfirmation) {
        toast('Conta criada. Confirma o email no Supabase/Auth antes de entrar.');
      } else if (result.source === 'supabase') {
        toast('Conta criada no Supabase. A entrar na LIVORA...');
        setTimeout(() => { window.location.href = 'index.html'; }, 900);
      } else {
        toast('Conta criada em modo demo local. A entrar...');
        setTimeout(() => { window.location.href = 'index.html'; }, 900);
      }
    } catch(error) {
      toast(error.message || 'Não foi possível criar conta.');
    } finally {
      if (button) button.textContent = oldText;
    }
  };

  window.submitLogin = async function(event){
    event.preventDefault();
    const button = event.target.querySelector('button[type="submit"]');
    const oldText = button ? button.textContent : '';
    if (button) button.textContent = 'A entrar...';

    try {
      await window.Livora.signIn({
        identifier: document.getElementById('login-id').value.trim(),
        password: document.getElementById('login-password').value
      });
      toast('Entrada autorizada. A abrir portal...');
      setTimeout(() => { window.location.href = 'index.html'; }, 800);
    } catch(error) {
      toast(error.message || 'Não foi possível entrar.');
    } finally {
      if (button) button.textContent = oldText;
    }
  };

  window.demoAccess = function(){
    window.Livora.saveLocalUser({
      name: 'Pedro Creator',
      username: '@pedrocreator',
      email: 'demo@livora.app',
      role: 'creator',
      plan: 'demo',
      coins: 12450,
      level: 592
    });
    toast('Modo demonstração ativado. A entrar na plataforma...');
    setTimeout(() => { window.location.href = 'index.html'; }, 800);
  };

  // Criar live
  window.startLive = async function(event){
    event.preventDefault();
    const button = event.target.querySelector('button[type="submit"], button:not([type])');
    const oldText = button ? button.textContent : '';
    if (button) button.textContent = 'A abrir live...';

    try {
      await window.Livora.createLive({
        title: document.getElementById('liveTitle')?.value,
        category: document.getElementById('liveCategory')?.value,
        goal: document.getElementById('liveGoal')?.value,
        desc: document.getElementById('liveDesc')?.value
      });
      toast(window.Livora.isConfigured() ? 'Live criada no Supabase. A abrir sala...' : 'Live demo criada. A abrir sala...');
      setTimeout(() => { window.location.href = 'live_room.html'; }, 900);
    } catch(error) {
      toast(error.message || 'Não foi possível iniciar a live.');
    } finally {
      if (button) button.textContent = oldText;
    }
  };

  // Perfil simples
  window.saveLivoraProfile = async function(){
    toast('Perfil preparado para guardar no Supabase. Liga a URL e anon key em livora_config.js.');
  };
})();

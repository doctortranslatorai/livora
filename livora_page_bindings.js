// LIVORA — Page Bindings
(function () {
  function toast(message) {
    if (typeof window.showToast === 'function') window.showToast(message);
    else alert(message);
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(() => {
    // Override do registo/login da entrada, mantendo o visual original.
    if (document.getElementById('signup-panel')) {
      window.submitSignup = async function (event) {
        event.preventDefault();

        const payload = {
          name: document.getElementById('signup-name')?.value.trim(),
          username: document.getElementById('signup-username')?.value.trim(),
          email: document.getElementById('signup-email')?.value.trim(),
          password: document.getElementById('signup-password')?.value,
          role: window.selectedRole || 'creator'
        };

        if (!window.Livora?.isConfigured()) {
          toast('Supabase ainda não está ativo. Confirma o ficheiro livora_config.js.');
          return;
        }

        try {
          await window.Livora.signUp(payload);
          toast('Conta criada na LIVORA. Se o Supabase pedir confirmação, confirma o email antes de entrar.');
          setTimeout(() => { window.location.href = 'index.html'; }, 1200);
        } catch (err) {
          toast('Erro no registo: ' + (err.message || err));
        }
      };

      window.submitLogin = async function (event) {
        event.preventDefault();

        const payload = {
          loginId: document.getElementById('login-id')?.value.trim(),
          password: document.getElementById('login-password')?.value
        };

        if (!window.Livora?.isConfigured()) {
          toast('Supabase ainda não está ativo. Confirma o ficheiro livora_config.js.');
          return;
        }

        try {
          const result = await window.Livora.signIn(payload);
          toast('Entrada autorizada. Bem-vindo, ' + (result.profile?.display_name || 'Creator') + '!');
          setTimeout(() => { window.location.href = 'index.html'; }, 900);
        } catch (err) {
          toast('Erro no login: ' + (err.message || err));
        }
      };
    }
  });
})();

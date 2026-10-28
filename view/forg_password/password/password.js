(() => {
  const root = document.getElementById('password-recovery');
  if (!root) return;
  const accountType = root.dataset.accountType;
  const requestForm = document.getElementById('recovery-request-form');
  const resetForm = document.getElementById('recovery-reset-form');
  const status = document.getElementById('recovery-status');
  const title = document.getElementById('recovery-title');
  const intro = document.getElementById('recovery-intro');
  const newLink = document.getElementById('recovery-new-link');
  const token = new URLSearchParams(location.hash.slice(1)).get('token');
  let busy = false;
  // An email link can target this already-open page and change only its fragment.
  window.addEventListener('hashchange', () => location.reload());

  const showStatus = (message, state, focus = false) => {
    status.textContent = message;
    status.dataset.state = state;
    if (focus) status.focus();
  };
  const send = async data => {
    const response = await fetch('../../controller/users/password_recovery.php', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, account_type: accountType })
    });
    let result;
    try { result = await response.json(); } catch { throw new Error('The server could not complete your request. Please try again.'); }
    if (!response.ok || !result.success) {
      const error = new Error(result.error || 'Your request could not be completed. Please try again.');
      error.status = response.status;
      throw error;
    }
    return result;
  };
  const invalidLink = () => {
    resetForm.hidden = true;
    title.textContent = 'Let’s try a new link.';
    intro.textContent = 'Reset links expire after 30 minutes and can only be used once. If you requested more than one, open the latest email.';
    newLink.hidden = false;
  };

  for (const button of root.querySelectorAll('[data-toggle]')) {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.toggle);
      const visible = input.type === 'password';
      input.type = visible ? 'text' : 'password';
      button.textContent = visible ? 'Hide' : 'Show';
      button.setAttribute('aria-pressed', String(visible));
      button.setAttribute('aria-label', `${visible ? 'Hide' : 'Show'} ${input.name === 'password' ? 'new password' : 'password confirmation'}`);
    });
  }

  const submit = async (event, resetting) => {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    if (resetting) {
      if (data.password !== data.password_confirmation) {
        showStatus('The passwords do not match.', 'error', true);
        return;
      }
      if ([...data.password].length < 8 || new TextEncoder().encode(data.password).length > 72
          || !/[A-Z]/.test(data.password) || !/[a-z]/.test(data.password)
          || !/[0-9]/.test(data.password) || !/[^A-Za-z0-9]/.test(data.password)) {
        showStatus('Use at least 8 characters with uppercase, lowercase, a number and a symbol (maximum 72 bytes).', 'error', true);
        return;
      }
    }
    const button = form.querySelector('[type="submit"]');
    busy = true;
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    showStatus(resetting ? 'Saving your new password…' : 'Requesting your reset link…', 'loading');
    try {
      const result = await send({ ...data, action: resetting ? 'reset_password' : 'request_reset', ...(resetting ? { token } : {}) });
      showStatus(result.message, 'success', true);
      if (resetting) {
        resetForm.reset();
        resetForm.hidden = true;
        title.textContent = 'Password updated.';
        intro.textContent = 'You’re ready to sign in again.';
        document.getElementById('recovery-login-link').textContent = `Log in to your ${accountType} account →`;
        history.replaceState(null, '', location.pathname + location.search);
      } else {
        title.textContent = 'Check your inbox.';
        intro.textContent = 'The link is valid for 30 minutes. Keep this page open if you need to try another email.';
      }
    } catch (error) {
      if (error.status === 410) invalidLink();
      showStatus(error.message || 'Unable to connect. Please try again.', 'error', true);
    } finally {
      busy = false;
      button.disabled = false;
      form.removeAttribute('aria-busy');
    }
  };
  requestForm.addEventListener('submit', event => submit(event, false));
  resetForm.addEventListener('submit', event => submit(event, true));

  if (token !== null) {
    requestForm.hidden = true;
    document.getElementById('recovery-tabs').hidden = true;
    title.textContent = 'Choose a new password.';
    intro.textContent = `Create a new password for your ${accountType} account.`;
    showStatus('Checking your reset link…', 'loading');
    send({ action: 'validate_token', token }).then(() => {
      resetForm.hidden = false;
      showStatus('', 'success');
      document.getElementById('recovery-password').focus();
    }).catch(error => {
      if (error.status === 410) invalidLink();
      else {
        title.textContent = 'Unable to check your link.';
        intro.textContent = 'Refresh the page to try again, or request a new reset link.';
        newLink.hidden = false;
      }
      showStatus(error.message, 'error');
    });
  }
})();

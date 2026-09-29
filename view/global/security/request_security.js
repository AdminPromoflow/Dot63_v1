(() => {
  if (window.dot63SecureFetch) return;
  const originalFetch = window.fetch.bind(window);
  const root = new URL('../../../', document.currentScript.src);
  const tokenURL = new URL('controller/security/csrf.php', root);
  let tokenPromise;
  const token = () => tokenPromise ||= originalFetch(tokenURL, { credentials: 'same-origin', cache: 'no-store' })
    .then(async response => {
      if (!response.ok) throw new Error('Unable to verify your session. Refresh the page.');
      const data = await response.json();
      if (typeof data.token !== 'string' || !/^[a-f0-9]{64}$/.test(data.token)) throw new Error('Invalid session response.');
      return data.token;
    }).catch(error => { tokenPromise = null; throw error; });
  window.fetch = async (input, options = {}) => {
    const requestURL = new URL(input instanceof Request ? input.url : input, location.href);
    const method = String(options.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    if (requestURL.origin !== root.origin || !requestURL.pathname.startsWith(root.pathname + 'controller/')
        || ['GET', 'HEAD', 'OPTIONS'].includes(method)) return originalFetch(input, options);
    const headers = new Headers(options.headers || (input instanceof Request ? input.headers : undefined));
    headers.set('X-Dot63-CSRF-Token', await token());
    const response = await originalFetch(input, { ...options, headers });
    if (response.status === 419) tokenPromise = null;
    return response;
  };
  window.dot63SecureFetch = true;
})();

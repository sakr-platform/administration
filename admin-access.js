(() => {
  'use strict';

  const ACCESS_KEY = 'admin-access-granted';
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME_MS = 30 * 1000;
  const ALLOWED_ID_HASHES = new Set([
    '7b7aef49c4d8e5b0cf7e67386454377a3e79f17ef2fb601250a5dbd2cf61dd74',
    '21f5ea1c933c9a28eb5838375b043663ed917c01a9b35ac689fc509a980fcc0b'
  ]);

  const adminContent = document.getElementById('adminContent');
  if (!adminContent) return;

  const style = document.createElement('style');
  style.textContent = `
    .admin-login-page {
      width: min(100%, 560px);
      margin: 40px auto;
      padding: 24px;
      box-sizing: border-box;
      color: #fff;
      text-align: center;
    }

    .admin-login-page h1 {
      margin: 0 0 10px;
      font-size: clamp(24px, 5vw, 38px);
    }

    .admin-login-page p {
      margin: 0 0 22px;
      color: rgba(255, 255, 255, 0.7);
    }

    .admin-login-page form {
      display: flex;
      gap: 10px;
      align-items: stretch;
      justify-content: center;
      flex-wrap: wrap;
    }

    .admin-login-page input {
      flex: 1 1 240px;
      min-height: 48px;
      padding: 0 14px;
      box-sizing: border-box;
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      font: inherit;
      text-align: center;
    }

    .admin-login-page button {
      min-width: 130px;
      min-height: 48px;
      padding: 0 18px;
      border: 0;
      border-radius: 10px;
      background: #ffd700;
      color: #090936;
      cursor: pointer;
      font: inherit;
      font-weight: 700;
    }

    .admin-login-page button:disabled {
      cursor: wait;
      opacity: 0.6;
    }

    .admin-login-error {
      min-height: 22px;
      margin-top: 12px;
      color: #ff9b9b;
      font-size: 14px;
    }
  `;
  document.head.appendChild(style);

  const loginPage = document.createElement('section');
  loginPage.className = 'admin-login-page';
  loginPage.innerHTML = `
  <center><img src="logo.png" width="120"></center>
    <h1>Admin Access</h1>
    <p>Enter your admin ID to continue.</p>
    <form autocomplete="off">
      <input type="password" name="admin-id" placeholder="Admin ID" autocomplete="off" autocapitalize="none" spellcheck="false" required>
      <button type="submit">Continue</button>
    </form>
    <div class="admin-login-error" role="alert" aria-live="polite"></div>
  `;
  adminContent.hidden = true;
  adminContent.parentNode.insertBefore(loginPage, adminContent);

  const form = loginPage.querySelector('form');
  const input = loginPage.querySelector('input');
  const button = loginPage.querySelector('button');
  const error = loginPage.querySelector('.admin-login-error');
  let attempts = 0;
  let lockedUntil = 0;

  async function hashId(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  function unlock() {
    input.value = '';
    loginPage.remove();
    adminContent.hidden = false;
    sessionStorage.setItem(ACCESS_KEY, '1');
  }

  if (sessionStorage.getItem(ACCESS_KEY) === '1') {
    unlock();
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (Date.now() < lockedUntil) return;

    const id = input.value.trim();
    input.value = '';
    if (!id) {
      error.textContent = 'Enter an admin ID.';
      return;
    }

    button.disabled = true;
    const isAllowed = ALLOWED_ID_HASHES.has(await hashId(id));
    button.disabled = false;

    if (isAllowed) {
      unlock();
      return;
    }

    attempts += 1;
    if (attempts >= MAX_ATTEMPTS) {
      lockedUntil = Date.now() + LOCK_TIME_MS;
      attempts = 0;
      error.textContent = 'Too many attempts. Try again in 30 seconds.';
      window.setTimeout(() => {
        error.textContent = '';
      }, LOCK_TIME_MS);
      return;
    }

    error.textContent = 'Invalid admin ID.';
  });
})();

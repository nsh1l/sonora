const t = window.SONORA_I18N.t;
const button = document.querySelector('#installApp');
const hint = document.querySelector('#installHint');
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
let prompt;
const showOfflineState = () => {
  if (standalone) return;
  hint.textContent = navigator.serviceWorker.controller
    ? t('pwa.ready')
    : t('pwa.saved');
};
if (standalone) {
  button.hidden = true;
  hint.hidden = true;
}
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  prompt = event;
  if (!standalone) button.hidden = false;
});
button.addEventListener('click', async () => {
  if (!prompt) return;
  try {
    await prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === 'accepted') hint.textContent = t('pwa.installing');
  } catch {
    hint.textContent = t('pwa.installError');
  } finally {
    prompt = null;
    button.hidden = true;
  }
});
window.addEventListener('appinstalled', () => { button.hidden = true; hint.hidden = true; });
if ('serviceWorker' in navigator && ['https:', 'http:'].includes(location.protocol)) {
  navigator.serviceWorker.register('/sw.js', {updateViaCache: 'none'}).then(async registration => {
    await navigator.serviceWorker.ready;
    showOfflineState();
    navigator.serviceWorker.addEventListener('controllerchange', showOfflineState, {once: true});
    const update = () => { if (registration.waiting) hint.textContent = t('pwa.update'); };
    update();
    registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', update));
  }).catch(() => {
    hint.hidden = false;
    hint.textContent = t('pwa.offlineError');
  });
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

  const script = `
(function() {
  var currentScript = document.currentScript;
  if (!currentScript) {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      var s = scripts[i];
      var src = s.src || s.getAttribute('src') || '';
      if (src && (src.indexOf('/api/guard.js') !== -1 || src.indexOf('/api/guard') !== -1)) {
        currentScript = s;
        break;
      }
    }
  }

  var scriptSrc = currentScript ? (currentScript.src || currentScript.getAttribute('src') || '') : '';
  var scriptUrl = null;
  try {
    scriptUrl = new URL(scriptSrc, window.location.href);
  } catch (e) {
    try {
      scriptUrl = new URL(scriptSrc);
    } catch(e2) {
      scriptUrl = new URL(window.location.href);
    }
  }

  var params = scriptUrl.searchParams;
  var clientId = params.get('id') || params.get('client') || '';
  var customDomain = params.get('domain') || '';
  var apiBase = scriptUrl.origin || window.location.origin;

  function renderSuspensionScreen(data) {
    if (document.getElementById('animasystem-guard-lock')) return;
    var overlay = document.createElement('div');
    overlay.id = 'animasystem-guard-lock';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = '#0a0a0c';
    overlay.style.color = '#ffffff';
    overlay.style.zIndex = '2147483647';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '24px';
    overlay.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    overlay.style.boxSizing = 'border-box';
    overlay.style.textAlign = 'center';

    var clientName = (data && data.clientName) ? data.clientName : 'Cliente';
    var supportPhone = (data && data.supportPhone) ? data.supportPhone : '5524981000306';
    var renewalLink = apiBase + '/checkout?renov=true&client=' + encodeURIComponent(data.id || clientId);

    overlay.innerHTML = '<div style="max-width: 480px; width: 100%; background: #18181b; border: 1px solid #27272a; border-radius: 24px; padding: 40px 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7);">' +
      '<div style="width: 64px; height: 64px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; color: #ef4444; font-size: 28px;">🔒</div>' +
      '<span style="background: rgba(239, 68, 68, 0.15); color: #f87171; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 12px; border-radius: 9999px; border: 1px solid rgba(239, 68, 68, 0.3);">Serviço Temporariamente Indisponível</span>' +
      '<h2 style="font-size: 24px; font-weight: 800; margin: 16px 0 8px; color: #ffffff; letter-spacing: -0.02em;">Acesso Suspenso</h2>' +
      '<p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">O acesso ao domínio <strong>' + (window.location.hostname) + '</strong> (' + clientName + ') foi temporariamente suspenso devido a pendências de renovação.</p>' +
      '<div style="display: flex; flex-direction: column; gap: 12px;">' +
        '<a href="' + renewalLink + '" target="_blank" style="display: flex; align-items: center; justify-content: center; background: #d4ff00; color: #000000; font-weight: 700; font-size: 14px; padding: 14px 20px; border-radius: 14px; text-decoration: none;">⚡ Regularizar e Reativar Agora</a>' +
        '<a href="https://wa.me/' + supportPhone + '?text=' + encodeURIComponent('Olá, preciso de suporte para o site ' + window.location.hostname) + '" target="_blank" style="display: flex; align-items: center; justify-content: center; background: #27272a; color: #ffffff; font-weight: 600; font-size: 13px; padding: 12px 20px; border-radius: 14px; text-decoration: none;">Falar com Suporte Técnico</a>' +
      '</div>' +
    '</div>';

    document.body.appendChild(overlay);
  }

  function renderRenewalBanner(data) {
    if (document.getElementById('animasystem-renewal-banner')) return;
    var banner = document.createElement('div');
    banner.id = 'animasystem-renewal-banner';
    banner.style.position = 'fixed';
    banner.style.top = '0';
    banner.style.left = '0';
    banner.style.width = '100%';
    banner.style.zIndex = '2147483646';
    banner.style.backgroundColor = data.isOverdue ? '#991b1b' : '#18181b';
    banner.style.color = '#ffffff';
    banner.style.padding = '12px 16px';
    banner.style.display = 'flex';
    banner.style.alignItems = 'center';
    banner.style.justifyContent = 'space-between';
    banner.style.flexWrap = 'wrap';
    banner.style.gap = '12px';
    banner.style.fontFamily = 'system-ui, sans-serif';
    banner.style.fontSize = '13px';

    var renewalLink = apiBase + '/checkout?renov=true&client=' + encodeURIComponent(data.id || clientId);
    var textMsg = data.isOverdue ? ('⚠️ Plano vencido há ' + data.overdueDays + ' dias. Evite suspensão!') : ('🔔 Aviso de Renovação - Vencimento em: ' + data.nextRenewalDateFormatted);

    banner.innerHTML = '<span><strong>AnimaSystem:</strong> ' + textMsg + '</span>' +
      '<a href="' + renewalLink + '" target="_blank" style="background: #d4ff00; color: #000000; font-weight: 700; padding: 6px 14px; border-radius: 8px; text-decoration: none;">Renovar Agora</a>';

    document.body.appendChild(banner);
    document.body.style.paddingTop = '48px';
  }

  function removeExistingElements() {
    var existingLock = document.getElementById('animasystem-guard-lock');
    if (existingLock) existingLock.remove();
    var existingBanner = document.getElementById('animasystem-renewal-banner');
    if (existingBanner) existingBanner.remove();
    document.body.style.paddingTop = '';
  }

  function checkStatus() {
    var checkUrl = apiBase + '/api/client-status?id=' + encodeURIComponent(clientId) + '&domain=' + encodeURIComponent(customDomain) + '&host=' + encodeURIComponent(window.location.hostname);
    fetch(checkUrl, { method: 'GET', mode: 'cors' })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data && (data.suspended === true || data.status === 'suspended' || data.status === 'ended')) {
          var banner = document.getElementById('animasystem-renewal-banner');
          if (banner) banner.remove();
          renderSuspensionScreen(data);
        } else if (data && data.showRenewalWarning === true) {
          var lock = document.getElementById('animasystem-guard-lock');
          if (lock) lock.remove();
          renderRenewalBanner(data);
        } else {
          removeExistingElements();
        }
      })
      .catch(function() {});
  }

  checkStatus();
  setInterval(checkStatus, 30000);
})();
  `;

  return res.send(script);
}

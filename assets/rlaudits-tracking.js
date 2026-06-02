(() => {
  const endpoint = 'https://api.rlaudits.com/api/track';
  const service = document.body?.dataset.trackService || document.title.replace(/\s*\|\s*RLAudits.*/i, '').trim();
  const page = `${window.location.pathname}${window.location.hash || ''}`;
  const startedForms = new WeakSet();

  function send(event, details = {}) {
    const payload = {
      event,
      page,
      service,
      referrer: document.referrer || '',
      ...details,
    };
    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(endpoint, blob)) return;
    }

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  }

  function labelFor(element) {
    return (element.dataset.trackCta || element.getAttribute('aria-label') || element.textContent || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120);
  }

  function isTrackedCta(element) {
    if (element.dataset.trackCta) return true;
    const className = String(element.className || '');
    return /(^|\s)(hero-cta|cta|pricing-cta|button|btn)(\s|$)/i.test(className);
  }

  function formLabel(form) {
    return form.dataset.trackForm || form.getAttribute('name') || form.getAttribute('id') || 'public form';
  }

  window.addEventListener('DOMContentLoaded', () => {
    send('page_visit');
    if (/thank-you|thanks/i.test(window.location.pathname)) {
      send('thank_you_hit');
    }

    document.addEventListener('click', event => {
      const target = event.target.closest('a, button');
      if (!target || !isTrackedCta(target)) return;
      send('cta_click', { target: labelFor(target) });
    });

    for (const form of document.querySelectorAll('form')) {
      const start = () => {
        if (startedForms.has(form)) return;
        startedForms.add(form);
        send('form_start', { form: formLabel(form) });
      };
      form.addEventListener('input', start, { once: true });
      form.addEventListener('change', start, { once: true });
      form.addEventListener('submit', () => {
        send('form_submit', { form: formLabel(form) });
      });
    }
  });
})();

/* ═══════════════════════════════════════════════════════════════
   RSVP API HANDLER
   ----------------------------------------------------------------
   Replace the body of `submitToAPI` with your chosen backend.
   All available options are documented below.
   ═══════════════════════════════════════════════════════════════ */

/**
 * @param {Object} payload  – Cleaned form data
 * @param {string} payload.nombre
 * @param {string} [payload.email]
 * @param {'si'|'no'} payload.asistencia
 * @param {string} [payload.personas]
 * @param {string} [payload.mensaje]
 * @returns {Promise<void>}  – Resolves on success, throws on error
 */
async function submitToAPI(payload) {

  /* ── Option A: Netlify Forms (default — zero config on Netlify) ─── 
  const formEl = document.getElementById('rsvp-form');
  const formData = new FormData(formEl);

  const response = await fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(formData).toString(),
  });

  if (!response.ok) throw new Error(`Netlify Forms error: ${response.status}`);
  */


  /* ── Option B: Custom REST endpoint ──────────────────────────────
  const response = await fetch('https://your-api.example.com/rsvp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': 'Bearer YOUR_TOKEN',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
  ─────────────────────────────────────────────────────────────── */


  /* ── Option C: Airtable REST API ─────────────────────────────────
  const response = await fetch(
    'https://api.airtable.com/v0/YOUR_BASE_ID/Invitados',
    {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_AIRTABLE_PAT',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          Nombre:     payload.nombre,
          Email:      payload.email || '',
          Asistencia: payload.asistencia === 'si' ? 'Sí' : 'No',
          Personas:   payload.personas || '1',
          Mensaje:    payload.mensaje || '',
        },
      }),
    }
  );
  if (!response.ok) throw new Error(`Airtable error: ${response.status}`);
  return response.json();
  ─────────────────────────────────────────────────────────────── */


  /* ── Option D: Google Sheets via SheetDB ─────────────────────────*/
  const dateOptions = {
    timeZone: 'America/Guatemala',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  };
  payload.fecha = new Date().toLocaleString('es-GT', dateOptions);
  const response = await fetch('https://sheetdb.io/api/v1/fu4wcac8x8ppr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: payload }),
  });
  if (!response.ok) throw new Error(`SheetDB error: ${response.status}`);
  return response.json();
}


/* ═══════════════════════════════════════════════════════════════
   FORM LOGIC
   ═══════════════════════════════════════════════════════════════ */

const form        = document.getElementById('rsvp-form');
const successCard = document.getElementById('success-card');
const submitBtn   = document.getElementById('submit-btn');
const btnText     = document.querySelector('.btn-text');
const btnLoading  = document.querySelector('.btn-loading');
const guestsGroup = document.getElementById('guests-group');

/* Hide/show guests field based on attendance */
form?.querySelectorAll('[name="asistencia"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const attending = radio.value === 'si';
    guestsGroup.style.display = attending ? 'block' : 'none';
  });
});

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const data = Object.fromEntries(new FormData(form).entries());

  if (!data.nombre?.trim()) {
    return fieldError('nombre', 'Por favor ingresa tu nombre completo.');
  }
  if (!data.asistencia) {
    return radioError('asistencia', 'Por favor confirma si podrás asistir.');
  }

  setLoading(true);

  try {
    await submitToAPI(data);
    form.classList.add('hidden');
    successCard.classList.remove('hidden');
    successCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (err) {
    console.error('RSVP submission error:', err);
    globalError('Hubo un error al enviar. Por favor intenta de nuevo.');
  } finally {
    setLoading(false);
  }
});

function setLoading(on) {
  submitBtn.disabled = on;
  btnText.classList.toggle('hidden', on);
  btnLoading.classList.toggle('hidden', !on);
}

function fieldError(id, msg) {
  const el = document.getElementById(id);
  const err = document.createElement('p');
  err.className = 'field-error';
  err.textContent = msg;
  el?.parentNode?.appendChild(err);
  el?.focus();
}

function radioError(name, msg) {
  const group = form.querySelector(`[name="${name}"]`)?.closest('.form-group');
  if (!group) return;
  const err = document.createElement('p');
  err.className = 'field-error';
  err.textContent = msg;
  group.appendChild(err);
}

function globalError(msg) {
  const err = document.createElement('p');
  err.className = 'field-error global-error';
  err.textContent = msg;
  submitBtn.parentNode.insertBefore(err, submitBtn);
}

function clearErrors() {
  form?.querySelectorAll('.field-error').forEach(el => el.remove());
}


/* ═══════════════════════════════════════════════════════════════
   SCROLL REVEAL
   ═══════════════════════════════════════════════════════════════ */

const observer = new IntersectionObserver(
  (entries) => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  }),
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));


/* ═══════════════════════════════════════════════════════════════
   PHOTO GALLERY  (scroll-snap, portrait cards)
   ═══════════════════════════════════════════════════════════════ */

(function () {
  const track    = document.getElementById('gallery-track');
  const wrap     = document.getElementById('gallery-wrap');
  const prevBtn  = document.getElementById('gal-prev');
  const nextBtn  = document.getElementById('gal-next');
  const dotsWrap = document.getElementById('gal-dots');

  if (!track || !dotsWrap) return;

  const slides = Array.from(track.querySelectorAll('.gallery-slide'));
  const total  = slides.length;
  let current  = 0;
  let timer    = null;

  // Build dots from slide count
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'gal-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Foto ${i + 1}`);
    dot.setAttribute('aria-selected', String(i === 0));
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  function updateDots(idx) {
    dotsWrap.querySelectorAll('.gal-dot').forEach((d, i) => {
      d.classList.toggle('active', i === idx);
      d.setAttribute('aria-selected', String(i === idx));
    });
  }

  // Scroll offset of a slide relative to the track's scroll origin
  function slideScrollLeft(index) {
    const base = slides[0]?.offsetLeft ?? 0;
    return (slides[index]?.offsetLeft ?? 0) - base;
  }

  function goTo(index) {
    const prev = current;
    current = ((index % total) + total) % total;
    // Instant jump when wrapping so the track doesn't scroll backwards visibly
    const wrapping = Math.abs(current - prev) > 1;
    track.scrollTo({ left: slideScrollLeft(current), behavior: wrapping ? 'auto' : 'smooth' });
    updateDots(current);
    resetTimer();
  }

  prevBtn?.addEventListener('click', () => goTo(current - 1));
  nextBtn?.addEventListener('click', () => goTo(current + 1));

  // Keep `current` in sync when the user native-scrolls or swipes
  let snapTimer;
  track.addEventListener('scroll', () => {
    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      const base = slides[0]?.offsetLeft ?? 0;
      let closest = 0, minDist = Infinity;
      slides.forEach((slide, i) => {
        const dist = Math.abs((slide.offsetLeft - base) - track.scrollLeft);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      if (closest !== current) { current = closest; updateDots(current); }
    }, 80);
  }, { passive: true });

  // Auto-advance every 4.5 s
  function startTimer() { timer = setInterval(() => goTo(current + 1), 4500); }
  function resetTimer()  { clearInterval(timer); startTimer(); }
  startTimer();

  // Pause on hover
  wrap?.addEventListener('mouseenter', () => clearInterval(timer));
  wrap?.addEventListener('mouseleave', startTimer);

  // Pause while the user is touching (native scroll handles the movement)
  track.addEventListener('touchstart', () => clearInterval(timer), { passive: true });
  track.addEventListener('touchend',   () => setTimeout(startTimer, 1200), { passive: true });

  // Keyboard (← →) when gallery is visible in the viewport
  document.addEventListener('keydown', e => {
    const r = wrap?.getBoundingClientRect();
    if (!r || r.top >= window.innerHeight || r.bottom <= 0) return;
    if (e.key === 'ArrowLeft')  goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });
})();

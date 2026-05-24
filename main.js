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

  /* ── Option A: Netlify Forms (default — zero config on Netlify) ─── */
  const formEl = document.getElementById('rsvp-form');
  const formData = new FormData(formEl);

  const response = await fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(formData).toString(),
  });

  if (!response.ok) throw new Error(`Netlify Forms error: ${response.status}`);


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


  /* ── Option D: Google Sheets via SheetDB ─────────────────────────
  const response = await fetch('https://sheetdb.io/api/v1/YOUR_SHEETDB_ID', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: payload }),
  });
  if (!response.ok) throw new Error(`SheetDB error: ${response.status}`);
  return response.json();
  ─────────────────────────────────────────────────────────────── */
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

import { supabase } from './supabase.js';

// ─────────────────────────────────────────────
// CONFIG — Replace with clinic owner's number
// Format: country code + number, no + or spaces
// ─────────────────────────────────────────────
const CLINIC_WHATSAPP = '8801700000000'; // ← UPDATE THIS

// All available time slots
const ALL_SLOTS = [
  '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM',
  '12:00 PM',
  '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM',
  '06:00 PM',
];

// ─── UTILITY: show/hide error ───────────────
function showErr(id, visible) {
  const el = document.getElementById(id);
  if (el) el.style.display = visible ? 'block' : 'none';
}
function markErr(el, hasError) {
  el.classList.toggle('error', hasError);
}

// ─── SET MINIMUM DATE (today) ───────────────
function setMinDate() {
  const dateInput = document.getElementById('fdate');
  if (!dateInput) return;
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateInput.min = `${yyyy}-${mm}-${dd}`;
}

// ─── LOAD BOOKED SLOTS FOR DATE ─────────────
async function loadBookedSlots(date) {
  if (!date) return [];
  const { data, error } = await supabase
    .from('appointments')
    .select('time')
    .eq('date', date)
    .neq('status', 'Cancelled');
  if (error) return [];
  return data.map(r => r.time);
}

// ─── POPULATE TIME SLOT DROPDOWN ────────────
async function populateSlots(date) {
  const timeSelect = document.getElementById('ftime');
  timeSelect.innerHTML = '<option value="">Checking availability…</option>';
  timeSelect.disabled = true;

  const bookedSlots = await loadBookedSlots(date);

  timeSelect.innerHTML = '<option value="">Pick a time…</option>';
  timeSelect.disabled = false;

  ALL_SLOTS.forEach(slot => {
    const opt = document.createElement('option');
    opt.value = slot;
    if (bookedSlots.includes(slot)) {
      opt.disabled = true;
      opt.textContent = `${slot} — Booked`;
      opt.className = 'slot-booked';
    } else {
      opt.textContent = slot;
    }
    timeSelect.appendChild(opt);
  });
}

// ─── DATE CHANGE → RELOAD SLOTS ─────────────
document.getElementById('fdate')?.addEventListener('change', (e) => {
  populateSlots(e.target.value);
});

// ─── SEND WHATSAPP NOTIFICATION TO ADMIN ────
function notifyAdmin({ name, phone, date, service, time }) {
  const msg = `🏥 *New Appointment Booked!*\n\n👤 *Name:* ${name}\n📞 *Phone:* ${phone}\n🗓️ *Date:* ${date}\n⏰ *Time:* ${time}\n🩺 *Service:* ${service}\n\n_Please confirm the appointment._`;
  const encoded = encodeURIComponent(msg);
  const url = `https://wa.me/${CLINIC_WHATSAPP}?text=${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

// ─── LOADING STATE HELPERS ───────────────────
function setLoading(loading) {
  const btn = document.getElementById('submitBtn');
  const label = document.getElementById('submitLabel');
  const loader = document.getElementById('submitLoader');
  btn.disabled = loading;
  label.style.display = loading ? 'none' : 'inline';
  loader.style.display = loading ? 'flex' : 'none';
}

// ─── RESET FORM (Book Another button) ────────
window.resetForm = function () {
  document.getElementById('apptForm').reset();
  document.getElementById('apptForm').style.display = '';
  document.getElementById('formSuccess').style.display = 'none';
  document.getElementById('ftime').innerHTML = '<option value="">Pick a time…</option>';
};

// ─── FORM SUBMIT ──────────────────────────────
document.getElementById('apptForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nameEl    = document.getElementById('fname');
  const phoneEl   = document.getElementById('fphone');
  const serviceEl = document.getElementById('fservice');
  const dateEl    = document.getElementById('fdate');
  const timeEl    = document.getElementById('ftime');

  let valid = true;

  // Validate Name
  if (!nameEl.value.trim()) {
    showErr('fnameErr', true); markErr(nameEl, true); valid = false;
  } else {
    showErr('fnameErr', false); markErr(nameEl, false);
  }

  // Validate Phone
  const ph = phoneEl.value.replace(/\D/g, '');
  if (ph.length < 10) {
    showErr('fphoneErr', true); markErr(phoneEl, true); valid = false;
  } else {
    showErr('fphoneErr', false); markErr(phoneEl, false);
  }

  // Validate Service
  if (!serviceEl.value) {
    showErr('fserviceErr', true); markErr(serviceEl, true); valid = false;
  } else {
    showErr('fserviceErr', false); markErr(serviceEl, false);
  }

  // Validate Date
  if (!dateEl.value) {
    showErr('fdateErr', true); markErr(dateEl, true); valid = false;
  } else {
    showErr('fdateErr', false); markErr(dateEl, false);
  }

  // Validate Time
  if (!timeEl.value) {
    showErr('ftimeErr', true); markErr(timeEl, true); valid = false;
  } else {
    showErr('ftimeErr', false); markErr(timeEl, false);
  }

  if (!valid) return;

  setLoading(true);

  // Double-check slot still available at submit time
  const bookedSlots = await loadBookedSlots(dateEl.value);
  if (bookedSlots.includes(timeEl.value)) {
    setLoading(false);
    showErr('ftimeErr', true);
    timeEl.classList.add('error');
    document.getElementById('ftimeErr').textContent = 'This slot was just booked. Please choose another time.';
    await populateSlots(dateEl.value); // refresh slots
    return;
  }

  const appointmentData = {
    name:    nameEl.value.trim(),
    phone:   phoneEl.value.trim(),
    service: serviceEl.value,
    date:    dateEl.value,
    time:    timeEl.value,
    status:  'Pending',
  };

  const { error } = await supabase.from('appointments').insert([appointmentData]);

  if (error) {
    setLoading(false);
    alert('⚠️ Something went wrong. Please try again or call us directly.');
    console.error('Supabase error:', error);
    return;
  }

  // Success
  setLoading(false);
  document.getElementById('apptForm').style.display = 'none';

  const successDiv = document.getElementById('formSuccess');
  successDiv.style.display = 'block';
  document.getElementById('successMsg').textContent =
    `Hi ${appointmentData.name}! Your ${appointmentData.service} appointment on ${appointmentData.date} at ${appointmentData.time} is confirmed. We'll reach you at ${appointmentData.phone}.`;

  // Notify clinic admin via WhatsApp
  notifyAdmin(appointmentData);
});

// ─── INIT ───────────────────────────────────
setMinDate();
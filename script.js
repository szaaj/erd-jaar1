/**
 * ERD-LES.JS — SOD Module 1
 * Interactieve functies voor de ERD-les
 */

/* ================================================================
   SCORE SYSTEEM
================================================================ */
let totalPoints = 0;
const maxPoints = 20;
const answeredMCQ = new Set();   // bijhouden welke MCQ's al beantwoord zijn
const answeredTyper = new Set(); // bijhouden welke typer-velden al goed zijn

function addPoint(n = 1) {
  totalPoints = Math.min(maxPoints, totalPoints + n);
  const pct = (totalPoints / maxPoints) * 100;
  document.getElementById('scoreFill').style.width = pct + '%';
  document.getElementById('scoreNum').textContent = totalPoints + ' / ' + maxPoints + ' ⭐';
}

/* ================================================================
   THEME SWITCHER
================================================================ */
function setTheme(t, btn) {
  document.body.dataset.theme = t;
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  try { localStorage.setItem('erd_theme', t); } catch (e) {}
}

/* ================================================================
   ACCORDION KAARTEN
================================================================ */
const cardState = [true, false, false, false, false, false];

function toggleCard(i) {
  const card = document.getElementById('card' + i);
  const isOpen = card.classList.contains('open');
  card.classList.toggle('open', !isOpen);
  cardState[i] = !isOpen;
  updateProgress();
}

function openNextCard(i) {
  const next = document.getElementById('card' + (i + 1));
  if (!next) return;
  next.classList.add('open');
  cardState[i + 1] = true;
  setTimeout(() => next.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
  updateProgress();
  addPoint(1);
}

function scrollToCard(i) {
  const el = document.getElementById('card' + i);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (!el.classList.contains('open')) {
    el.classList.add('open');
    cardState[i] = true;
    updateProgress();
  }
}

function updateProgress() {
  document.querySelectorAll('.prog-step').forEach((el, i) => {
    el.classList.toggle('done', cardState[i] && i > 0);
    el.classList.toggle('active', i === cardState.lastIndexOf(true));
  });
}

/* ================================================================
   FLIP CARDS
================================================================ */
function flip(el) {
  el.classList.toggle('flipped');
  // Punt alleen bij eerste keer omdraaien
  if (el.classList.contains('flipped') && !el.dataset.scored) {
    el.dataset.scored = '1';
    addPoint(0.5);
  }
}

/* ================================================================
   MCQ QUIZ
================================================================ */
function checkMCQ(el, correct, feedbackId) {
  // Voorkom dubbel antwoorden
  if (answeredMCQ.has(feedbackId)) return;
  answeredMCQ.add(feedbackId);

  // Disable alle opties in deze vraag
  el.closest('.mcq-options').querySelectorAll('.mcq-opt').forEach(opt => {
    opt.classList.add('answered');
  });

  const feedback = document.getElementById(feedbackId);

  if (correct) {
    el.classList.add('correct');
    feedback.textContent = '✅ Correct! Goed gedaan! 🎉';
    feedback.className = 'mcq-feedback show ok';
    addPoint(2);
  } else {
    el.classList.add('wrong');
    feedback.textContent = '❌ Helaas! Kijk goed naar de definitie en probeer het te begrijpen.';
    feedback.className = 'mcq-feedback show nok';
    // Toon het juiste antwoord
    el.closest('.mcq-options').querySelectorAll('.mcq-opt').forEach(opt => {
      if (opt.getAttribute('onclick') && opt.getAttribute('onclick').includes('true')) {
        opt.classList.add('correct');
      }
    });
  }

  feedback.style.display = 'block';
}

/* ================================================================
   STAP-VOOR-STAP REVEAL
================================================================ */
const stepStates = {};

function stepReveal(id, dir) {
  const container = document.getElementById(id);
  if (!container) return;

  const items = container.querySelectorAll('.step-reveal-item');
  const total = items.length;
  if (!stepStates[id]) stepStates[id] = 1;

  stepStates[id] = Math.max(1, Math.min(total, stepStates[id] + dir));
  const cur = stepStates[id];

  items.forEach((item, i) => {
    item.classList.toggle('visible', i < cur);
  });

  // Counter bijwerken
  const counter = document.getElementById(id + '-counter');
  if (counter) counter.textContent = cur + ' / ' + total;

  // Vorige knop tonen/verbergen
  const prevBtn = document.getElementById(id + '-prev');
  if (prevBtn) prevBtn.style.display = cur > 1 ? '' : 'none';

  // Volgende knop aanpassen bij laatste stap
  const nextBtn = document.getElementById(id + '-next');
  if (nextBtn) {
    if (cur >= total) {
      nextBtn.textContent = '✅ Klaar!';
      nextBtn.disabled = true;
      addPoint(1);
    } else {
      nextBtn.textContent = nextBtn.dataset.label || 'Volgende stap →';
      nextBtn.disabled = false;
    }
  }
}

/* ================================================================
   DRAG AND DROP
================================================================ */
let draggedEl = null;

function dragStart(e) {
  draggedEl = e.target;
  setTimeout(() => e.target.classList.add('dragging'), 0);
}

function allowDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}

function drop(e, zone, entityId, attribId, sourceId) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  if (!draggedEl) return;
  draggedEl.classList.remove('dragging');
  e.currentTarget.appendChild(draggedEl);
  draggedEl = null;
}

// Mobile/touch fallback: klikken verplaatst item
function tapItem(el, sourceId, entityId, attribId) {
  if (el.parentElement.id === sourceId) {
    const target = el.dataset.correct === 'entity' ? entityId : attribId;
    document.getElementById(target).appendChild(el);
  } else {
    document.getElementById(sourceId).appendChild(el);
  }
}

function checkDrag(gameId, entityId, attribId) {
  const entityItems = document.getElementById(entityId).querySelectorAll('.drag-item');
  const attribItems = document.getElementById(attribId).querySelectorAll('.drag-item');
  let correct = 0;
  let total = 0;

  entityItems.forEach(item => {
    total++;
    if (item.dataset.correct === 'entity') { item.classList.add('correct'); correct++; }
    else item.classList.add('wrong');
  });

  attribItems.forEach(item => {
    total++;
    if (item.dataset.correct === 'attrib') { item.classList.add('correct'); correct++; }
    else item.classList.add('wrong');
  });

  const fb = document.getElementById(gameId + '-feedback');
  if (correct === total && total > 0) {
    fb.textContent = '🎉 Alles correct! Goed gedaan!';
    fb.style.color = 'var(--accent3)';
    addPoint(3);
  } else {
    fb.textContent = correct + ' van ' + total + ' goed. De rode items staan op de verkeerde plek.';
    fb.style.color = '#f87171';
  }
}

function resetDrag(gameId, entityId, attribId, sourceId) {
  const source = document.getElementById(sourceId);
  [entityId, attribId].forEach(zoneId => {
    document.getElementById(zoneId).querySelectorAll('.drag-item').forEach(item => {
      item.classList.remove('correct', 'wrong');
      source.appendChild(item);
    });
  });
  document.getElementById(gameId + '-feedback').textContent = '';
}

// Dragleave listener voor alle drop zones
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.drop-zone').forEach(z => {
    z.addEventListener('dragleave', () => z.classList.remove('drag-over'));
  });
});

/* ================================================================
   TYPER OEFENING
================================================================ */
function checkTyper(inputId, answer, hintId) {
  const el = document.getElementById(inputId);
  const hint = document.getElementById(hintId);
  const val = el.value.trim().toLowerCase();

  if (!val) {
    el.className = 'typer-input';
    hint.textContent = '';
    hint.className = 'typer-hint';
    return;
  }

  if (val === answer.toLowerCase()) {
    el.classList.remove('bad');
    el.classList.add('good');
    hint.textContent = '✅ Correct!';
    hint.className = 'typer-hint ok';
    // Punt maar één keer per veld
    if (!answeredTyper.has(inputId)) {
      answeredTyper.add(inputId);
      addPoint(0.5);
    }
  } else {
    el.classList.remove('good');
    el.classList.add('bad');
    hint.textContent = '❌ Probeer nog eens';
    hint.className = 'typer-hint nok';
  }
}

/* ================================================================
   LEERUITKOMSTEN CHECKLIST
================================================================ */
function toggleCheck(el) {
  const wasDone = el.classList.contains('done');
  el.classList.toggle('done');
  if (!wasDone) addPoint(0.5);
}

/* ================================================================
   INITIALISATIE
================================================================ */
window.addEventListener('DOMContentLoaded', () => {
  // Laad opgeslagen thema
  try {
    const t = localStorage.getItem('erd_theme');
    if (t) {
      document.body.dataset.theme = t;
      document.querySelectorAll('.theme-btn').forEach(btn => {
        const label = btn.textContent.toLowerCase();
        btn.classList.toggle('active', label.includes(t));
      });
    }
  } catch (e) {}

  // Zet data-labels op 'volgende'-knoppen voor reset
  document.querySelectorAll('[id$="-next"]').forEach(btn => {
    btn.dataset.label = btn.textContent;
  });
});

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
const cardState = [true, false, false, false, false, false, false];

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
function tapItem(el, sourceId, zone1Id, zone2Id) {
  if (el.parentElement.id === sourceId) {
    // Bepaal de juiste zone op basis van data-accepts
    const zone1 = document.getElementById(zone1Id);
    const zone2 = document.getElementById(zone2Id);
    const zone1Accepts = zone1.dataset.accepts || 'entity';
    const target = el.dataset.correct === zone1Accepts ? zone1Id : zone2Id;
    document.getElementById(target).appendChild(el);
  } else {
    document.getElementById(sourceId).appendChild(el);
  }
}

function checkDrag(gameId, zone1Id, zone2Id) {
  const zone1 = document.getElementById(zone1Id);
  const zone2 = document.getElementById(zone2Id);

  // Haal op welke waarde elke zone accepteert via data-accepts,
  // val terug op de klassieke 'entity'/'attrib' als fallback
  const zone1Accepts = zone1.dataset.accepts || 'entity';
  const zone2Accepts = zone2.dataset.accepts || 'attrib';

  let correct = 0;
  let total = 0;

  zone1.querySelectorAll('.drag-item').forEach(item => {
    total++;
    if (item.dataset.correct === zone1Accepts) { item.classList.add('correct'); correct++; }
    else item.classList.add('wrong');
  });

  zone2.querySelectorAll('.drag-item').forEach(item => {
    total++;
    if (item.dataset.correct === zone2Accepts) { item.classList.add('correct'); correct++; }
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
   ERD PUZZEL — school-database (student → klas ← leraar)
================================================================ */
const PUZZLE_PIECES = [
  // Attributen student
  { id:'attr-student-id',        label:'🔑 id',        type:'attr', hint:'Primaire sleutel van student' },
  { id:'attr-student-firstname', label:'◆ firstname',  type:'attr', hint:'Voornaam — verplicht attribuut' },
  { id:'attr-student-lastname',  label:'◆ lastname',   type:'attr', hint:'Achternaam — verplicht attribuut' },
  { id:'attr-student-birthday',  label:'◇ birthday',   type:'attr', hint:'Optioneel attribuut van student' },
  { id:'attr-student-phonenr',   label:'◇ phonenr',    type:'attr', hint:'Optioneel attribuut van student' },
  // Attributen klas
  { id:'attr-klas-id',           label:'🔑 id',        type:'attr', hint:'Primaire sleutel van klas' },
  { id:'attr-klas-name',         label:'◆ name',       type:'attr', hint:'Naam van de klas — verplicht' },
  { id:'attr-klas-year',         label:'◆ year',       type:'attr', hint:'Leerjaar — verplicht attribuut' },
  // Attributen leraar
  { id:'attr-leraar-id',         label:'🔑 id',        type:'attr', hint:'Primaire sleutel van leraar' },
  { id:'attr-leraar-firstname',  label:'◆ firstname',  type:'attr', hint:'Voornaam — verplicht attribuut' },
  { id:'attr-leraar-lastname',   label:'◆ lastname',   type:'attr', hint:'Achternaam — verplicht attribuut' },
  // Relatie multipliciteiten
  { id:'rel-student-side',       label:'1..*',  type:'rel', hint:'Een klas heeft meerdere studenten' },
  { id:'rel-klas-left-side',     label:'1',     type:'rel', hint:'Een student zit in precies 1 klas' },
  { id:'rel-klas-right-side',    label:'1',     type:'rel', hint:'Een leraar geeft les aan 1 klas (of meer)' },
  { id:'rel-leraar-side',        label:'1..*',  type:'rel', hint:'Een klas heeft 1 of meer leraren' },
];

let puzzleScored = false;
let hintIndex = 0;

function initPuzzle() {
  const bank = document.getElementById('puzzlePieces');
  if (!bank) return;

  puzzleScored = false;
  hintIndex = 0;

  // Reset alle slots
  document.querySelectorAll('.pz-slot, .pz-rel-slot').forEach(slot => {
    slot.classList.remove('filled','correct','wrong','drag-over');
    slot.dataset.placedId = '';
    // Toon oorspronkelijke placeholder tekst
    slot.innerHTML = slot.dataset.accepts.startsWith('rel-')
      ? '?'
      : slot.textContent.trim() || '—';
  });

  document.getElementById('puzzleStatus').textContent = '';
  document.getElementById('puzzleScore').textContent  = '';

  // Schud stukken en render
  const shuffled = [...PUZZLE_PIECES].sort(() => Math.random() - .5);
  bank.innerHTML = '';
  shuffled.forEach(p => {
    const el = document.createElement('div');
    el.className   = 'puzzle-piece';
    el.draggable   = true;
    el.dataset.id  = p.id;
    el.dataset.type = p.type;
    el.textContent = p.label;
    if (p.type === 'rel') el.setAttribute('data-type','rel');
    el.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', p.id);
      setTimeout(() => el.classList.add('dragging'), 0);
    });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));
    // Tap/klik voor mobiel
    el.addEventListener('click', () => puzzleTap(el));
    bank.appendChild(el);
  });

  // Drop listeners op alle slots
  document.querySelectorAll('.pz-slot, .pz-rel-slot').forEach(slot => {
    slot.addEventListener('dragover',  e => { e.preventDefault(); slot.classList.add('drag-over'); });
    slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
    slot.addEventListener('drop',      e => {
      e.preventDefault();
      slot.classList.remove('drag-over');
      const pieceId = e.dataTransfer.getData('text/plain');
      placePiece(pieceId, slot);
    });
    slot.addEventListener('click', () => puzzleSlotClick(slot));
  });
}

let selectedPiece = null;

function puzzleTap(el) {
  // Selecteer stuk voor mobiele klik-flow
  document.querySelectorAll('.puzzle-piece.selected').forEach(p => p.classList.remove('selected'));
  if (selectedPiece === el) { selectedPiece = null; return; }
  selectedPiece = el;
  el.classList.add('selected');
}

function puzzleSlotClick(slot) {
  if (!selectedPiece) return;
  placePiece(selectedPiece.dataset.id, slot);
  selectedPiece.classList.remove('selected');
  selectedPiece = null;
}

function placePiece(pieceId, slot) {
  const piece = PUZZLE_PIECES.find(p => p.id === pieceId);
  if (!piece) return;

  // Als slot al gevuld is, stuur het vorige stuk terug
  if (slot.dataset.placedId) returnPieceToBank(slot.dataset.placedId);

  // Verwijder stuk uit bank (of andere slot)
  const inBank = document.querySelector(`#puzzlePieces [data-id="${pieceId}"]`);
  if (inBank) inBank.remove();
  else {
    // Zit in ander slot — maak dat slot leeg
    document.querySelectorAll('.pz-slot, .pz-rel-slot').forEach(s => {
      if (s.dataset.placedId === pieceId) {
        s.dataset.placedId = '';
        s.classList.remove('filled','correct','wrong');
        s.innerHTML = s.dataset.accepts.startsWith('rel-') ? '?' : s.textContent || '—';
      }
    });
  }

  // Plaats in slot
  slot.dataset.placedId = pieceId;
  slot.classList.add('filled');
  slot.classList.remove('correct','wrong');
  slot.textContent = piece.label;
}

function returnPieceToBank(pieceId) {
  const piece = PUZZLE_PIECES.find(p => p.id === pieceId);
  if (!piece) return;
  const bank = document.getElementById('puzzlePieces');
  const el = document.createElement('div');
  el.className    = 'puzzle-piece';
  el.draggable    = true;
  el.dataset.id   = piece.id;
  el.dataset.type = piece.type;
  el.textContent  = piece.label;
  if (piece.type === 'rel') el.setAttribute('data-type','rel');
  el.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', piece.id);
    setTimeout(() => el.classList.add('dragging'), 0);
  });
  el.addEventListener('dragend', () => el.classList.remove('dragging'));
  el.addEventListener('click', () => puzzleTap(el));
  bank.appendChild(el);
}

function checkPuzzle() {
  const slots = document.querySelectorAll('.pz-slot, .pz-rel-slot');
  let correct = 0;
  let total   = slots.length;

  slots.forEach(slot => {
    const expected = slot.dataset.accepts;
    const placed   = slot.dataset.placedId || '';
    slot.classList.remove('correct','wrong');
    if (!placed) return;
    if (placed === expected) { slot.classList.add('correct'); correct++; }
    else                     { slot.classList.add('wrong'); }
  });

  const status = document.getElementById('puzzleStatus');
  const score  = document.getElementById('puzzleScore');

  if (correct === total) {
    status.textContent = '🎉 Perfect! Alle stukken op de juiste plek!';
    status.style.color = 'var(--accent3)';
    score.textContent  = `+5 punten verdiend! 🏆`;
    if (!puzzleScored) { addPoint(5); puzzleScored = true; }
  } else {
    status.textContent = `${correct} / ${total} correct — de rode stukken staan verkeerd.`;
    status.style.color = '#f87171';
    score.textContent  = '';
  }
}

function resetPuzzle() {
  puzzleScored = false;
  initPuzzle();
}

function puzzleHint() {
  const hints = PUZZLE_PIECES.map(p => `💡 <strong>${p.label}</strong>: ${p.hint}`);
  const status = document.getElementById('puzzleStatus');
  status.innerHTML = hints[hintIndex % hints.length];
  status.style.color = 'var(--accent4)';
  hintIndex++;
}

/* ================================================================
   MEMORY GAME
================================================================ */
const MEMORY_PAIRS = [
  { type: 'CHAR(2)',       example: '"NL" — landcode, altijd 2 tekens' },
  { type: 'VARCHAR(50)',   example: '"Jansen" — achternaam, variabele lengte' },
  { type: 'TEXT',          example: '"Lange productbeschrijving..." — onbeperkte tekst' },
  { type: 'INT',           example: '42 — heel getal, bijv. leeftijd of ID' },
  { type: 'DECIMAL(10,2)', example: '2500.50 — bedrag met decimalen' },
  { type: 'DATE',          example: '1990-05-23 — alleen een datum' },
  { type: 'TIME',          example: '14:30:00 — alleen een tijdstip' },
  { type: 'DATETIME',      example: '2023-01-18 10:45:32 — datum én tijd' },
];

let memoryState = {
  flipped: [], matched: 0, moves: 0, locked: false, scored: false,
};

function initMemory() {
  const grid = document.getElementById('memoryGrid');
  if (!grid) return;

  // Maak kaartparen: type-kaart + voorbeeld-kaart
  const pairs = MEMORY_PAIRS.map((p, i) => ([
    { pairId: i, kind: 'type',    text: p.type    },
    { pairId: i, kind: 'example', text: p.example },
  ])).flat();

  // Schudden
  const shuffled = pairs.sort(() => Math.random() - .5);
  memoryState = { flipped: [], matched: 0, moves: 0, locked: false, scored: false };

  grid.innerHTML = '';
  shuffled.forEach((card, idx) => {
    const el = document.createElement('div');
    el.className = 'memory-card';
    el.dataset.idx   = idx;
    el.dataset.pairId = card.pairId;
    el.dataset.kind   = card.kind;
    el.innerHTML = `
      <div class="memory-inner">
        <div class="memory-front">🃏</div>
        <div class="memory-back">${card.text}</div>
      </div>`;
    el.addEventListener('click', () => flipMemoryCard(el));
    grid.appendChild(el);
  });

  document.getElementById('memoryStatus').textContent = 'Vind alle 8 paren! 🔍';
  document.getElementById('memoryMoves').textContent  = '';
  document.getElementById('memoryStatus').style.color = '';
}

function flipMemoryCard(el) {
  if (memoryState.locked) return;
  if (el.classList.contains('flipped') || el.classList.contains('matched')) return;

  el.classList.add('flipped');
  memoryState.flipped.push(el);

  if (memoryState.flipped.length === 2) {
    memoryState.locked = true;
    memoryState.moves++;
    checkMemoryMatch();
  }
}

function checkMemoryMatch() {
  const [a, b] = memoryState.flipped;
  const isMatch = a.dataset.pairId === b.dataset.pairId
               && a.dataset.kind   !== b.dataset.kind;

  if (isMatch) {
    a.classList.add('matched');
    b.classList.add('matched');
    memoryState.matched++;
    memoryState.flipped = [];
    memoryState.locked  = false;
    updateMemoryStatus();

    if (memoryState.matched === MEMORY_PAIRS.length && !memoryState.scored) {
      memoryState.scored = true;
      addPoint(3);
      const status = document.getElementById('memoryStatus');
      status.textContent = `🎉 Alle paren gevonden in ${memoryState.moves} beurten! +3 punten!`;
      status.style.color = 'var(--accent3)';
      document.getElementById('memoryMoves').textContent = '';
    }
  } else {
    // Schud-animatie + terugdraaien na korte pauze
    a.classList.add('wrong-flash');
    b.classList.add('wrong-flash');
    setTimeout(() => {
      a.classList.remove('flipped', 'wrong-flash');
      b.classList.remove('flipped', 'wrong-flash');
      memoryState.flipped = [];
      memoryState.locked  = false;
    }, 900);
  }
}

function updateMemoryStatus() {
  const remaining = MEMORY_PAIRS.length - memoryState.matched;
  document.getElementById('memoryStatus').textContent =
    remaining > 0 ? `${memoryState.matched} / ${MEMORY_PAIRS.length} paren gevonden` : '';
  document.getElementById('memoryMoves').textContent =
    `${memoryState.moves} beurt${memoryState.moves !== 1 ? 'en' : ''}`;
}

function resetMemory() {
  memoryState.scored = false;
  initMemory();
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

  // Dragleave voor drop zones
  document.querySelectorAll('.drop-zone').forEach(z => {
    z.addEventListener('dragleave', () => z.classList.remove('drag-over'));
  });

  // Start memory game als het grid aanwezig is (module 2)
  if (document.getElementById('memoryGrid')) initMemory();

  // Start ERD puzzel als die aanwezig is (module 1)
  if (document.getElementById('puzzlePieces')) initPuzzle();
});

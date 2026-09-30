const STORAGE_KEY = 'note-deck.state.v2';
const LEGACY_STORAGE_KEY = 'note-deck.notes.v1';
const emptyCard = {
  id: 'empty-card',
  text: 'No notes yet\n\nCreate your first note below.',
  createdAt: '',
  sample: true,
  number: null
};

const deck = document.getElementById('deck');
const status = document.getElementById('status');
const newButton = document.getElementById('new-note');
const editor = document.getElementById('note-editor');
const editorNumber = document.getElementById('editor-number');
const editorDate = document.getElementById('editor-date');
const noteText = document.getElementById('note-text');
const deleteButton = document.getElementById('delete-note');
const deleteConfirm = document.getElementById('delete-confirm');

function validNote(note) {
  return note && typeof note.id === 'string' && typeof note.text === 'string' && typeof note.createdAt === 'string';
}

function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && Array.isArray(saved.notes)) {
      const savedNotes = saved.notes.filter(note => validNote(note) && Number.isInteger(note.number) && note.number > 0);
      const largest = Math.max(0, ...savedNotes.map(note => note.number));
      return {
        notes: savedNotes,
        nextNumber: Math.max(largest + 1, Number.isInteger(saved.nextNumber) ? saved.nextNumber : 1),
        migrated: false
      };
    }

    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || '[]');
    if (Array.isArray(legacy)) {
      const legacyNotes = legacy.filter(validNote);
      const ordered = legacyNotes.map((note, index) => ({ note, index })).sort((a, b) => {
        const first = Date.parse(a.note.createdAt);
        const second = Date.parse(b.note.createdAt);
        return ((Number.isNaN(first) ? 0 : first) - (Number.isNaN(second) ? 0 : second)) || b.index - a.index;
      });
      ordered.forEach(({ note }, index) => { note.number = index + 1; });
      return { notes: legacyNotes, nextNumber: legacyNotes.length + 1, migrated: legacyNotes.length > 0 };
    }
  } catch {
    // Start with an empty deck if browser storage is unavailable or malformed.
  }
  return { notes: [], nextNumber: 1, migrated: false };
}

const initialState = readState();
let notes = initialState.notes;
let nextNumber = initialState.nextNumber;
let selectedIndex = 0;
let editingId = null;
let pointerStart = null;
let suppressCardClick = false;
let editorHistoryActive = false;
let renderVersion = 0;
let lastHorizontalKey = '';
let lastHorizontalMoveAt = -Infinity;
const renderedCards = new Map();

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ notes, nextNumber }));
    return true;
  } catch {
    status.textContent = 'This device could not save the note. Keep this screen open and try again.';
    return false;
  }
}

function shownNotes() { return notes.length ? notes : [emptyCard]; }
function titleFor(text) {
  const firstLine = text.trim().split('\n')[0].trim() || 'Untitled note';
  return firstLine.length > 48 ? firstLine.slice(0, 47).trimEnd() + '…' : firstLine;
}
function visibleTitleFor(text) {
  return text.split('\n')[0] || 'Untitled note';
}
function bodyFor(text) {
  const lineBreak = text.indexOf('\n');
  return lineBreak < 0 ? '' : text.slice(lineBreak + 1);
}
function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  }).format(date);
}
function createTextElement(tag, className, value) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = value;
  return element;
}

function createCard() {
  const anchor = document.createElement('div');
  anchor.className = 'card-anchor';
  const card = document.createElement('button');
  card.className = 'note-card';
  card.type = 'button';
  anchor.append(card);
  deck.append(anchor);
  return { anchor, card, contentKey: null };
}

function updateCard(entry, note, index, offset) {
  const { anchor, card } = entry;
  const position = Math.max(-3, Math.min(3, offset));
  const visible = Math.abs(offset) <= 2;
  const selectable = Math.abs(offset) <= 1;
  anchor.dataset.current = String(offset === 0);
  anchor.dataset.visible = String(visible);
  anchor.setAttribute('aria-hidden', String(!selectable));
  anchor.style.setProperty('--angle', position * 15 + 'deg');
  anchor.style.setProperty('--layer', String(10 - Math.abs(position)));
  anchor.style.setProperty('--opacity', visible ? String(1 - Math.abs(position) * .13) : '0');
  anchor.style.setProperty('--scale', String(1 - Math.abs(position) * .07));
  card.tabIndex = selectable ? 0 : -1;
  card.setAttribute('aria-label', note.sample ? 'Create your first note' : 'Open note ' + note.number + ': ' + titleFor(note.text));

  const contentKey = note.number + '\n' + note.text + '\n' + note.createdAt;
  if (entry.contentKey !== contentKey) {
    entry.contentKey = contentKey;
    card.replaceChildren();
    const topLine = createTextElement('div', 'card-topline', '');
    topLine.append(
      createTextElement('span', 'card-index', note.number === null ? '' : String(note.number)),
      createTextElement('span', 'card-date', formatDate(note.createdAt))
    );
    const content = createTextElement('div', 'card-content', '');
    content.append(
      createTextElement('h2', 'card-title', visibleTitleFor(note.text)),
      createTextElement('p', 'card-body', bodyFor(note.text))
    );
    card.append(
      topLine,
      createTextElement('div', 'card-rule', ''),
      content
    );
  }

  card.onclick = () => {
    if (suppressCardClick) return;
    const currentIndex = shownNotes().findIndex(item => item.id === note.id);
    if (currentIndex < 0) return;
    if (currentIndex !== selectedIndex) { selectCard(currentIndex); return; }
    openEditor(note.sample ? null : note.id);
  };
  card.onfocus = () => {
    const focusedIndex = shownNotes().findIndex(item => item.id === note.id);
    if (focusedIndex >= 0 && focusedIndex !== selectedIndex) selectCard(focusedIndex);
  };
}

function render(previousIndex = selectedIndex) {
  const items = shownNotes();
  selectedIndex = Math.max(0, Math.min(selectedIndex, items.length - 1));
  const version = ++renderVersion;
  const needed = new Set();

  items.forEach((note, index) => {
    const offset = index - selectedIndex;
    if (Math.abs(offset) > 3) return;
    needed.add(note.id);
    let entry = renderedCards.get(note.id);
    if (!entry) {
      entry = createCard();
      renderedCards.set(note.id, entry);
      const initialOffset = index - previousIndex;
      updateCard(entry, note, index, Math.abs(initialOffset) > 2 ? initialOffset : offset);
      if (initialOffset !== offset) {
        entry.anchor.getBoundingClientRect();
        requestAnimationFrame(() => {
          if (version === renderVersion && renderedCards.get(note.id) === entry) updateCard(entry, note, index, offset);
        });
      }
    } else {
      updateCard(entry, note, index, offset);
    }
  });

  for (const [id, entry] of renderedCards) {
    if (needed.has(id)) continue;
    const oldOffset = Number(entry.anchor.style.getPropertyValue('--angle').replace('deg', '')) / 15;
    const exitOffset = oldOffset < 0 ? -3 : 3;
    const oldNote = items.find(note => note.id === id);
    if (oldNote) updateCard(entry, oldNote, items.indexOf(oldNote), exitOffset);
    else {
      entry.anchor.style.setProperty('--opacity', '0');
      entry.anchor.setAttribute('aria-hidden', 'true');
      entry.card.tabIndex = -1;
      entry.card.style.pointerEvents = 'none';
    }
    setTimeout(() => {
      const currentItems = shownNotes();
      const currentIndex = currentItems.findIndex(note => note.id === id);
      if (renderedCards.get(id) === entry && (currentIndex < 0 || Math.abs(currentIndex - selectedIndex) > 3)) {
        entry.anchor.remove();
        renderedCards.delete(id);
      }
    }, 400);
  }
}

function focusFrontCard() {
  const current = shownNotes()[selectedIndex];
  renderedCards.get(current.id)?.card.focus({ preventScroll: true });
}

function selectCard(index) {
  const items = shownNotes();
  if (index < 0 || index >= items.length) return;
  const previousIndex = selectedIndex;
  selectedIndex = index;
  render(previousIndex);
  focusFrontCard();
  status.textContent = items[index].sample ? 'No notes yet.' : 'Note ' + items[index].number + ' of ' + notes.length + '.';
}

function openEditor(id = null) {
  editingId = id;
  const note = notes.find(item => item.id === id);
  noteText.value = note?.text || '';
  editorNumber.textContent = String(note?.number || nextNumber);
  editorDate.textContent = note ? formatDate(note.createdAt) : '';
  deleteButton.hidden = !note;
  deleteConfirm.hidden = true;
  editor.showModal();
  history.pushState({ noteDeckEditor: true }, '');
  editorHistoryActive = true;
  noteText.focus({ preventScroll: true });
  requestAnimationFrame(() => noteText.focus({ preventScroll: true }));
}

function saveDraft() {
  const text = noteText.value;
  if (!editingId && !text.trim()) return true;
  const oldNotes = notes;
  const oldNextNumber = nextNumber;
  const oldEditingId = editingId;
  const existingIndex = notes.findIndex(note => note.id === editingId);

  if (editingId && existingIndex < 0) return false;
  if (existingIndex >= 0) {
    notes = notes.map((note, index) => index === existingIndex ? { ...note, text } : note);
  } else {
    const id = crypto.randomUUID?.() || String(Date.now());
    notes = [{ id, number: nextNumber, text, createdAt: new Date().toISOString() }, ...notes];
    editingId = id;
    selectedIndex = 0;
    nextNumber += 1;
  }

  if (!persistState()) {
    notes = oldNotes;
    nextNumber = oldNextNumber;
    editingId = oldEditingId;
    return false;
  }
  deleteButton.hidden = false;
  editorNumber.textContent = String(notes.find(note => note.id === editingId)?.number || nextNumber);
  editorDate.textContent = formatDate(notes.find(note => note.id === editingId)?.createdAt);
  return true;
}

function finishEditor(fromHistory = false) {
  if (!editor.open || !saveDraft()) return;
  editor.close();
  editingId = null;
  deleteConfirm.hidden = true;
  render();
  focusFrontCard();
  if (editorHistoryActive && !fromHistory) history.back();
  editorHistoryActive = false;
}

function createNote(content) {
  const text = String(content || '').trim();
  if (!text || text.length > 1500) return false;
  const oldNotes = notes;
  const oldNextNumber = nextNumber;
  notes = [{ id: crypto.randomUUID?.() || String(Date.now()), number: nextNumber, text, createdAt: new Date().toISOString() }, ...notes];
  selectedIndex = 0;
  nextNumber += 1;
  if (!persistState()) {
    notes = oldNotes;
    nextNumber = oldNextNumber;
    return false;
  }
  render();
  focusFrontCard();
  status.textContent = 'Note ' + (nextNumber - 1) + ' saved.';
  return true;
}

newButton.addEventListener('click', () => openEditor());
noteText.addEventListener('input', saveDraft);
noteText.addEventListener('change', saveDraft);
editor.addEventListener('cancel', event => {
  event.preventDefault();
  if (!deleteConfirm.hidden) {
    deleteConfirm.hidden = true;
    deleteButton.focus();
  } else {
    finishEditor();
  }
});
window.addEventListener('popstate', () => {
  if (editor.open) finishEditor(true);
});

deleteButton.addEventListener('click', () => {
  deleteButton.hidden = true;
  deleteConfirm.hidden = false;
  document.getElementById('cancel-delete').focus();
});
document.getElementById('cancel-delete').addEventListener('click', () => {
  deleteConfirm.hidden = true;
  deleteButton.hidden = false;
  deleteButton.focus();
});
document.getElementById('confirm-delete').addEventListener('click', () => {
  const oldNotes = notes;
  notes = notes.filter(note => note.id !== editingId);
  if (!persistState()) { notes = oldNotes; return; }
  selectedIndex = Math.min(selectedIndex, Math.max(0, notes.length - 1));
  noteText.value = '';
  editingId = null;
  status.textContent = 'Card deleted.';
  finishEditor();
});

document.addEventListener('keydown', event => {
  if (editor.open || event.altKey || event.ctrlKey || event.metaKey) return;
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();

  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    const now = performance.now();
    if (event.repeat || (event.key === lastHorizontalKey && now - lastHorizontalMoveAt < 300)) return;
    lastHorizontalKey = event.key;
    lastHorizontalMoveAt = now;
    selectCard(selectedIndex + (event.key === 'ArrowRight' ? 1 : -1));
    return;
  }

  if (document.activeElement === newButton && event.key === 'ArrowUp') {
    focusFrontCard();
    return;
  }
  if (document.activeElement === newButton) return;
  const current = shownNotes()[selectedIndex];
  const card = renderedCards.get(current.id)?.card;
  const content = card?.querySelector('.card-content');
  const direction = event.key === 'ArrowDown' ? 1 : -1;
  if (content &&
      (direction > 0 ? content.scrollTop + content.clientHeight < content.scrollHeight - 1 : content.scrollTop > 1)) {
    content.scrollTop += direction * 90;
  } else if (direction > 0) {
    newButton.focus({ preventScroll: true });
  }
}, true);

deck.addEventListener('pointerdown', event => { pointerStart = { x: event.clientX, y: event.clientY }; });
deck.addEventListener('pointerup', event => {
  if (!pointerStart) return;
  const dx = event.clientX - pointerStart.x;
  const dy = event.clientY - pointerStart.y;
  pointerStart = null;
  if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
    suppressCardClick = true;
    setTimeout(() => { suppressCardClick = false; }, 100);
    return;
  }
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
    suppressCardClick = true;
    setTimeout(() => { suppressCardClick = false; }, 100);
    selectCard(selectedIndex + (dx < 0 ? 1 : -1));
  }
});
deck.addEventListener('pointercancel', () => { pointerStart = null; });

function registerVoiceTool() {
  const context = document.modelContext || navigator.modelContext;
  if (!context?.registerTool) return;
  Promise.resolve(context.registerTool({
    name: 'add_card_to_note_deck',
    description: 'Add a text card to the open Note Deck web app. The wearer may say “add a card to Note Deck” and dictate its content. If no content is given, open the Note Deck editor for a new card. This is for Note Deck cards, not Meta audio notes or recordings.',
    inputSchema: {
      type: 'object',
      properties: { content: { type: 'string', description: 'The words to save on the card.' } },
      additionalProperties: false
    },
    execute: ({ content } = {}) => {
      if (typeof content === 'string' && content.trim()) {
        return createNote(content) ? 'Saved the note to Note Deck.' : 'The note could not be saved.';
      }
      if (!editor.open) openEditor();
      return 'The note editor is open. The text field is focused; select it to start dictation.';
    }
  })).catch(() => { /* WebMCP is optional; New note remains available. */ });
}

if (initialState.migrated) persistState();
render();
requestAnimationFrame(focusFrontCard);
registerVoiceTool();

const STORAGE_KEY = 'note-deck.notes.v1';

const sampleNotes = [
  { id: 'sample-1', text: 'A thought worth keeping.\n\nCreate your first card using New note.', createdAt: 'Example', sample: true },
  { id: 'sample-2', text: 'Say it while this app is open.\n\nWhen available, Meta AI can add a card for you.', createdAt: 'Example', sample: true },
  { id: 'sample-3', text: 'Move through the deck with left and right.\n\nSelect the front card to edit it.', createdAt: 'Example', sample: true },
];

const deck = document.getElementById('deck');
const count = document.getElementById('card-count');
const positionLabel = document.getElementById('position-label');
const status = document.getElementById('status');
const previousButton = document.getElementById('previous-card');
const nextButton = document.getElementById('next-card');
const newButton = document.getElementById('new-note');
const editor = document.getElementById('note-editor');
const noteForm = document.getElementById('note-form');
const editorTitle = document.getElementById('editor-title');
const noteText = document.getElementById('note-text');
const deleteButton = document.getElementById('delete-note');
const editorFields = document.getElementById('editor-fields');
const deleteConfirm = document.getElementById('delete-confirm');

let notes = readNotes();
let selectedIndex = 0;
let editingId = null;
let pointerStart = null;
const renderedCards = new Map();
let renderVersion = 0;

function readNotes() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(note => note && typeof note.id === 'string' && typeof note.text === 'string' && typeof note.createdAt === 'string');
  } catch {
    return [];
  }
}

function persistNotes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    return true;
  } catch {
    status.textContent = 'This browser could not save the note. Storage may be unavailable.';
    return false;
  }
}

function shownNotes() { return notes.length ? notes : sampleNotes; }

function titleFor(text) {
  const firstLine = text.trim().split(/\n/)[0].trim();
  return firstLine.length > 48 ? `${firstLine.slice(0, 47).trimEnd()}…` : firstLine;
}

function bodyFor(text) {
  const lineBreak = text.indexOf('\n');
  return lineBreak < 0 ? '' : text.slice(lineBreak + 1).trim();
}

function formatDate(value) {
  if (value === 'Example') return 'EXAMPLE CARD';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function createTextElement(tag, className, value) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = value;
  return element;
}

function createCard(note) {
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
  anchor.dataset.current = String(offset === 0);
  anchor.dataset.visible = String(visible);
  anchor.setAttribute('aria-hidden', String(!visible));
  anchor.style.setProperty('--angle', `${position * 15}deg`);
  anchor.style.setProperty('--layer', String(10 - Math.abs(position)));
  anchor.style.setProperty('--opacity', visible ? String(1 - Math.abs(position) * .13) : '0');
  anchor.style.setProperty('--scale', String(1 - Math.abs(position) * .07));
  card.tabIndex = visible ? 0 : -1;
  card.setAttribute('aria-label', `${offset === 0 ? (note.sample ? 'Create a note from example' : 'Edit') : 'Show'} card ${index + 1}: ${titleFor(note.text)}`);
  const contentKey = `${note.text}\n${note.createdAt}`;
  if (entry.contentKey !== contentKey) {
    entry.contentKey = contentKey;
    card.replaceChildren();
    card.append(createTextElement('div', 'card-topline', ''));
    card.firstChild.append(
      createTextElement('span', 'card-index', String(index + 1).padStart(2, '0')),
      createTextElement('span', 'card-kind', note.sample ? 'Example' : 'Note')
    );
    card.append(
      createTextElement('div', 'card-rule', ''),
      createTextElement('h2', 'card-title', titleFor(note.text)),
      createTextElement('p', 'card-body', bodyFor(note.text)),
      createTextElement('div', 'card-date', formatDate(note.createdAt))
    );
  }
  card.onclick = () => {
    const currentIndex = shownNotes().findIndex(item => item.id === note.id);
    if (currentIndex < 0) return;
    if (currentIndex !== selectedIndex) { selectCard(currentIndex); return; }
    openEditor(note.sample ? null : note.id);
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
      entry = createCard(note);
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
    else entry.anchor.style.setProperty('--opacity', '0');
    setTimeout(() => {
      const currentItems = shownNotes();
      const currentIndex = currentItems.findIndex(note => note.id === id);
      if (renderedCards.get(id) === entry && (currentIndex < 0 || Math.abs(currentIndex - selectedIndex) > 3)) {
        entry.anchor.remove();
        renderedCards.delete(id);
      }
    }, 400);
  }

  count.textContent = notes.length ? `${notes.length} ${notes.length === 1 ? 'card' : 'cards'}` : 'Your deck';
  positionLabel.textContent = `${selectedIndex + 1} / ${items.length}`;
  previousButton.disabled = selectedIndex === 0;
  nextButton.disabled = selectedIndex === items.length - 1;
}

function selectCard(index) {
  const items = shownNotes();
  if (index < 0 || index >= items.length) return;
  const previousIndex = selectedIndex;
  selectedIndex = index;
  render(previousIndex);
  status.textContent = `Card ${index + 1} of ${items.length}: ${titleFor(items[index].text)}`;
}

function openEditor(id = null) {
  editingId = id;
  const note = notes.find(item => item.id === id);
  editorTitle.textContent = note ? 'Edit note' : 'New note';
  noteText.value = note?.text || '';
  deleteButton.hidden = !note;
  editorFields.hidden = false;
  deleteConfirm.hidden = true;
  editor.showModal();
  noteText.focus();
}

function closeEditor() {
  editor.close();
  editingId = null;
  newButton.focus();
}

function saveNote(content) {
  const text = String(content || '').trim();
  if (!text) return false;
  if (text.length > 1500) {
    status.textContent = 'Notes must be 1,500 characters or fewer.';
    return false;
  }

  const oldNotes = notes;
  const existingIndex = notes.findIndex(note => note.id === editingId);
  if (existingIndex >= 0) {
    notes = notes.map((note, index) => index === existingIndex ? { ...note, text } : note);
    selectedIndex = existingIndex;
  } else {
    notes = [{ id: crypto.randomUUID?.() || String(Date.now()), text, createdAt: new Date().toISOString() }, ...notes];
    selectedIndex = 0;
  }
  if (!persistNotes()) { notes = oldNotes; return false; }
  render();
  status.textContent = existingIndex >= 0 ? 'Card updated.' : 'Card saved.';
  return true;
}

previousButton.addEventListener('click', () => selectCard(selectedIndex - 1));
nextButton.addEventListener('click', () => selectCard(selectedIndex + 1));
newButton.addEventListener('click', () => openEditor());
document.getElementById('close-editor').addEventListener('click', closeEditor);

noteForm.addEventListener('submit', event => {
  event.preventDefault();
  if (saveNote(noteText.value)) closeEditor();
});

deleteButton.addEventListener('click', () => {
  editorFields.hidden = true;
  deleteConfirm.hidden = false;
  document.getElementById('cancel-delete').focus();
});
document.getElementById('cancel-delete').addEventListener('click', () => {
  editorFields.hidden = false;
  deleteConfirm.hidden = true;
  deleteButton.focus();
});
document.getElementById('confirm-delete').addEventListener('click', () => {
  const oldNotes = notes;
  notes = notes.filter(note => note.id !== editingId);
  if (!persistNotes()) { notes = oldNotes; return; }
  selectedIndex = Math.min(selectedIndex, Math.max(0, notes.length - 1));
  render();
  status.textContent = 'Card deleted.';
  closeEditor();
});

document.addEventListener('keydown', event => {
  if (editor.open || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'ArrowLeft') { event.preventDefault(); selectCard(selectedIndex - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); selectCard(selectedIndex + 1); }
});

deck.addEventListener('pointerdown', event => { pointerStart = { x: event.clientX, y: event.clientY }; });
deck.addEventListener('pointerup', event => {
  if (!pointerStart) return;
  const dx = event.clientX - pointerStart.x;
  const dy = event.clientY - pointerStart.y;
  pointerStart = null;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
    selectCard(selectedIndex + (dx < 0 ? 1 : -1));
  }
});
deck.addEventListener('pointercancel', () => { pointerStart = null; });

function registerVoiceTool() {
  const context = document.modelContext || navigator.modelContext;
  if (!context?.registerTool) return;
  Promise.resolve(context.registerTool({
    name: 'make_note',
    description: 'Create a note card in Note Deck from the user’s spoken words. If no note content is provided, open the note editor so the user can dictate it.',
    inputSchema: {
      type: 'object',
      properties: { content: { type: 'string', description: 'The words to save on the card.' } },
      additionalProperties: false
    },
    execute: ({ content } = {}) => {
      if (typeof content === 'string' && content.trim()) {
        const created = saveNote(content);
        return created ? 'Saved the note to Note Deck.' : 'The note could not be saved.';
      }
      if (!editor.open) openEditor();
      return 'The new note editor is open. Ask the user to select the text field and dictate the note.';
    }
  })).catch(() => { /* WebMCP is still in preview; the New note control remains available. */ });
}

render();
registerVoiceTool();

class NotesManager {
    constructor() {
        this.currentNote = null;
        this.notes = JSON.parse(localStorage.getItem('notes') || '[]');
        this.initializeUI();
        this.loadNotes();
        this.setupEventListeners();
    }

    initializeUI() {
        this.notesList = document.getElementById('notesList');
        this.noteTitle = document.getElementById('noteTitle');
        this.noteContent = document.getElementById('noteContent');
        this.searchBar = document.querySelector('.search-bar');
        
        // Initialize toolbar functionality
        document.querySelectorAll('.toolbar-btn[data-command]').forEach(button => {
            button.addEventListener('click', () => {
                const command = button.getAttribute('data-command');
                if (command === 'createLink') {
                    const url = prompt('Enter URL:');
                    if (url) document.execCommand(command, false, url);
                } else if (command === 'insertImage') {
                    const url = prompt('Enter image URL:');
                    if (url) document.execCommand(command, false, url);
                } else {
                    document.execCommand(command, false, null);
                }
            });
        });
    }

    setupEventListeners() {
        // New note button
        document.getElementById('newNote').addEventListener('click', () => {
            this.createNewNote();
        });

        // Save note button
        document.getElementById('saveNote').addEventListener('click', () => {
            this.saveCurrentNote();
        });

        // Delete note button
        document.getElementById('deleteNote').addEventListener('click', () => {
            this.deleteCurrentNote();
        });

        // Search functionality
        this.searchBar.addEventListener('input', (e) => {
            this.searchNotes(e.target.value);
        });

        // Favorite button
        document.getElementById('favoriteNote').addEventListener('click', () => {
            this.toggleFavorite();
        });

        // Share button
        document.getElementById('shareNote').addEventListener('click', () => {
            this.shareNote();
        });

        // Auto-save functionality
        let autoSaveTimeout;
        this.noteContent.addEventListener('input', () => {
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => this.saveCurrentNote(), 1000);
        });
    }

    createNewNote() {
        const note = {
            id: Date.now(),
            title: 'Untitled Note',
            content: '',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            category: 'Personal',
            favorite: false
        };

        this.notes.unshift(note);
        this.saveNotes();
        this.loadNotes();
        this.setCurrentNote(note);
    }

    saveCurrentNote() {
        if (!this.currentNote) return;

        this.currentNote.title = this.noteTitle.value;
        this.currentNote.content = this.noteContent.innerHTML;
        this.currentNote.modified = new Date().toISOString();

        const index = this.notes.findIndex(note => note.id === this.currentNote.id);
        if (index !== -1) {
            this.notes[index] = this.currentNote;
        }

        this.saveNotes();
        this.loadNotes();
    }

    deleteCurrentNote() {
        if (!this.currentNote) return;
        if (!confirm('Are you sure you want to delete this note?')) return;

        const index = this.notes.findIndex(note => note.id === this.currentNote.id);
        if (index !== -1) {
            this.notes.splice(index, 1);
            this.saveNotes();
            this.loadNotes();
            this.clearEditor();
        }
    }

    loadNotes() {
        this.notesList.innerHTML = '';
        this.notes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            if (this.currentNote && this.currentNote.id === note.id) {
                noteElement.classList.add('active');
            }

            noteElement.innerHTML = `
                <div class="note-item-header">
                    <div class="note-item-title">${note.title}</div>
                    ${note.favorite ? '<span>⭐</span>' : ''}
                </div>
                <div class="note-item-date">
                    ${new Date(note.modified).toLocaleDateString()}
                </div>
            `;

            noteElement.addEventListener('click', () => {
                this.setCurrentNote(note);
            });

            this.notesList.appendChild(noteElement);
        });
    }

    setCurrentNote(note) {
        this.currentNote = note;
        this.noteTitle.value = note.title;
        this.noteContent.innerHTML = note.content;
        document.getElementById('favoriteNote').textContent = note.favorite ? '⭐' : '☆';
        this.loadNotes();
    }

    clearEditor() {
        this.currentNote = null;
        this.noteTitle.value = '';
        this.noteContent.innerHTML = '';
        document.getElementById('favoriteNote').textContent = '☆';
    }

    searchNotes(query) {
        const filteredNotes = this.notes.filter(note =>
            note.title.toLowerCase().includes(query.toLowerCase()) ||
            note.content.toLowerCase().includes(query.toLowerCase())
        );

        this.notesList.innerHTML = '';
        filteredNotes.forEach(note => {
            // Reuse existing note rendering code
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            // ... (rest of the note rendering code)
        });
    }

    toggleFavorite() {
        if (!this.currentNote) return;
        this.currentNote.favorite = !this.currentNote.favorite;
        document.getElementById('favoriteNote').textContent = 
            this.currentNote.favorite ? '⭐' : '☆';
        this.saveCurrentNote();
    }

    shareNote() {
        if (!this.currentNote) return;
        // Implement sharing functionality (e.g., copy to clipboard)
        const noteText = `${this.currentNote.title}\n\n${this.currentNote.content}`;
        navigator.clipboard.writeText(noteText)
            .then(() => alert('Note copied to clipboard!'))
            .catch(err => console.error('Failed to copy note:', err));
    }

    saveNotes() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }
}

// Initialize Notes Manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new NotesManager();
});
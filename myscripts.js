// State management for the application
const AppState = {
    posts: JSON.parse(localStorage.getItem('blog-posts') || '[]'),
    goals: JSON.parse(localStorage.getItem('writing-goals') || '[]'),
    events: JSON.parse(localStorage.getItem('calendar-events') || '{}'),
    mindMapNodes: JSON.parse(localStorage.getItem('mind-map-nodes') || '[]')
};

// Rich Text Editor functionality
class RichTextEditor {
    constructor() {
        this.toolbar = document.querySelectorAll('.toolbar-btn[data-command]');
        this.editor = document.getElementById('editor');
        this.initializeToolbar();
        this.initializeAutoSave();
    }

    initializeToolbar() {
        this.toolbar.forEach(button => {
            button.addEventListener('click', () => {
                const command = button.getAttribute('data-command');
                try {
                    document.execCommand(command, false, null);
                    this.editor.focus();
                } catch (error) {
                    console.error('Error executing command:', error);
                }
            });
        });
    }

    initializeAutoSave() {
        let timeout;
        this.editor.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => this.autoSave(), 2000);
        });
    }

    autoSave() {
        const content = this.editor.innerHTML;
        localStorage.setItem('draft-post', content);
    }
}

// Blog Post Management
class BlogManager {
    constructor() {
        this.saveButton = document.getElementById('savePost');
        this.initializeSaveFunction();
        this.loadDraft();
    }

    initializeSaveFunction() {
        this.saveButton.addEventListener('click', () => {
            const content = document.getElementById('editor').innerHTML;
            if (!content.trim()) {
                alert('Please add some content before saving.');
                return;
            }

            const post = {
                id: Date.now(),
                content,
                date: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };

            AppState.posts.push(post);
            this.savePosts();
            this.clearEditor();
            alert('Post saved successfully!');
        });
    }

    savePosts() {
        localStorage.setItem('blog-posts', JSON.stringify(AppState.posts));
        localStorage.removeItem('draft-post');
    }

    loadDraft() {
        const draft = localStorage.getItem('draft-post');
        if (draft) {
            document.getElementById('editor').innerHTML = draft;
        }
    }

    clearEditor() {
        document.getElementById('editor').innerHTML = '';
    }
}

// Calendar Management
class CalendarManager {
    constructor() {
        this.calendar = document.getElementById('calendarGrid');
        this.initializeCalendar();
    }

    initializeCalendar() {
        this.generateCalendar();
        this.loadEvents();
    }

    generateCalendar() {
        this.calendar.innerHTML = '';
        const date = new Date();
        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();

        // Add day labels
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            const dayLabel = document.createElement('div');
            dayLabel.className = 'calendar-day-label';
            dayLabel.textContent = day;
            this.calendar.appendChild(dayLabel);
        });

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            this.calendar.appendChild(emptyDay);
        }

        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            this.createDayElement(i);
        }
    }

    createDayElement(dayNumber) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        day.textContent = dayNumber;
        
        const dateKey = this.getDateKey(dayNumber);
        const existingEvent = AppState.events[dateKey];
        
        if (existingEvent) {
            this.styleEventDay(day, existingEvent);
        }

        day.addEventListener('click', () => this.handleDayClick(day, dayNumber));
        this.calendar.appendChild(day);
    }

    getDateKey(day) {
        const date = new Date();
        return `${date.getFullYear()}-${date.getMonth() + 1}-${day}`;
    }

    styleEventDay(dayElement, event) {
        dayElement.style.backgroundColor = 'var(--secondary-color)';
        dayElement.style.color = 'white';
        dayElement.setAttribute('title', event);
    }

    handleDayClick(dayElement, dayNumber) {
        const dateKey = this.getDateKey(dayNumber);
        const existingEvent = AppState.events[dateKey];

        const event = prompt('Add event for this day:', existingEvent || '');
        if (event === null) return; // User cancelled

        if (event.trim()) {
            AppState.events[dateKey] = event;
            this.styleEventDay(dayElement, event);
        } else {
            // Remove event if input is empty
            delete AppState.events[dateKey];
            dayElement.style.backgroundColor = '';
            dayElement.style.color = '';
            dayElement.removeAttribute('title');
        }

        localStorage.setItem('calendar-events', JSON.stringify(AppState.events));
    }

    loadEvents() {
        Object.entries(AppState.events).forEach(([dateKey, event]) => {
            const [, , day] = dateKey.split('-');
            const dayElement = this.calendar.children[parseInt(day) + 6]; // +6 for day labels
            if (dayElement) {
                this.styleEventDay(dayElement, event);
            }
        });
    }
}

// Goals Management
class GoalsManager {
    constructor() {
        this.goalsList = document.getElementById('goalsList');
        this.addButton = document.getElementById('addGoal');
        this.initializeGoals();
    }

    initializeGoals() {
        this.loadGoals();
        this.addButton.addEventListener('click', () => this.addNewGoal());
    }

    addNewGoal() {
        const goal = prompt('Enter your writing goal:');
        if (!goal?.trim()) return;

        const goalData = {
            id: Date.now(),
            text: goal,
            completed: false,
            createdAt: new Date().toISOString()
        };

        AppState.goals.push(goalData);
        this.saveGoals();
        this.createGoalElement(goalData);
    }

    createGoalElement(goalData) {
        const goalItem = document.createElement('div');
        goalItem.className = 'goal-item';
        goalItem.innerHTML = `
            <span>${goalData.text}</span>
            <div class="goal-actions">
                <input type="checkbox" ${goalData.completed ? 'checked' : ''}>
                <button class="delete-goal">×</button>
            </div>
        `;

        const checkbox = goalItem.querySelector('input');
        checkbox.addEventListener('change', () => {
            goalData.completed = checkbox.checked;
            goalItem.style.opacity = checkbox.checked ? '0.5' : '1';
            this.saveGoals();
        });

        const deleteButton = goalItem.querySelector('.delete-goal');
        deleteButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this goal?')) {
                AppState.goals = AppState.goals.filter(g => g.id !== goalData.id);
                this.saveGoals();
                goalItem.remove();
            }
        });

        this.goalsList.appendChild(goalItem);
    }

    loadGoals() {
        this.goalsList.innerHTML = '';
        AppState.goals.forEach(goal => this.createGoalElement(goal));
    }

    saveGoals() {
        localStorage.setItem('writing-goals', JSON.stringify(AppState.goals));
    }
}

// Mind Map Management
class MindMapManager {
    constructor() {
        this.container = document.getElementById('mindMapContainer');
        this.addButton = document.getElementById('addNode');
        this.draggedNode = null;
        this.initializeMindMap();
    }

    initializeMindMap() {
        this.loadNodes();
        this.addButton.addEventListener('click', () => this.addNewNode());
        this.setupDragAndDrop();
    }

    addNewNode() {
        const text = prompt('Enter node text:');
        if (!text?.trim()) return;

        const nodeData = {
            id: Date.now(),
            text,
            position: { x: 0, y: 0 }
        };

        AppState.mindMapNodes.push(nodeData);
        this.saveNodes();
        this.createNodeElement(nodeData);
    }

    createNodeElement(nodeData) {
        const node = document.createElement('div');
        node.className = 'node';
        node.textContent = nodeData.text;
        node.draggable = true;
        node.style.position = 'absolute';
        node.style.left = `${nodeData.position.x}px`;
        node.style.top = `${nodeData.position.y}px`;

        node.addEventListener('dragstart', e => {
            this.draggedNode = node;
            e.dataTransfer.setData('text/plain', '');
        });

        node.addEventListener('dblclick', () => {
            const newText = prompt('Edit node text:', nodeData.text);
            if (newText?.trim()) {
                nodeData.text = newText;
                node.textContent = newText;
                this.saveNodes();
            }
        });

        this.container.appendChild(node);
    }

    setupDragAndDrop() {
        this.container.addEventListener('dragover', e => {
            e.preventDefault();
        });

        this.container.addEventListener('drop', e => {
            e.preventDefault();
            if (!this.draggedNode) return;

            const rect = this.container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.draggedNode.style.left = `${x}px`;
            this.draggedNode.style.top = `${y}px`;

            const nodeData = AppState.mindMapNodes.find(
                n => n.text === this.draggedNode.textContent
            );
            if (nodeData) {
                nodeData.position = { x, y };
                this.saveNodes();
            }

            this.draggedNode = null;
        });
    }

    loadNodes() {
        this.container.innerHTML = '';
        AppState.mindMapNodes.forEach(node => this.createNodeElement(node));
    }

    saveNodes() {
        localStorage.setItem('mind-map-nodes', JSON.stringify(AppState.mindMapNodes));
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    new RichTextEditor();
    new BlogManager();
    new CalendarManager();
    new GoalsManager();
    new MindMapManager();
});
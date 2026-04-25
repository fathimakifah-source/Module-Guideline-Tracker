document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const themeSelect = document.getElementById('themeSelect');
    const taskList = document.getElementById('taskList');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const editMapBtn = document.getElementById('editMapBtn');
    const taskModal = document.getElementById('taskModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const taskForm = document.getElementById('taskForm');
    const nodesContainer = document.getElementById('nodesContainer');
    const mainPath = document.getElementById('mainPath');
    const progressPath = document.getElementById('progressPath');
    const mapBackground = document.getElementById('mapBackground');
    const mapWrapper = document.getElementById('mapWrapper');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    const forceDesktopBtn = document.getElementById('forceDesktopBtn');
    const forceMobileBtn = document.getElementById('forceMobileBtn');
    const atmosphereContainer = document.getElementById('atmosphereContainer');

    // --- PASSWORD PROTECTION LOGIC ---
    const passwordOverlay = document.getElementById('passwordOverlay');
    const gatePass = document.getElementById('gatePass');
    const unlockBtn = document.getElementById('unlockBtn');
    const errorMsg = document.getElementById('errorMsg');
    
    // Dynamic Secret Key
    let SECRET_KEY = localStorage.getItem('scholar_key') || 'KIFAH';

    // Check if already unlocked in this session
    if (sessionStorage.getItem('scholar_unlocked') === 'true') {
        passwordOverlay.classList.add('unlocked');
    }

    function attemptUnlock() {
        if (gatePass.value.trim().toUpperCase() === SECRET_KEY.toUpperCase()) {
            passwordOverlay.classList.add('unlocked');
            sessionStorage.setItem('scholar_unlocked', 'true');
        } else {
            errorMsg.classList.remove('hidden');
            gatePass.style.borderColor = '#8b0000';
            setTimeout(() => {
                errorMsg.classList.add('hidden');
                gatePass.style.borderColor = '#8c7151';
            }, 3000);
        }
    }

    unlockBtn.addEventListener('click', attemptUnlock);
    gatePass.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') attemptUnlock();
    });

    // --- CHANGE PASSWORD LOGIC ---
    const changePassModal = document.getElementById('changePassModal');
    const openChangePassBtn = document.getElementById('openChangePassBtn');
    const closePassModalBtn = document.getElementById('closePassModalBtn');
    const savePassBtn = document.getElementById('savePassBtn');
    const currentPassInput = document.getElementById('currentPassInput');
    const newPassInput = document.getElementById('newPassInput');
    const passModalMsg = document.getElementById('passModalMsg');

    openChangePassBtn.addEventListener('click', () => {
        changePassModal.classList.remove('hidden');
        currentPassInput.value = '';
        newPassInput.value = '';
        passModalMsg.classList.add('hidden');
    });

    closePassModalBtn.addEventListener('click', () => {
        changePassModal.classList.add('hidden');
    });

    savePassBtn.addEventListener('click', () => {
        const currentVal = currentPassInput.value.trim().toUpperCase();
        const newVal = newPassInput.value.trim();

        if (currentVal !== SECRET_KEY.toUpperCase()) {
            passModalMsg.textContent = "Current key is incorrect!";
            passModalMsg.classList.remove('hidden');
            return;
        }

        if (newVal.length < 3) {
            passModalMsg.textContent = "New key must be at least 3 characters!";
            passModalMsg.classList.remove('hidden');
            return;
        }

        SECRET_KEY = newVal;
        localStorage.setItem('scholar_key', newVal);
        passModalMsg.textContent = "New key forged successfully!";
        passModalMsg.style.color = "#2e7d32";
        passModalMsg.classList.remove('hidden');

        setTimeout(() => {
            changePassModal.classList.add('hidden');
            passModalMsg.style.color = "#8b0000";
        }, 1500);
    });

    // Journal Elements
    const journalOverlay = document.getElementById('journalOverlay');
    const closeJournalBtn = document.getElementById('closeJournalBtn');
    const journalTitle = document.getElementById('journalTitle');
    const journalNotes = document.getElementById('journalNotes');
    const journalDate = document.getElementById('journalDate');
    const subTaskListEl = document.getElementById('subTaskList');
    const newSubtaskInput = document.getElementById('newSubtaskInput');
    const addSubtaskBtn = document.getElementById('addSubtaskBtn');

    let isEditMode = false;
    let draggedNodeId = null;
    let activeJournalTaskId = null;

    // All supported themes
    const THEMES = ['theme-regency-core', 'theme-light-academia', 'theme-golden-age'];

    // Theme Logic
    const savedTheme = localStorage.getItem('module_tracker_theme') || 'theme-regency-core';
    updateThemeClass(savedTheme);
    themeSelect.value = savedTheme;
    updateMapBackgroundImage(savedTheme);

    const SECRETS_DATA = {
        'theme-regency-core': [
            { x: 15, y: 75, text: "A rose by any other name would smell as sweet." },
            { x: 82, y: 18, text: "Time flows like water through the gardens of memory." }
        ],
        'theme-light-academia': [
            { x: 50, y: 28, text: "Audentes Fortuna Iuvat — Fortune favors the bold." },
            { x: 12, y: 88, text: "There is no frigate like a book to take us lands away." }
        ],
        'theme-golden-age': [
            { x: 74, y: 14, text: "The stars are the geometry of the soul." },
            { x: 22, y: 68, text: "Seek knowledge from the cradle to the grave." }
        ]
    };

    themeSelect.addEventListener('change', (e) => {
        const themeId = e.target.value;
        if (isEditMode) {
            isEditMode = false;
            document.body.classList.remove('edit-mode');
            editMapBtn.classList.remove('active');
        }
        
        updateThemeClass(themeId);
        
        localStorage.setItem('module_tracker_theme', themeId);
        updateMapBackgroundImage(themeId);
        updateAtmosphere(themeId);
        renderSecrets(themeId);
        renderMap();
    });

    function updateThemeClass(theme) {
        THEMES.forEach(t => document.body.classList.remove(t));
        document.body.classList.add(theme);
    }

    function getMarkerIcon(markerType, themeId) {
        const set = NODE_ICONS[themeId] || NODE_ICONS['theme-light-academia'];
        return set[markerType] || set['books'];
    }

    function updateMapBackgroundImage(theme) {
        if (theme === 'theme-light-academia') {
            mapBackground.src = 'images/light_bg.png';
        } else if (theme === 'theme-golden-age') {
            mapBackground.src = 'images/golden_age_bg.png';
        } else {
            mapBackground.src = 'images/regency_bg.png';
        }
    }

    // View Mode Logic
    const savedViewMode = localStorage.getItem('module_tracker_view_mode') || 'desktop';
    applyViewMode(savedViewMode);

    forceDesktopBtn.addEventListener('click', () => {
        applyViewMode('desktop');
        localStorage.setItem('module_tracker_view_mode', 'desktop');
        requestAnimationFrame(drawPaths);
    });

    forceMobileBtn.addEventListener('click', () => {
        applyViewMode('mobile');
        localStorage.setItem('module_tracker_view_mode', 'mobile');
        requestAnimationFrame(drawPaths);
    });

    function applyViewMode(mode) {
        document.body.classList.remove('force-mobile', 'force-desktop');
        forceDesktopBtn.classList.remove('active');
        forceMobileBtn.classList.remove('active');
        if (mode === 'mobile') {
            document.body.classList.add('force-mobile');
            forceMobileBtn.classList.add('active');
        } else {
            document.body.classList.add('force-desktop');
            forceDesktopBtn.classList.add('active');
        }
    }

    // Menu Toggle Logic
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        menuToggle.classList.toggle('active');
    });

    // State
    let tasks = JSON.parse(localStorage.getItem('module_guideline_tasks_v4')) || [];
    
    if (tasks.length === 0) {
        tasks = [];
        for (let i = 1; i <= 16; i++) {
            const row = Math.floor((i-1)/4);
            const xPercent = (row % 2 === 0) ? 20 + ((i-1)%4 * 20) : 80 - ((i-1)%4 * 20);
            const yPercent = 5 + (i * 5.5);
            const positions = {};
            THEMES.forEach(theme => { positions[theme] = { x: xPercent, y: yPercent }; });
            tasks.push({
                id: Date.now().toString() + "-" + i,
                name: i === 16 ? 'Finishing Touches' : 'Week ' + i,
                desc: 'A new chapter in your journey.',
                completed: false,
                positions: positions,
                journalNotes: '',
                subtasks: []
            });
        }
        saveTasks();
    }

    function saveTasks() {
        localStorage.setItem('module_guideline_tasks_v4', JSON.stringify(tasks));
    }

    function getTaskPos(task) {
        const theme = themeSelect.value;
        return (task.positions && task.positions[theme]) ? task.positions[theme] : { x: 50, y: 50 };
    }

    function setTaskPos(task, x, y) {
        const theme = themeSelect.value;
        if (!task.positions) task.positions = {};
        task.positions[theme] = { x, y };
    }

    // Edit Mode
    editMapBtn.addEventListener('click', () => {
        isEditMode = !isEditMode;
        document.body.classList.toggle('edit-mode', isEditMode);
        editMapBtn.classList.toggle('active', isEditMode);
    });

    // Drag Logic
    mapWrapper.addEventListener('mousemove', (e) => {
        if (!isEditMode || !draggedNodeId) return;
        const rect = mapWrapper.getBoundingClientRect();
        let xP = ((e.clientX - rect.left) / rect.width) * 100;
        let yP = ((e.clientY - rect.top) / rect.height) * 100;
        const task = tasks.find(t => t.id === draggedNodeId);
        if (task) {
            setTaskPos(task, Math.max(0, Math.min(100, xP)), Math.max(0, Math.min(100, yP)));
            renderMap();
        }
    });

    mapWrapper.addEventListener('mouseup', () => { if (draggedNodeId) { saveTasks(); draggedNodeId = null; } });

    // Scholar's Journal Logic
    function openJournal(id) {
        activeJournalTaskId = id;
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        journalTitle.textContent = task.name;
        journalNotes.value = task.journalNotes || '';
        journalDate.textContent = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        renderSubtasks();
        updateJournalCompleteBtn(task.completed);
        journalOverlay.classList.remove('hidden');
    }

    function closeJournal() {
        if (activeJournalTaskId) {
            const task = tasks.find(t => t.id === activeJournalTaskId);
            if (task) {
                task.journalNotes = journalNotes.value;
                saveTasks();
                renderSidebar();
                renderMap();
            }
        }
        journalOverlay.classList.add('hidden');
        activeJournalTaskId = null;
    }

    const journalCompleteBtn = document.getElementById('journalCompleteBtn');
    journalCompleteBtn.addEventListener('click', () => {
        if (!activeJournalTaskId) return;
        const task = tasks.find(t => t.id === activeJournalTaskId);
        if (task) {
            task.completed = !task.completed;
            if (task.completed) createSparkleBurst(task);
            
            updateJournalCompleteBtn(task.completed);
            saveTasks();
            renderSidebar();
            renderMap();
        }
    });

    function updateJournalCompleteBtn(completed) {
        if (completed) {
            journalCompleteBtn.textContent = 'Sealed';
            journalCompleteBtn.classList.add('completed');
        } else {
            journalCompleteBtn.textContent = 'Seal Week';
            journalCompleteBtn.classList.remove('completed');
        }
    }

    closeJournalBtn.addEventListener('click', closeJournal);
    journalOverlay.addEventListener('click', (e) => { if (e.target === journalOverlay) closeJournal(); });

    function renderSubtasks() {
        subTaskListEl.innerHTML = '';
        const task = tasks.find(t => t.id === activeJournalTaskId);
        if (!task || !task.subtasks) return;

        task.subtasks.forEach((st, idx) => {
            const item = document.createElement('div');
            item.className = `subtask-item ${st.completed ? 'completed' : ''}`;
            item.innerHTML = `
                <input type="checkbox" ${st.completed ? 'checked' : ''}>
                <span>${st.text}</span>
                <button class="delete-subtask" style="margin-left: auto; background:none; border:none; cursor:pointer; color:#8b4513; opacity:0.5;">&times;</button>
            `;
            item.querySelector('input').addEventListener('change', (e) => {
                st.completed = e.target.checked;
                item.classList.toggle('completed', st.completed);
                saveTasks();
            });
            item.querySelector('.delete-subtask').addEventListener('click', () => {
                task.subtasks.splice(idx, 1);
                saveTasks();
                renderSubtasks();
            });
            subTaskListEl.appendChild(item);
        });
    }

    addSubtaskBtn.addEventListener('click', () => {
        const text = newSubtaskInput.value.trim();
        if (!text) return;
        const task = tasks.find(t => t.id === activeJournalTaskId);
        if (task) {
            if (!task.subtasks) task.subtasks = [];
            task.subtasks.push({ text, completed: false });
            saveTasks();
            newSubtaskInput.value = '';
            renderSubtasks();
        }
    });

    // Sidebar & Tasks
    function renderSidebar() {
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <div class="task-status"></div>
                <div class="task-info">
                    <h4>${task.name}</h4>
                    <p>${task.desc}</p>
                </div>
            `;
            li.addEventListener('click', () => toggleTask(task.id));
            li.addEventListener('contextmenu', (e) => { e.preventDefault(); openModal(task); });
            taskList.appendChild(li);
        });
    }

    function toggleTask(id) {
        if (isEditMode) return;
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            if (task.completed) createSparkleBurst(task);
            saveTasks();
            renderSidebar();
            renderMap();
        }
    }

    function createSparkleBurst(task) {
        const node = document.querySelector(`.map-node[data-id="${task.id}"]`);
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        for (let i = 0; i < 15; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.left = `${centerX}px`;
            sparkle.style.top = `${centerY}px`;
            sparkle.style.setProperty('--tx', `${(Math.random() - 0.5) * 100}px`);
            sparkle.style.setProperty('--ty', `${(Math.random() - 0.5) * 100}px`);
            sparkle.style.background = themeSelect.value === 'theme-golden-age' ? '#b08d57' : 'gold';
            document.body.appendChild(sparkle);
            setTimeout(() => sparkle.remove(), 800);
        }
    }

    // Map Render
    function renderMap() {
        nodesContainer.innerHTML = '';
        const tooltip = document.querySelector('.custom-tooltip') || document.createElement('div');
        if (!tooltip.classList.contains('custom-tooltip')) { tooltip.className = 'custom-tooltip'; document.body.appendChild(tooltip); }
        
        tasks.forEach(task => {
            const pos = getTaskPos(task);
            const node = document.createElement('div');
            node.className = `map-node ${task.completed ? 'completed' : ''}`;
            node.dataset.id = task.id;
            node.style.left = `${pos.x}%`;
            node.style.top = `${pos.y}%`;

            const label = document.createElement('div');
            label.className = 'node-label';
            label.textContent = task.name;
            node.appendChild(label);

            node.addEventListener('click', () => { 
                if (isEditMode) return;
                openJournal(task.id); 
            });
            node.addEventListener('mousedown', (e) => { if (isEditMode) { e.preventDefault(); draggedNodeId = task.id; } });
            
            node.addEventListener('mouseenter', () => {
                if (isEditMode) return;
                tooltip.innerHTML = `<h5>${task.name}</h5><p>${task.desc || 'Open Journal to read more.'}</p>`;
                tooltip.classList.add('visible');
            });
            node.addEventListener('mousemove', (e) => { tooltip.style.left = `${e.pageX + 15}px`; tooltip.style.top = `${e.pageY + 15}px`; });
            node.addEventListener('mouseleave', () => { tooltip.classList.remove('visible'); });

            nodesContainer.appendChild(node);
        });
        requestAnimationFrame(drawPaths);
    }

    function drawPaths() {
        const rect = mapWrapper.getBoundingClientRect();
        if (rect.width === 0) return;
        
        let pathD = '', progD = '', lastComp = -1;
        let points = tasks.map(t => {
            const p = getTaskPos(t);
            return { x: (p.x / 100) * rect.width, y: (p.y / 100) * rect.height };
        });

        tasks.forEach((t, i) => { if (t.completed) lastComp = i; });

        // Helper to generate a curved path string
        function generateCurve(pointList) {
            if (pointList.length < 2) return '';
            let d = `M ${pointList[0].x} ${pointList[0].y} `;
            for (let i = 1; i < pointList.length; i++) {
                const p1 = pointList[i-1];
                const p2 = pointList[i];
                // Calculate control point for a gentle "winding" curve
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                // Consistent "downward" bowing offset
                // Using abs(dx) ensures it always pushes down regardless of L/R direction
                const cx = midX + (Math.abs(dx) * 0.1); 
                const cy = midY + (Math.abs(dx) * 0.3 + 20); // Push downward in Y
                d += `Q ${cx} ${cy} ${p2.x} ${p2.y} `;
            }
            return d;
        }

        pathD = generateCurve(points);
        progD = generateCurve(points.slice(0, lastComp + 1));

        mainPath.setAttribute('d', pathD);
        progressPath.setAttribute('d', progD);

        // Ink Spread Animation Logic
        const totalLength = progressPath.getTotalLength();
        progressPath.style.strokeDasharray = totalLength;
        
        if (!progressPath.dataset.prevLength || progressPath.dataset.prevLength < totalLength) {
            progressPath.style.transition = 'none';
            progressPath.style.strokeDashoffset = totalLength;
            progressPath.getBoundingClientRect(); // Flush CSS
            progressPath.style.transition = 'stroke-dashoffset 3s cubic-bezier(0.4, 0, 0.2, 1)';
            progressPath.style.strokeDashoffset = '0';
        } else {
            progressPath.style.strokeDashoffset = '0';
        }
        
        progressPath.dataset.prevLength = totalLength;
    }

    window.addEventListener('resize', () => requestAnimationFrame(drawPaths));
    mapBackground.addEventListener('load', () => requestAnimationFrame(drawPaths));

    function updateAtmosphere(theme) {
        atmosphereContainer.innerHTML = '';
        if (theme === 'theme-regency-core') {
            const beam = document.createElement('div'); beam.className = 'sunbeam'; atmosphereContainer.appendChild(beam);
            for (let i = 0; i < 15; i++) {
                const p = document.createElement('div'); p.className = 'petal';
                p.style.left = `${Math.random()*100}%`; p.style.width = p.style.height = `${Math.random()*10+5}px`;
                p.style.animationDelay = `${Math.random()*10}s`; atmosphereContainer.appendChild(p);
            }
        } else if (theme === 'theme-light-academia') {
            for (let i = 0; i < 40; i++) {
                const d = document.createElement('div'); d.className = 'raindrop';
                d.style.left = `${Math.random()*100}%`; d.style.animationDelay = `${Math.random()}s`; atmosphereContainer.appendChild(d);
            }
            for (let i = 0; i < 10; i++) {
                const l = document.createElement('div'); l.className = 'leaf';
                l.style.left = `${Math.random()*100}%`; l.style.width = l.style.height = `${Math.random()*15+10}px`;
                l.style.animationDelay = `${Math.random()*12}s`; l.style.background = Math.random() > 0.5 ? '#8b4513' : '#d2691e';
                atmosphereContainer.appendChild(l);
            }
        } else if (theme === 'theme-golden-age') {
            for (let i = 0; i < 60; i++) {
                const s = document.createElement('div'); s.className = 'stardust';
                s.style.left = `${Math.random()*100}%`; s.style.top = `${Math.random()*100}%`;
                s.style.animationDelay = `${Math.random()*10}s`; atmosphereContainer.appendChild(s);
            }
        }
    }

    const pCont = document.querySelector('.particle-container') || document.createElement('div');
    if (!pCont.classList.contains('particle-container')) { pCont.className = 'particle-container'; mapWrapper.appendChild(pCont); }
    function createParticles() {
        pCont.innerHTML = '';
        for (let i = 0; i < 30; i++) {
            const m = document.createElement('div'); m.className = 'dust-mote';
            m.style.left = `${Math.random()*100}%`; m.style.top = `${Math.random()*100}%`;
            m.style.width = m.style.height = `${Math.random()*3+2}px`;
            m.style.animationDelay = `${Math.random()*15}s`; m.style.animationDuration = `${10+Math.random()*10}s`;
            pCont.appendChild(m);
        }
    }

    function openModal(task = null) {
        if (task) {
            document.getElementById('modalTitle').textContent = 'Edit Node Details';
            document.getElementById('taskId').value = task.id;
            document.getElementById('taskName').value = task.name;
            document.getElementById('taskDesc').value = task.desc;
        } else {
            document.getElementById('modalTitle').textContent = 'Add New Node';
            document.getElementById('taskId').value = '';
            document.getElementById('taskName').value = '';
            document.getElementById('taskDesc').value = '';
        }
        taskModal.classList.remove('hidden');
    }
    closeModalBtn.addEventListener('click', () => taskModal.classList.add('hidden'));
    addTaskBtn.addEventListener('click', () => openModal());
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('taskId').value, name = document.getElementById('taskName').value, desc = document.getElementById('taskDesc').value;
        if (id) { const t = tasks.find(t => t.id === id); t.name = name; t.desc = desc; }
        else { 
            const pos = {}; THEMES.forEach(th => { pos[th] = { x: 50, y: 50 }; });
            tasks.push({ id: Date.now().toString(), name, desc, completed: false, positions: pos, journalNotes: '', subtasks: [] });
        }
        saveTasks(); renderSidebar(); renderMap(); taskModal.classList.add('hidden');
    });

    function renderSecrets(themeId) {
        const secretsContainer = document.getElementById('secretsContainer');
        secretsContainer.innerHTML = '';
        const secrets = SECRETS_DATA[themeId] || [];

        secrets.forEach(secret => {
            const el = document.createElement('div');
            el.className = 'map-secret';
            el.style.left = `${secret.x}%`;
            el.style.top = `${secret.y}%`;
            el.addEventListener('click', () => showLore(secret.text));
            secretsContainer.appendChild(el);
        });
    }

    let loreTimeout;
    function showLore(text) {
        const lorePopup = document.getElementById('lorePopup');
        const loreText = document.getElementById('loreText');
        
        // Force hide and reset if already showing to trigger fresh transition
        lorePopup.classList.add('hidden');
        
        setTimeout(() => {
            clearTimeout(loreTimeout);
            loreText.textContent = text;
            lorePopup.classList.remove('hidden');

            loreTimeout = setTimeout(() => {
                lorePopup.classList.add('hidden');
            }, 5000);
        }, 100);
    }

    updateAtmosphere(savedTheme);
    renderSecrets(savedTheme);
    createParticles();
    renderSidebar();
    renderMap();
});

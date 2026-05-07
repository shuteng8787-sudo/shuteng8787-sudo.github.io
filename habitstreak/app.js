// HabitStreak - Don't Break the Chain
(function() {
    'use strict';

    const i18n = {
        en: { add_habit:'Add Habit', new_habit:'New Habit', habit_name:'What habit?', habit_color:'Color',
              start:'Start!', language:'Language', your_progress:'Your Progress', less:'Less', more:'More',
              day_streak:'day streak', days:'days', done:'Done! Tap to undo', today:'Today',
              empty_title:'No habits yet', empty_desc:'Tap the button below to start building your first habit.' },
        zh: { add_habit:'\u6dfb\u52a0\u4e60\u60ef', new_habit:'\u65b0\u4e60\u60ef', habit_name:'\u4ec0\u4e48\u4e60\u60ef\uff1f', habit_color:'\u989c\u8272',
              start:'\u5f00\u59cb\uff01', language:'\u8bed\u8a00', your_progress:'\u4f60\u7684\u8fdb\u5ea6', less:'\u5c11', more:'\u591a',
              day_streak:'\u5929\u8fde\u7eed', days:'\u5929', done:'\u5b8c\u6210\uff01\u70b9\u51fb\u53d6\u6d88', today:'\u4eca\u5929',
              empty_title:'\u8fd8\u6ca1\u6709\u4e60\u60ef', empty_desc:'\u70b9\u51fb\u4e0b\u65b9\u6309\u94ae\u5f00\u59cb\u5efa\u7acb\u4f60\u7684\u7b2c\u4e00\u4e2a\u4e60\u60ef\u3002' },
        es: { add_habit:'A\u00f1adir h\u00e1bito', new_habit:'Nuevo h\u00e1bito', habit_name:'\u00bfQu\u00e9 h\u00e1bito?', habit_color:'Color',
              start:'\u00a1Empezar!', language:'Idioma', your_progress:'Tu progreso', less:'Menos', more:'M\u00e1s',
              day_streak:'d\u00edas seguidos', days:'d\u00edas', done:'\u00a1Hecho!', today:'Hoy',
              empty_title:'Sin h\u00e1bitos', empty_desc:'Pulsa para a\u00f1adir tu primer h\u00e1bito.' },
        ja: { add_habit:'\u7fd2\u6163\u3092\u8ffd\u52a0', new_habit:'\u65b0\u3057\u3044\u7fd2\u6163', habit_name:'\u4f55\u3092\u7fd2\u6163\u5316\uff1f', habit_color:'\u8272',
              start:'\u30b9\u30bf\u30fc\u30c8\uff01', language:'\u8a00\u8a9e', your_progress:'\u9032\u6357', less:'\u5c11', more:'\u591a',
              day_streak:'\u65e5\u9023\u7d9a\u4e2d', days:'\u65e5', done:'\u5b8c\u4e86\uff01', today:'\u4eca\u65e5',
              empty_title:'\u7fd2\u6163\u306a\u3057', empty_desc:'\u4e0b\u306e\u30dc\u30bf\u30f3\u3092\u62bc\u3057\u3066\u7fd2\u6163\u3092\u8ffd\u52a0\u3002' },
        de: { add_habit:'Gewohnheit hinzuf\u00fcgen', new_habit:'Neue Gewohnheit', habit_name:'Welche Gewohnheit?', habit_color:'Farbe',
              start:'Los!', language:'Sprache', your_progress:'Dein Fortschritt', less:'Weniger', more:'Mehr',
              day_streak:'Tage in Folge', days:'Tage', done:'Erledigt!', today:'Heute',
              empty_title:'Keine Gewohnheiten', empty_desc:'Tippe um deine erste Gewohnheit zu erstellen.' },
        fr: { add_habit:'Ajouter habitude', new_habit:'Nouvelle habitude', habit_name:'Quelle habitude ?', habit_color:'Couleur',
              start:'Commencer !', language:'Langue', your_progress:'Progr\u00e8s', less:'Moins', more:'Plus',
              day_streak:'jours cons\u00e9cutifs', days:'jours', done:'Fait !', today:"Aujourd'hui",
              empty_title:'Pas d\'habitudes', empty_desc:'Appuyez pour ajouter votre premi\u00e8re habitude.' }
    };

    const SK = 'habitstreak_data';
    let state = { lang: 'en', habits: [] };
    // habits: [{ id, name, color, checks: { '2026-04-17': true } }]
    let selectedColor = '#059669';

    function load() { try { const r = localStorage.getItem(SK); if (r) state = { ...state, ...JSON.parse(r) }; } catch(e) {} }
    function save() { try { localStorage.setItem(SK, JSON.stringify(state)); } catch(e) {} }
    function t(k) { return (i18n[state.lang] && i18n[state.lang][k]) || i18n.en[k] || k; }
    function applyI18n() { document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.getAttribute('data-i18n'))); }
    function todayKey() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
    function genId() { return 'h' + Date.now().toString(36); }

    function getStreak(habit) {
        const checks = Object.keys(habit.checks).sort().reverse();
        if (checks.length === 0) return 0;
        let streak = 0;
        const d = new Date();
        // Start from today, go backwards
        for (let i = 0; i < 365; i++) {
            const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            if (habit.checks[key]) {
                streak++;
            } else if (i > 0) {
                break;
            }
            // If today not checked and i==0, skip to yesterday
            if (i === 0 && !habit.checks[key]) {
                // continue checking from yesterday
            } else if (!habit.checks[key] && i > 0) {
                break;
            }
            d.setDate(d.getDate() - 1);
        }
        return streak;
    }

    function render() {
        const list = document.getElementById('habitList');

        if (state.habits.length === 0) {
            list.innerHTML = `<div class="empty-state"><div class="empty-icon">&#128293;</div><h3>${t('empty_title')}</h3><p>${t('empty_desc')}</p></div>`;
            document.getElementById('heatmapSection').style.display = 'none';
            return;
        }

        const today = todayKey();
        list.innerHTML = '';

        state.habits.forEach(habit => {
            const checked = !!habit.checks[today];
            const streak = getStreak(habit);
            const total = Object.keys(habit.checks).length;

            const card = document.createElement('div');
            card.className = 'habit-card';
            card.innerHTML = `
                <button class="check-btn ${checked ? 'checked' : ''}" style="${checked ? 'background:' + habit.color : ''}" data-id="${habit.id}">
                    ${checked ? '&#10003;' : ''}
                </button>
                <div class="habit-info">
                    <div class="habit-name">${habit.name}</div>
                    <div class="habit-streak">
                        <strong>${streak}</strong> ${t('day_streak')} &middot; ${total} ${t('days')}
                    </div>
                </div>
                <button class="habit-delete" data-id="${habit.id}">&times;</button>
            `;

            card.querySelector('.check-btn').addEventListener('click', () => {
                if (habit.checks[today]) {
                    delete habit.checks[today];
                } else {
                    habit.checks[today] = true;
                }
                save();
                render();
            });

            card.querySelector('.habit-delete').addEventListener('click', () => {
                state.habits = state.habits.filter(h => h.id !== habit.id);
                save();
                render();
            });

            list.appendChild(card);
        });

        renderHeatmap();
    }

    function renderHeatmap() {
        const section = document.getElementById('heatmapSection');
        const container = document.getElementById('heatmapContainer');

        if (state.habits.length === 0) {
            section.style.display = 'none';
            return;
        }
        section.style.display = '';

        // Last 12 weeks
        const weeks = 12;
        const d = new Date();
        d.setDate(d.getDate() - (weeks * 7 - 1));
        // Align to Sunday
        d.setDate(d.getDate() - d.getDay());

        let html = '';
        for (let w = 0; w < weeks; w++) {
            html += '<div class="hm-week">';
            for (let dow = 0; dow < 7; dow++) {
                const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                const count = state.habits.filter(h => h.checks[key]).length;
                const max = state.habits.length || 1;
                const level = count === 0 ? 0 : count <= max * 0.25 ? 1 : count <= max * 0.5 ? 2 : count <= max * 0.75 ? 3 : 4;
                const colors = state.habits.map(h => h.color);
                const bg = count > 0 ? colors[count % colors.length] : '';
                html += `<div class="hm-cell hm-${level}" style="${count > 0 ? 'background:' + bg : ''}" title="${key}: ${count}"></div>`;
                d.setDate(d.getDate() + 1);
            }
            html += '</div>';
        }
        container.innerHTML = html;
    }

    function init() {
        load();
        applyI18n();
        render();

        // Add habit
        document.getElementById('btnAddHabit').addEventListener('click', () => {
            document.getElementById('inputHabitName').value = '';
            selectedColor = '#059669';
            updateColorSel();
            document.getElementById('modalAddHabit').style.display = 'flex';
        });

        document.getElementById('btnCloseAdd').addEventListener('click', () => {
            document.getElementById('modalAddHabit').style.display = 'none';
        });
        document.getElementById('modalAddHabit').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
        });

        document.querySelectorAll('.color-opt').forEach(opt => {
            opt.addEventListener('click', () => { selectedColor = opt.getAttribute('data-color'); updateColorSel(); });
        });

        document.getElementById('btnSaveHabit').addEventListener('click', () => {
            const name = document.getElementById('inputHabitName').value.trim();
            if (!name) return;
            state.habits.push({ id: genId(), name, color: selectedColor, checks: {} });
            save();
            render();
            document.getElementById('modalAddHabit').style.display = 'none';
        });

        // Language
        document.getElementById('btnLang').addEventListener('click', () => {
            document.getElementById('modalLang').style.display = 'flex';
        });
        document.getElementById('btnCloseLang').addEventListener('click', () => {
            document.getElementById('modalLang').style.display = 'none';
        });
        document.getElementById('modalLang').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
        });
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                state.lang = btn.getAttribute('data-lang');
                save(); applyI18n(); render();
                document.getElementById('modalLang').style.display = 'none';
            });
        });
    }

    function updateColorSel() {
        document.querySelectorAll('.color-opt').forEach(o => {
            o.classList.toggle('selected', o.getAttribute('data-color') === selectedColor);
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();

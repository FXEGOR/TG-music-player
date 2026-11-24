var vmpSections = [
    { id: 'all', name: 'Все треки', sub: 'Вся медиатека', icon: '🎧', bg: 'linear-gradient(135deg, #1b4332, #081c15)' },
    { id: 'tyan', name: 'Тян', sub: 'Атмосферное', icon: '🌸', bg: 'linear-gradient(135deg, #590d22, #2b0912)' },
    { id: 'postpunk', name: 'Пост-панк', sub: 'Холодный звук', icon: '🌧️', bg: 'linear-gradient(135deg, #1d3557, #0d1b2a)' },
    { id: 'youtube', name: 'ВК Видео', sub: 'Миксы и клипы', icon: '📺', bg: 'linear-gradient(135deg, #003566, #001d3d)' }
];

var defaultCover = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzI4MjgyOCIvPjx0ZXh0IHg9IjUwIiB5PSI2NSIgZm9udC1zaXplPSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+OtTwvdGV4dD48L3N2Zz4=';
var vkPrefix = atob('aHR0cHM6Ly92ay5jb20vdmlkZW9fZXh0LnBocD9vaWQ9');
var savedTracks = [];
var myMusic = (typeof customMusic !== 'undefined') ? customMusic : [];
var tracks = myMusic.slice();

var activeTab = 'media', currentPl = 'all', currentList = [], noteFilter = 'all', noteGrid = false, idx = 0, repeatMode = 0;
var audio = document.getElementById('audio'), ytBox = document.getElementById('yt-container'), ytFrame = document.getElementById('yt-frame');

var statusMap = {
    plan: { label: '📋 В планах', color: '#888888' },
    listen: { label: '🎧 Слушаю', color: '#3b82f6' },
    done: { label: '✅ Прослушано', color: '#10b981' },
    fav: { label: '⭐ Любимое', color: '#f59e0b' },
    drop: { label: '🗑 Брошено', color: '#ef4444' }
};

function cleanName(name) {
    var str = Array.isArray(name) ? name.join('') : String(name || 'Без названия');
    return str.replace(/\.(mp3|m4a|ogg|wav)$/i, '').replace(/,\s*$/, '');
}

function loadCloudTracks(cb) {
    if (window.Telegram && Telegram.WebApp && Telegram.WebApp.CloudStorage) {
        Telegram.WebApp.CloudStorage.getItem('my_tg_tracks', function(err, val) {
            if (!err && val) { try { savedTracks = JSON.parse(val); } catch(e) { savedTracks = []; } }
            else { savedTracks = JSON.parse(localStorage.getItem('my_tg_tracks') || '[]'); }
            cb();
        });
    } else {
        savedTracks = JSON.parse(localStorage.getItem('my_tg_tracks') || '[]');
        cb();
    }
}

function saveCloudTracks() {
    var dataStr = JSON.stringify(savedTracks);
    localStorage.setItem('my_tg_tracks', dataStr);
    if (window.Telegram && Telegram.WebApp && Telegram.WebApp.CloudStorage) {
        Telegram.WebApp.CloudStorage.setItem('my_tg_tracks', dataStr);
    }
}

function init() {
    if (window.Telegram && Telegram.WebApp) { Telegram.WebApp.ready(); Telegram.WebApp.expand(); }
    setTheme(localStorage.getItem('fx_theme') || 'default');
    document.getElementById('mini-cover').src = defaultCover;
    document.getElementById('big-cover').src = defaultCover;

    var grid = document.getElementById('vmp-playlists');
    vmpSections.forEach(function(s) {
        var d = document.createElement('div');
        d.className = 'vmp-card';
        d.style.background = s.bg;
        d.innerHTML = '<span class="v-title">' + s.name + '</span><span class="v-sub">' + s.sub + '</span><span class="v-bg-icon">' + s.icon + '</span>';
        d.onclick = function() { selectMediaSection(s.id, s.name); };
        grid.appendChild(d);
    });

    var startTab = localStorage.getItem('fx_start_tab') || 'media';
    updateStartButtons(startTab);

    loadCloudTracks(function() {
        tracks = myMusic.concat(savedTracks);
        selectMediaSection('all', 'Все треки');
        switchTab(startTab);
    });
}

function switchTab(tab) {
    activeTab = tab;
    document.getElementById('tab-media').style.display = (tab === 'media') ? 'block' : 'none';
    document.getElementById('tab-notes').style.display = (tab === 'notes') ? 'block' : 'none';
    document.getElementById('tab-settings').style.display = (tab === 'settings') ? 'block' : 'none';
    document.getElementById('nav-media').classList.toggle('active', tab === 'media');
    document.getElementById('nav-notes').classList.toggle('active', tab === 'notes');
    document.getElementById('nav-settings').classList.toggle('active', tab === 'settings');
    var titles = { media: 'Медиа', notes: 'Артисты и заметки', settings: 'Настройки' };
    document.getElementById('page-title').innerText = titles[tab];
    document.getElementById('header-btns').style.display = (tab === 'settings') ? 'none' : 'flex';
    document.getElementById('search-wrap').classList.remove('open');
    document.getElementById('search-input').value = '';
    renderCurrentTab();
}

function toggleSearch() {
    var w = document.getElementById('search-wrap');
    w.classList.toggle('open');
    if (w.classList.contains('open')) document.getElementById('search-input').focus();
    else { document.getElementById('search-input').value = ''; renderCurrentTab(); }
}

function onAddClick() { if (activeTab === 'notes') openNoteModal(); else openVideoModal(); }
function renderCurrentTab() { if (activeTab === 'media') renderMediaList(); else if (activeTab === 'notes') renderNotesList(); }
function editNote(id) {
    var item = savedTracks.find(function(t) { return String(t.id) === String(id); });
    if (!item) return;
    document.getElementById('note-modal-title').innerText = 'Редактировать карточку';
    document.getElementById('note-edit-id').value = item.id;
    document.getElementById('note-name').value = item.title || '';
    document.getElementById('note-status').value = item.status || (item.done ? 'done' : 'plan');
    document.getElementById('note-score').value = item.score || '';
    document.getElementById('note-tag').value = item.artist || '';
    document.getElementById('note-link').value = item.url || '';
    document.getElementById('note-modal').style.display = 'flex';
}

function saveNote() {
    var editId = document.getElementById('note-edit-id').value, name = document.getElementById('note-name').value.trim();
    var status = document.getElementById('note-status').value, score = document.getElementById('note-score').value;
    var tag = document.getElementById('note-tag').value.trim(), link = document.getElementById('note-link').value.trim();
    if (!name) { alert('Введи имя артиста или название!'); return; }
    if (editId) {
        savedTracks.forEach(function(t) { if (String(t.id) === String(editId)) { t.title = name; t.status = status; t.score = score; t.artist = tag; t.url = link; } });
    } else {
        savedTracks.unshift({ id: Date.now(), type: 'note', title: name, status: status, score: score, artist: tag, pl: 'notes', url: link });
    }
    saveCloudTracks(); tracks = myMusic.concat(savedTracks); closeNoteModal(); renderNotesList();
}

function saveYtVideo() {
    var url = document.getElementById('yt-url-input').value.trim(), title = document.getElementById('yt-title-input').value.trim() || 'ВК Видео';
    var match = url.match(/video(-?\d+_\d+)/), videoId = match ? match.pop() : null;
    if (!videoId) { alert('Не удалось распознать ссылку!'); return; }
    savedTracks.push({ type: 'yt', title: title, artist: 'ВК Видео', pl: 'youtube', ytId: videoId, custom: true });
    saveCloudTracks(); tracks = myMusic.concat(savedTracks);
    document.getElementById('yt-url-input').value = ''; document.getElementById('yt-title-input').value = '';
    closeVideoModal(); selectMediaSection(currentPl, document.getElementById('media-sub-title').innerText);
}

function deleteNote(id) { savedTracks = savedTracks.filter(function(t) { return String(t.id) !== String(id); }); saveCloudTracks(); tracks = myMusic.concat(savedTracks); renderNotesList(); }
function deleteVideo(vid) { savedTracks = savedTracks.filter(function(t) { return t.ytId !== vid; }); saveCloudTracks(); tracks = myMusic.concat(savedTracks); selectMediaSection(currentPl, document.getElementById('media-sub-title').innerText); }

function exportData() {
    var str = JSON.stringify(savedTracks);
    if (navigator.clipboard) { navigator.clipboard.writeText(str); alert('Код скопирован! Отправь его себе в Избранное.'); }
    else { prompt('Скопируй этот код:', str); }
}

function importData() {
    var str = prompt('Вставь скопированный код:');
    if (!str) return;
    try {
        var parsed = JSON.parse(str), added = 0;
        if (Array.isArray(parsed)) {
            parsed.forEach(function(item) {
                var exists = savedTracks.some(function(ex) { return (item.type === 'yt' && ex.ytId === item.ytId) || (item.type === 'note' && (ex.id === item.id || (ex.title === item.title && ex.url === item.url))); });
                if (!exists) { savedTracks.unshift(item); added++; }
            });
            saveCloudTracks(); tracks = myMusic.concat(savedTracks); renderCurrentTab();
            alert('Синхронизация завершена! Новых записей: ' + added);
        }
    } catch(e) { alert('Ошибка: неверный формат кода.'); }
}

init();
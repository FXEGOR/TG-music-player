var playlists = [
    { id: 'all', name: 'Все треки', icon: '🎧', bg: '#1db954' },
    { id: 'notes', name: 'Артисты и заметки', icon: '📝', bg: '#f59e0b' },
    { id: 'tyan', name: 'Тян', icon: '🌸', bg: '#ff758c' },
    { id: 'postpunk', name: 'Пост-панк', icon: '🌧️', bg: '#4b6cb7' },
    { id: 'youtube', name: 'ВК Видео', icon: '📺', bg: '#0077ff' }
];

var defaultCover = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzI4MjgyOCIvPjx0ZXh0IHg9IjUwIiB5PSI2NSIgZm9udC1zaXplPSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+OtTwvdGV4dD48L3N2Zz4=';
var vkPrefix = atob('aHR0cHM6Ly92ay5jb20vdmlkZW9fZXh0LnBocD9vaWQ9');
var savedTracks = [];
var myMusic = (typeof customMusic !== 'undefined') ? customMusic : [];
var tracks = myMusic.slice();

var currentPl = 'all';
var currentList = tracks.filter(function(t) { return t.type !== 'note'; });
var idx = 0, repeatMode = 0;
var audio = document.getElementById('audio');
var ytBox = document.getElementById('yt-container');
var ytFrame = document.getElementById('yt-frame');

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
    var plBox = document.getElementById('playlists');
    playlists.forEach(function(p) {
        var d = document.createElement('div');
        d.className = 'card';
        d.innerHTML = '<div class="cover" style="background:' + p.bg + '">' + p.icon + '</div><p>' + p.name + '</p>';
        d.onclick = function() { filterTracks(p.id, p.name); };
        plBox.appendChild(d);
    });
    loadCloudTracks(function() {
        tracks = myMusic.concat(savedTracks);
        filterTracks('all', 'Все треки');
    });
}

var noteFilter = 'all';
var statusMap = {
    plan: { label: '📋 В планах', color: '#888' },
    listen: { label: '🎧 Слушаю', color: '#3b82f6' },
    done: { label: '✅ Прослушано', color: '#10b981' },
    fav: { label: '⭐ Любимое', color: '#f59e0b' },
    drop: { label: '🗑 Брошено', color: '#ef4444' }
};

function setNoteFilter(st) {
    noteFilter = st;
    filterTracks('notes', 'Артисты и заметки');
}

function filterTracks(id, name) {
    currentPl = id;
    document.getElementById('pl-title').innerText = name;
    document.getElementById('search-input').value = '';
    document.getElementById('note-filters').style.display = (id === 'notes') ? 'flex' : 'none';
    if (id === 'all') {
        currentList = tracks.filter(function(t) { return t.type !== 'note'; });
    } else if (id === 'notes') {
        currentList = tracks.filter(function(t) {
            if (t.type !== 'note') return false;
            var st = t.status || (t.done ? 'done' : 'plan');
            return noteFilter === 'all' || st === noteFilter;
        });
    } else {
        currentList = tracks.filter(function(t) { return t.pl === id; });
    }
    renderTracks();
}

function searchTracks() {
    var q = document.getElementById('search-input').value.toLowerCase().trim();
    var base = (currentPl === 'all') ? tracks.filter(function(t) { return t.type !== 'note'; }) : tracks.filter(function(t) { return t.pl === currentPl; });
    currentList = !q ? base.slice() : base.filter(function(t) {
        return cleanName(t.title).toLowerCase().indexOf(q) !== -1 || (t.artist && t.artist.toLowerCase().indexOf(q) !== -1);
    });
    renderTracks();
}

function renderTracks() {
    var tBox = document.getElementById('tracks');
    tBox.innerHTML = '';
    currentList.forEach(function(t, i) {
        var d = document.createElement('div');
        if (t.type === 'note') {
            var stKey = t.status || (t.done ? 'done' : 'plan');
            var stObj = statusMap[stKey] || statusMap.plan;
            d.className = 'track';
            d.style.borderLeft = '4px solid ' + stObj.color;

            var info = document.createElement('div');
            info.style.cssText = 'flex:1; min-width:0;';
            var topLine = document.createElement('div');
            topLine.style.cssText = 'font-weight:bold; font-size:14px; margin-bottom:4px;';
            topLine.textContent = cleanName(t.title) + (t.score ? '  ★ ' + t.score + '/10' : '');
            
            var subLine = document.createElement('div');
            subLine.style.cssText = 'font-size:12px; color:var(--text-sub);';
            subLine.textContent = stObj.label + (t.artist ? ' • ' + t.artist : '');
            
            info.appendChild(topLine);
            info.appendChild(subLine);
            d.appendChild(info);

            if (t.url) {
                var linkBtn = document.createElement('a');
                linkBtn.href = t.url; linkBtn.target = '_blank'; linkBtn.innerText = '🔗';
                linkBtn.style.cssText = 'text-decoration:none; font-size:17px; padding:4px;';
                linkBtn.onclick = function(e) { e.stopPropagation(); };
                d.appendChild(linkBtn);
            }
            var editBtn = document.createElement('button');
            editBtn.innerText = '✏️';
            editBtn.style.cssText = 'background:none; border:none; font-size:15px; padding:4px; cursor:pointer;';
            editBtn.onclick = function(e) { e.stopPropagation(); editNote(t.id); };
            d.appendChild(editBtn);

            var delN = document.createElement('button');
            delN.innerText = '✖';
            delN.style.cssText = 'background:none; border:none; color:#777; font-size:15px; padding:4px; cursor:pointer;';
            delN.onclick = function(e) { e.stopPropagation(); deleteNote(t.id); };
            d.appendChild(delN);
            tBox.appendChild(d);
            return;
        }

        var isCurrent = (t.type === 'audio' && audio.src && decodeURI(audio.src).indexOf(t.url) !== -1) || (t.type === 'yt' && ytFrame.src && ytFrame.src.indexOf(t.ytId.split('_').pop()) !== -1);
        d.className = 'track' + (isCurrent ? ' active' : '');
        var img = document.createElement('img');
        img.className = 't-img'; img.loading = 'lazy'; img.src = t.cover ? t.cover : defaultCover;
        d.appendChild(img);
        var titleSpan = document.createElement('span');
        titleSpan.textContent = cleanName(t.title); titleSpan.style.flex = '1';
        d.appendChild(titleSpan);
        if (t.custom) {
            var del = document.createElement('button');
            del.innerText = '✖';
            del.style.cssText = 'background:none; border:none; color:#777; font-size:16px; padding:4px 8px; cursor:pointer;';
            del.onclick = function(e) { e.stopPropagation(); deleteVideo(t.ytId); };
            d.appendChild(del);
        }
        d.onclick = function() { play(i); };
        tBox.appendChild(d);
    });
}

function play(i) {
    idx = i;
    var t = currentList[idx];
    if (!t || t.type === 'note') return;
    var cov = t.cover ? t.cover : defaultCover, titleClean = cleanName(t.title);
    document.getElementById('mini-cover').src = cov; document.getElementById('big-cover').src = cov;
    document.getElementById('now-playing').textContent = titleClean; document.getElementById('big-title').textContent = titleClean;
    document.getElementById('big-artist').textContent = t.artist || '';
    if (t.type === 'yt') {
        audio.pause(); audio.src = ''; ytBox.style.display = 'block';
        var ids = t.ytId.split('_');
        ytFrame.src = vkPrefix + ids.shift() + '&id=' + ids.shift() + '&hd=2&autoplay=1';
        syncBtns('📺');
    } else {
        ytBox.style.display = 'none'; ytFrame.src = ''; audio.src = t.url; audio.play(); syncBtns('⏸');
    }
    renderTracks();
}

function syncBtns(icon) { document.getElementById('play-btn').innerText = icon; document.getElementById('big-play-btn').innerText = icon; }
function togglePlay() { if (ytBox.style.display === 'block') return; if (!audio.src && currentList.length) { play(0); return; } if (audio.paused) { audio.play(); syncBtns('⏸'); } else { audio.pause(); syncBtns('▶'); } }
function nextTrack() { if (!currentList.length) return; if (idx + 1 < currentList.length) play(idx + 1); else if (repeatMode === 1) play(0); else { audio.pause(); syncBtns('▶'); } }
function prevTrack() { if (!currentList.length) return; if (audio.currentTime > 3) audio.currentTime = 0; else play((idx - 1 + currentList.length) % currentList.length); }

function shuffleQueue() {
    if (!currentList.length) return;
    var cur = audio.src ? currentList[idx] : null;
    for (var i = currentList.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = currentList[i]; currentList[i] = currentList[j]; currentList[j] = tmp; }
    if (cur) { var ni = currentList.indexOf(cur); if (ni > 0) { currentList.splice(ni, 1); currentList.unshift(cur); } idx = 0; renderTracks(); } else play(0);
}

function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    var b1 = document.getElementById('mini-rep-btn'), b2 = document.getElementById('big-rep-btn'), icon = (repeatMode === 2) ? '🔂' : '🔁';
    b1.innerText = icon; b2.innerText = icon; b1.classList.toggle('active', repeatMode > 0); b2.classList.toggle('active', repeatMode > 0);
}

audio.addEventListener('ended', function() { if (repeatMode === 2) { audio.currentTime = 0; audio.play(); } else nextTrack(); });
audio.addEventListener('timeupdate', function() {
    if (!audio.duration) return;
    var pct = (audio.currentTime / audio.duration) * 100;
    document.getElementById('seek-bar').value = pct; document.getElementById('big-seek-bar').value = pct;
    var c = fmtTime(audio.currentTime), d = fmtTime(audio.duration);
    document.getElementById('time-cur').innerText = c; document.getElementById('big-time-cur').innerText = c;
    document.getElementById('time-dur').innerText = d; document.getElementById('big-time-dur').innerText = d;
});
function seekAudio(val) { if (audio.duration) audio.currentTime = (val / 100) * audio.duration; }
function fmtTime(sec) { var m = Math.floor(sec / 60), s = Math.floor(sec % 60); return m + ':' + (s < 10 ? '0' : '') + s; }
function setTheme(t) { document.body.classList.toggle('amoled-theme', t === 'amoled'); localStorage.setItem('fx_theme', t); }
function openSettings() { document.getElementById('settings-modal').style.display = 'flex'; }
function closeSettings() { document.getElementById('settings-modal').style.display = 'none'; }
function toggleVolPopup() { document.getElementById('vol-popup').classList.toggle('open'); }
function changeVolume() { var v = document.getElementById('vol-slider').value; audio.volume = v; document.getElementById('vol-btn').innerText = (v == 0) ? '🔇' : (v < 0.5 ? '🔉' : '🔊'); }
function openFull() { document.getElementById('full-screen').classList.add('open'); }
function closeFull() { document.getElementById('full-screen').classList.remove('open'); }
function openModal() { document.getElementById('add-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('add-modal').style.display = 'none'; }
function openNoteModal() {
    document.getElementById('note-modal-title').innerText = 'Новая карточка';
    document.getElementById('note-edit-id').value = '';
    document.getElementById('note-name').value = '';
    document.getElementById('note-status').value = 'plan';
    document.getElementById('note-score').value = '';
    document.getElementById('note-tag').value = '';
    document.getElementById('note-link').value = '';
    document.getElementById('note-modal').style.display = 'flex';
}
function closeNoteModal() { document.getElementById('note-modal').style.display = 'none'; }

function editNote(id) {
    var item = savedTracks.find(function(t) { return t.id === id; });
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
    var editId = document.getElementById('note-edit-id').value;
    var name = document.getElementById('note-name').value.trim();
    var status = document.getElementById('note-status').value;
    var score = document.getElementById('note-score').value;
    var tag = document.getElementById('note-tag').value.trim();
    var link = document.getElementById('note-link').value.trim();
    if (!name) { alert('Введи имя артиста или название!'); return; }

    if (editId) {
        savedTracks.forEach(function(t) {
            if (String(t.id) === String(editId)) {
                t.title = name; t.status = status; t.score = score; t.artist = tag; t.url = link;
            }
        });
    } else {
        savedTracks.unshift({ id: Date.now(), type: 'note', title: name, status: status, score: score, artist: tag, pl: 'notes', url: link });
    }
    saveCloudTracks(); tracks = myMusic.concat(savedTracks);
    closeNoteModal(); filterTracks('notes', 'Артисты и заметки');
}

init();



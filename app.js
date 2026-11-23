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
var idx = 0;
var repeatMode = 0;
var audio = document.getElementById('audio');
var ytBox = document.getElementById('yt-container');
var ytFrame = document.getElementById('yt-frame');

function cleanName(name) {
    var str = Array.isArray(name) ? name.join('') : String(name || 'Без названия');
    return str.replace(/\.(mp3|m4a|ogg|wav)$/i, '').replace(/,\s*$/, '');
}

function loadCloudTracks(callback) {
    if (window.Telegram && Telegram.WebApp && Telegram.WebApp.CloudStorage) {
        Telegram.WebApp.CloudStorage.getItem('my_tg_tracks', function(err, val) {
            if (!err && val) {
                try { savedTracks = JSON.parse(val); } catch(e) { savedTracks = []; }
            } else {
                savedTracks = JSON.parse(localStorage.getItem('my_tg_tracks') || '[]');
            }
            callback();
        });
    } else {
        savedTracks = JSON.parse(localStorage.getItem('my_tg_tracks') || '[]');
        callback();
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
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
    }
    var savedTheme = localStorage.getItem('fx_theme') || 'default';
    setTheme(savedTheme);
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

function filterTracks(id, name) {
    currentPl = id;
    document.getElementById('pl-title').innerText = name;
    document.getElementById('search-input').value = '';
    if (id === 'all') {
        currentList = tracks.filter(function(t) { return t.type !== 'note'; });
    } else {
        currentList = tracks.filter(function(t) { return t.pl === id; });
    }
    renderTracks();
}

function searchTracks() {
    var q = document.getElementById('search-input').value.toLowerCase().trim();
    var base = (currentPl === 'all') ? tracks.filter(function(t) { return t.type !== 'note'; }) : tracks.filter(function(t) { return t.pl === currentPl; });
    if (!q) {
        currentList = base.slice();
    } else {
        currentList = base.filter(function(t) {
            return cleanName(t.title).toLowerCase().indexOf(q) !== -1 || (t.artist && t.artist.toLowerCase().indexOf(q) !== -1);
        });
    }
    renderTracks();
}
function renderTracks() {
    var tBox = document.getElementById('tracks');
    tBox.innerHTML = '';
    currentList.forEach(function(t, i) {
        var d = document.createElement('div');
        if (t.type === 'note') {
            d.className = 'track';
            d.style.opacity = t.done ? '0.5' : '1';
            var check = document.createElement('button');
            check.innerText = t.done ? '✅' : '⬜';
            check.style.cssText = 'background:none; border:none; font-size:18px; cursor:pointer; padding:0;';
            check.onclick = function(e) { e.stopPropagation(); toggleNoteDone(t.id); };
            d.appendChild(check);

            var info = document.createElement('div');
            info.style.cssText = 'flex:1; min-width:0;';
            info.innerHTML = '<div style="font-weight:bold; font-size:14px;' + (t.done ? 'text-decoration:line-through;' : '') + '">' + cleanName(t.title) + '</div>' +
                             '<div style="font-size:12px; color:var(--text-sub); margin-top:2px;">' + (t.artist || '') + '</div>';
            d.appendChild(info);

            if (t.url) {
                var linkBtn = document.createElement('a');
                linkBtn.href = t.url;
                linkBtn.target = '_blank';
                linkBtn.innerText = '🔗';
                linkBtn.style.cssText = 'text-decoration:none; font-size:18px; padding:4px;';
                linkBtn.onclick = function(e) { e.stopPropagation(); };
                d.appendChild(linkBtn);
            }

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
        img.className = 't-img';
        img.loading = 'lazy';
        img.src = t.cover ? t.cover : defaultCover;
        d.appendChild(img);
        var titleSpan = document.createElement('span');
        titleSpan.innerText = cleanName(t.title);
        titleSpan.style.flex = '1';
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
    var cov = t.cover ? t.cover : defaultCover;
    var titleClean = cleanName(t.title);
    document.getElementById('mini-cover').src = cov;
    document.getElementById('big-cover').src = cov;
    document.getElementById('now-playing').innerText = titleClean;
    document.getElementById('big-title').innerText = titleClean;
    document.getElementById('big-artist').innerText = t.artist || '';

    if (t.type === 'yt') {
        audio.pause();
        audio.src = '';
        ytBox.style.display = 'block';
        var ids = t.ytId.split('_');
        ytFrame.src = vkPrefix + ids.shift() + '&id=' + ids.shift() + '&hd=2&autoplay=1';
        syncBtns('📺');
    } else {
        ytBox.style.display = 'none';
        ytFrame.src = '';
        audio.src = t.url;
        audio.play();
        syncBtns('⏸');
    }
    renderTracks();
}

function syncBtns(icon) {
    document.getElementById('play-btn').innerText = icon;
    document.getElementById('big-play-btn').innerText = icon;
}

function togglePlay() {
    if (ytBox.style.display === 'block') return;
    if (!audio.src && currentList.length > 0) { play(0); return; }
    if (audio.paused) { audio.play(); syncBtns('⏸'); }
    else { audio.pause(); syncBtns('▶'); }
}

function nextTrack() {
    if (!currentList.length) return;
    if (idx + 1 < currentList.length) { play(idx + 1); }
    else if (repeatMode === 1) { play(0); }
    else { audio.pause(); syncBtns('▶'); }
}

function prevTrack() {
    if (!currentList.length) return;
    if (audio.currentTime > 3) audio.currentTime = 0;
    else play((idx - 1 + currentList.length) % currentList.length);
}

function shuffleQueue() {
    if (!currentList.length) return;
    var currentTrack = audio.src ? currentList[idx] : null;
    for (var i = currentList.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = currentList[i];
        currentList[i] = currentList[j];
        currentList[j] = temp;
    }
    if (currentTrack) {
        var newIdx = currentList.indexOf(currentTrack);
        if (newIdx > 0) { currentList.splice(newIdx, 1); currentList.unshift(currentTrack); }
        idx = 0;
        renderTracks();
    } else { play(0); }
}

function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    var b1 = document.getElementById('mini-rep-btn');
    var b2 = document.getElementById('big-rep-btn');
    var icon = (repeatMode === 2) ? '🔂' : '🔁';
    b1.innerText = icon; b2.innerText = icon;
    b1.classList.toggle('active', repeatMode > 0);
    b2.classList.toggle('active', repeatMode > 0);
}

audio.addEventListener('ended', function() {
    if (repeatMode === 2) { audio.currentTime = 0; audio.play(); }
    else { nextTrack(); }
});

audio.addEventListener('timeupdate', function() {
    if (!audio.duration) return;
    var pct = (audio.currentTime / audio.duration) * 100;
    document.getElementById('seek-bar').value = pct;
    document.getElementById('big-seek-bar').value = pct;
    var curStr = fmtTime(audio.currentTime);
    var durStr = fmtTime(audio.duration);
    document.getElementById('time-cur').innerText = curStr;
    document.getElementById('big-time-cur').innerText = curStr;
    document.getElementById('time-dur').innerText = durStr;
    document.getElementById('big-time-dur').innerText = durStr;
});

function seekAudio(val) { if (audio.duration) audio.currentTime = (val / 100) * audio.duration; }
function fmtTime(sec) { var m = Math.floor(sec / 60); var s = Math.floor(sec % 60); return m + ':' + (s < 10 ? '0' : '') + s; }
function setTheme(theme) { document.body.classList.toggle('amoled-theme', theme === 'amoled'); localStorage.setItem('fx_theme', theme); }
function openSettings() { document.getElementById('settings-modal').style.display = 'flex'; }
function closeSettings() { document.getElementById('settings-modal').style.display = 'none'; }
function toggleVolPopup() { document.getElementById('vol-popup').classList.toggle('open'); }
function changeVolume() { var v = document.getElementById('vol-slider').value; audio.volume = v; document.getElementById('vol-btn').innerText = (v == 0) ? '🔇' : (v < 0.5 ? '🔉' : '🔊'); }
function openFull() { document.getElementById('full-screen').classList.add('open'); }
function closeFull() { document.getElementById('full-screen').classList.remove('open'); }
function openModal() { document.getElementById('add-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('add-modal').style.display = 'none'; }
function openNoteModal() { document.getElementById('note-modal').style.display = 'flex'; }
function closeNoteModal() { document.getElementById('note-modal').style.display = 'none'; }

function saveYtVideo() {
    var url = document.getElementById('yt-url-input').value.trim();
    var title = document.getElementById('yt-title-input').value.trim() || 'ВК Видео';
    var match = url.match(/video(-?\d+_\d+)/);
    var videoId = match ? match.pop() : null;
    if (!videoId) { alert('Не удалось распознать ссылку! Нужна ссылка вида ://vk.com'); return; }
    savedTracks.push({ type: 'yt', title: title, artist: 'ВК Видео', pl: 'youtube', ytId: videoId, custom: true });
    saveCloudTracks();
    tracks = myMusic.concat(savedTracks);
    document.getElementById('yt-url-input').value = '';
    document.getElementById('yt-title-input').value = '';
    closeModal();
    filterTracks(currentPl, document.getElementById('pl-title').innerText);
}

function saveNote() {
    var name = document.getElementById('note-name').value.trim();
    var tag = document.getElementById('note-tag').value.trim() || 'На будущее';
    var link = document.getElementById('note-link').value.trim();
    if (!name) { alert('Введи имя артиста или название!'); return; }
    savedTracks.unshift({ id: Date.now(), type: 'note', title: name, artist: tag, pl: 'notes', url: link, done: false });
    saveCloudTracks();
    tracks = myMusic.concat(savedTracks);
    document.getElementById('note-name').value = '';
    document.getElementById('note-tag').value = '';
    document.getElementById('note-link').value = '';
    closeNoteModal();
    filterTracks('notes', 'Артисты и заметки');
}

function toggleNoteDone(id) {
    savedTracks.forEach(function(t) { if (t.id === id) t.done = !t.done; });
    saveCloudTracks();
    tracks = myMusic.concat(savedTracks);
    filterTracks(currentPl, document.getElementById('pl-title').innerText);
}

function deleteNote(id) {
    savedTracks = savedTracks.filter(function(t) { return t.id !== id; });
    saveCloudTracks();
    tracks = myMusic.concat(savedTracks);
    filterTracks(currentPl, document.getElementById('pl-title').innerText);
}

function deleteVideo(vid) {
    savedTracks = savedTracks.filter(function(t) { return t.ytId !== vid; });
    saveCloudTracks();
    tracks = myMusic.concat(savedTracks);
    filterTracks(currentPl, document.getElementById('pl-title').innerText);
}

function exportData() {
    var str = JSON.stringify(savedTracks);
    if (navigator.clipboard) {
        navigator.clipboard.writeText(str);
        alert('Код скопирован! Отправь его себе в Избранное и вставь на другом устройстве.');
    } else {
        prompt('Скопируй этот код вручную:', str);
    }
}

function importData() {
    var str = prompt('Вставь скопированный код списка:');
    if (!str) return;
    try {
        var parsed = JSON.parse(str);
        if (Array.isArray(parsed)) {
            var addedCount = 0;
            parsed.forEach(function(item) {
                var exists = savedTracks.some(function(existing) {
                    if (item.type === 'yt' && existing.type === 'yt') {
                        return existing.ytId === item.ytId;
                    }
                    if (item.type === 'note' && existing.type === 'note') {
                        return existing.id === item.id || (existing.title === item.title && existing.url === item.url);
                    }
                    return false;
                });
                if (!exists) {
                    savedTracks.unshift(item);
                    addedCount++;
                }
            });
            saveCloudTracks();
            tracks = myMusic.concat(savedTracks);
            filterTracks(currentPl, document.getElementById('pl-title').innerText);
            closeSettings();
            alert('Синхронизация завершена! Новых записей добавлено: ' + addedCount);
        }
    } catch(e) { alert('Ошибка: неверный формат кода.'); }
}

init();

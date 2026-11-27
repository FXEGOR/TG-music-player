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
var vkPlayerObj = null;
var currentReleaseId = null;

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
    grid.innerHTML = '';
    vmpSections.forEach(function(s) {
        var d = document.createElement('div');
        d.className = 'vmp-card';
        d.style.background = s.bg;
        d.innerHTML = '<span class="v-title">' + s.name + '</span><span class="v-sub">' + s.sub + '</span><span class="v-bg-icon">' + s.icon + '</span>';
        d.onclick = function() { selectMediaSection(s.id, s.name); };
        grid.appendChild(d);
    });

    var startTab = localStorage.getItem('fx_start_tab') || 'home'; // Теперь по умолчанию Главная
    updateStartButtons(startTab);

    loadCloudTracks(function() {
        tracks = myMusic.concat(savedTracks);
        selectMediaSection('all', 'Все треки');
        switchTab(startTab);
    });
}

function switchTab(tab) {
    activeTab = tab;
    var tabs = ['home', 'media', 'notes', 'settings'];
    tabs.forEach(function(t) {
        var el = document.getElementById('tab-' + t);
        if (el) el.style.display = (t === tab) ? 'block' : 'none';
        var navEl = document.getElementById('nav-' + t);
        if (navEl) navEl.classList.toggle('active', t === tab);
    });

    if (tab === 'settings') renderProfile();

    var titles = { home: 'Главная', media: 'Медиа', notes: 'Артисты и заметки', settings: 'Настройки' };
    document.getElementById('page-title').innerText = titles[tab] || 'FXMusic';
    document.getElementById('header-btns').style.display = (tab === 'settings' || tab === 'home') ? 'none' : 'flex';
    document.getElementById('search-wrap').classList.remove('open');
    document.getElementById('search-input').value = '';
    
    if (tab === 'home') renderHomePage();
    else renderCurrentTab();
}

function toggleSearch() {
    var w = document.getElementById('search-wrap');
    w.classList.toggle('open');
    if (w.classList.contains('open')) document.getElementById('search-input').focus();
    else { document.getElementById('search-input').value = ''; renderCurrentTab(); }
}

function onAddClick() { if (activeTab === 'notes') openNoteModal(); else openVideoModal(); }
function renderCurrentTab() { 
    if (activeTab === 'media') renderMediaList(); 
    else if (activeTab === 'notes') renderNotesList(); 
}

function seekAudio(val) { if (audio.duration) audio.currentTime = (val / 100) * audio.duration; }
function fmtTime(sec) { var m = Math.floor(sec / 60), s = Math.floor(sec % 60); return m + ':' + (s < 10 ? '0' : '') + s; }
function setTheme(t) {
    document.body.classList.toggle('amoled-theme', t === 'amoled');
    localStorage.setItem('fx_theme', t);
    document.getElementById('th-default').classList.toggle('active', t !== 'amoled');
    document.getElementById('th-amoled').classList.toggle('active', t === 'amoled');
}
function setStartTab(tab) { localStorage.setItem('fx_start_tab', tab); updateStartButtons(tab); }
function updateStartButtons(tab) { document.getElementById('st-media').classList.toggle('active', tab === 'media'); document.getElementById('st-notes').classList.toggle('active', tab === 'notes'); }
function openFull() { document.getElementById('full-player').classList.add('open'); }
function closeFull() { document.getElementById('full-player').classList.remove('open'); }
function openVideoModal() { document.getElementById('video-modal').style.display = 'flex'; }
function closeVideoModal() { document.getElementById('video-modal').style.display = 'none'; }
function openNoteModal() {
    document.getElementById('note-modal-title').innerText = 'Новая карточка';
    document.getElementById('note-edit-id').value = ''; document.getElementById('note-name').value = '';
    document.getElementById('note-status').value = 'plan'; document.getElementById('note-score').value = '';
    document.getElementById('note-tag').value = ''; document.getElementById('note-link').value = '';
    document.getElementById('note-review').value = '';
    document.getElementById('note-modal').style.display = 'flex';
}
function closeNoteModal() { document.getElementById('note-modal').style.display = 'none'; }

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
    document.getElementById('note-cover').value = item.cover || '';
    document.getElementById('note-review').value = item.review || '';
    document.getElementById('note-modal').style.display = 'flex';
}

function saveNote() {
    var editId = document.getElementById('note-edit-id').value, name = document.getElementById('note-name').value.trim();
    var status = document.getElementById('note-status').value, score = document.getElementById('note-score').value;
    var tag = document.getElementById('note-tag').value.trim(), link = document.getElementById('note-link').value.trim();
    var cover = document.getElementById('note-cover').value;
    var review = document.getElementById('note-review').value.trim();
    
    if (!name) { alert('Введи имя артиста или название!'); return; }
    
    if (editId) {
        savedTracks.forEach(function(t) { 
            if (String(t.id) === String(editId)) { 
                t.title = name; t.status = status; t.score = score; t.artist = tag; t.url = link; t.cover = cover; t.review = review;
            } 
        });
    } else {
        savedTracks.unshift({ id: Date.now(), type: 'note', title: name, status: status, score: score, artist: tag, pl: 'notes', url: link, cover: cover, review: review });
    }
    saveCloudTracks(); tracks = myMusic.concat(savedTracks); closeNoteModal(); renderNotesList();
}

function deleteNote(id) { savedTracks = savedTracks.filter(function(t) { return String(t.id) !== String(id); }); saveCloudTracks(); tracks = myMusic.concat(savedTracks); renderNotesList(); }
function deleteVideo(vid) { savedTracks = savedTracks.filter(function(t) { return t.ytId !== vid; }); saveCloudTracks(); tracks = myMusic.concat(savedTracks); selectMediaSection(currentPl, document.getElementById('media-sub-title').innerText); }

function saveYtVideo() {
    var url = document.getElementById('yt-url-input').value.trim(), title = document.getElementById('yt-title-input').value.trim() || 'ВК Видео';
    var match = url.match(/video(-?\d+_\d+)/), videoId = match ? match.pop() : null;
    if (!videoId) { alert('Не удалось распознать ссылку!'); return; }
    savedTracks.push({ type: 'yt', title: title, artist: 'ВК Видео', pl: 'youtube', ytId: videoId, custom: true });
    saveCloudTracks(); tracks = myMusic.concat(savedTracks);
    document.getElementById('yt-url-input').value = ''; document.getElementById('yt-title-input').value = '';
    closeVideoModal(); selectMediaSection(currentPl, document.getElementById('media-sub-title').innerText);
}

function selectMediaSection(id, name) {
    currentPl = id;
    document.getElementById('media-sub-title').innerText = name;
    currentList = (id === 'all') ? tracks.filter(function(x) { return x.type !== 'note'; }) : tracks.filter(function(x) { return x.pl === id; });
    renderMediaList();
}

function renderMediaList() {
    var box = document.getElementById('media-list');
    box.innerHTML = '';
    var q = document.getElementById('search-input').value.toLowerCase().trim();
    var list = !q ? currentList : currentList.filter(function(x) { return cleanName(x.title).toLowerCase().indexOf(q) !== -1; });
    list.forEach(function(x) {
        var rIdx = currentList.indexOf(x), d = document.createElement('div');
        var isCur = (x.type === 'audio' && audio.src && decodeURI(audio.src).indexOf(x.url) !== -1) || (x.type === 'yt' && ytFrame.src && ytFrame.src.indexOf(x.ytId.split('_').pop()) !== -1);
        d.className = 'track-item' + (isCur ? ' active' : '');
        var img = document.createElement('img');
        img.className = 't-img'; img.loading = 'lazy'; img.src = x.cover ? x.cover : defaultCover;
        d.appendChild(img);
        var sp = document.createElement('span');
        sp.textContent = cleanName(x.title); sp.style.cssText = 'flex:1; font-size:14px;';
        d.appendChild(sp);
        if (x.custom) {
            var del = document.createElement('button');
            del.innerText = '✖'; del.style.cssText = 'background:none; border:none; color:#777; font-size:16px; padding:6px; cursor:pointer;';
            del.onclick = function(e) { e.stopPropagation(); deleteVideo(x.ytId); };
            d.appendChild(del);
        }
        d.onclick = function() { play(rIdx); };
        box.appendChild(d);
    });
}

function setNoteFilter(st, btn) {
    noteFilter = st;
    document.querySelectorAll('#note-pills .pill').forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    renderNotesList();
}

function toggleNoteView() {
    noteGrid = !noteGrid;
    document.getElementById('notes-list').classList.toggle('grid-view', noteGrid);
    document.getElementById('view-btn').innerText = noteGrid ? '☰' : '⊞';
    renderNotesList();
}

function renderNotesList() {
    var box = document.getElementById('notes-list');
    box.innerHTML = '';
    var q = document.getElementById('search-input').value.toLowerCase().trim();
    var notes = tracks.filter(function(x) {
        if (x.type !== 'note') return false;
        var st = x.status || (x.done ? 'done' : 'plan');
        if (noteFilter !== 'all' && st !== noteFilter) return false;
        if (q && cleanName(x.title).toLowerCase().indexOf(q) === -1 && (!x.artist || x.artist.toLowerCase().indexOf(q) === -1)) return false;
        return true;
    });
    notes.forEach(function(x) {
        var stKey = x.status || (x.done ? 'done' : 'plan'), stObj = statusMap[stKey] || statusMap.plan;
        var d = document.createElement('div');
        d.className = 'track-item'; d.style.borderLeft = '4px solid ' + stObj.color;
        
        var covSrc = x.cover ? x.cover : defaultCover;
        var img = document.createElement('img');
        img.className = 't-img note-cover-img'; img.src = covSrc; img.loading = 'lazy';
        d.appendChild(img);

        var info = document.createElement('div');
        info.style.cssText = 'flex:1; min-width:0; width:100%;';
        var top = document.createElement('div');
        top.style.cssText = 'font-weight:700; font-size:14px; margin-bottom:4px;';
        top.textContent = cleanName(x.title) + (x.score ? '  ★ ' + x.score + '/10' : '');
        var sub = document.createElement('div');
        sub.style.cssText = 'font-size:12px; color:var(--text-sub);';
        sub.textContent = stObj.label + (x.artist ? ' • ' + x.artist : '');
        info.appendChild(top); info.appendChild(sub); d.appendChild(info);
        var act = document.createElement('div');
        act.style.cssText = 'display:flex; align-items:center; gap:2px;';
        if (x.url) {
            var a = document.createElement('a');
            a.href = x.url; a.target = '_blank'; a.innerText = '🔗'; a.style.cssText = 'text-decoration:none; font-size:17px; padding:6px;';
            a.onclick = function(e) { e.stopPropagation(); };
            act.appendChild(a);
        }
        var ed = document.createElement('button');
        ed.innerText = '✏️'; ed.style.cssText = 'background:none; border:none; font-size:16px; padding:6px; cursor:pointer;';
        ed.onclick = function(e) { e.stopPropagation(); editNote(x.id); };
        act.appendChild(ed);
        var dl = document.createElement('button');
        dl.innerText = '✖'; dl.style.cssText = 'background:none; border:none; color:#777; font-size:16px; padding:6px; cursor:pointer;';
        dl.onclick = function(e) { e.stopPropagation(); deleteNote(x.id); };
        act.appendChild(dl);
        
        d.appendChild(act); 
        d.onclick = function() { openReleaseDetails(x.id); };
        box.appendChild(d);
    });
}

function play(i) {
    idx = i;
    var x = currentList[idx];
    if (!x || x.type === 'note') return;
    var cov = x.cover ? x.cover : defaultCover, tc = cleanName(x.title);
    document.getElementById('mini-player').classList.add('visible');
    document.getElementById('mini-cover').src = cov; document.getElementById('big-cover').src = cov;
    document.getElementById('mini-title').textContent = tc; document.getElementById('big-title').textContent = tc;
    document.getElementById('big-artist').textContent = x.artist || '';
    if (x.type === 'yt') {
        audio.pause(); audio.src = ''; ytBox.style.display = 'block';
        var ids = x.ytId.split('_');
        ytFrame.onload = function() {
            if (window.VK && VK.VideoPlayer) {
                vkPlayerObj = VK.VideoPlayer(ytFrame);
                vkPlayerObj.on('ended', function() {
                    if (repeatMode === 2) { play(idx); } else { nextTrack(); }
                });
            }
        };
        ytFrame.src = vkPrefix + ids.shift() + '&id=' + ids.shift() + '&hd=2&autoplay=1&js_api=1';
        syncBtns('📺');
    } else {
        ytBox.style.display = 'none'; ytFrame.onload = null; ytFrame.src = '';
        audio.src = x.url; audio.play(); syncBtns('⏸');
    }
    renderMediaList();
}
function syncBtns(ic) { document.getElementById('mini-play-btn').innerText = ic; document.getElementById('big-play-btn').innerText = ic; }
function togglePlay() { if (ytBox.style.display === 'block') return; if (!audio.src && currentList.length) { play(0); return; } if (audio.paused) { audio.play(); syncBtns('⏸'); } else { audio.pause(); syncBtns('▶'); } }
function nextTrack() { if (!currentList.length) return; if (idx + 1 < currentList.length) play(idx + 1); else if (repeatMode === 1) play(0); else { audio.pause(); syncBtns('▶'); } }
function prevTrack() { if (!currentList.length) return; if (audio.currentTime > 3) audio.currentTime = 0; else play((idx - 1 + currentList.length) % currentList.length); }
function shuffleQueue() {
    if (!currentList.length) return;
    var cur = audio.src ? currentList[idx] : null;
    for (var i = currentList.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = currentList[i]; currentList[i] = currentList[j]; currentList[j] = tmp; }
    if (cur) { var ni = currentList.indexOf(cur); if (ni > 0) { currentList.splice(ni, 1); currentList.unshift(cur); } idx = 0; renderMediaList(); } else play(0);
}
function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    var b = document.getElementById('big-rep-btn');
    b.innerText = (repeatMode === 2) ? '🔂' : '🔁';
    b.classList.toggle('active', repeatMode > 0);
}
audio.addEventListener('ended', function() { if (repeatMode === 2) { audio.currentTime = 0; audio.play(); } else nextTrack(); });
audio.addEventListener('timeupdate', function() {
    if (!audio.duration) return;
    document.getElementById('big-seek').value = (audio.currentTime / audio.duration) * 100;
    var c = fmtTime(audio.currentTime), d = fmtTime(audio.duration);
    document.getElementById('mini-time').innerText = c + ' / ' + d;
    document.getElementById('big-cur').innerText = c; document.getElementById('big-dur').innerText = d;
});

var searchTimer = null;
var apiBase = atob('aHR0cHM6Ly9pdHVuZXMuYXBwbGUuY29tL3NlYXJjaD90ZXJtPQ==');
function searchCatalog(q) {
    clearTimeout(searchTimer);
    var box = document.getElementById('api-results');
    if (q.trim().length < 2) { box.style.display = 'none'; return; }
    searchTimer = setTimeout(function() {
        var url = apiBase + encodeURIComponent(q) + '&entity=album,musicArtist&limit=6&country=ru';
        fetch(url).then(function(r) { return r.json(); }).then(function(data) {
            box.innerHTML = '';
            if (!data.results || !data.results.length) { box.style.display = 'none'; return; }
            box.style.display = 'block';
            data.results.forEach(function(item) {
                var row = document.createElement('div');
                row.style.cssText = 'display:flex; align-items:center; gap:8px; padding:8px; border-bottom:1px solid var(--border); cursor:pointer;';
                var title = item.collectionName || item.artistName;
                var sub = item.collectionName ? (item.artistName + ' • ' + (item.primaryGenreName || '')) : (item.primaryGenreName || 'Исполнитель');
                var cov = item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : '';
                if (cov) {
                    var im = document.createElement('img');
                    im.src = item.artworkUrl100; im.style.cssText = 'width:36px; height:36px; border-radius:6px; object-fit:cover;';
                    row.appendChild(im);
                }
                var inf = document.createElement('div');
                inf.style.cssText = 'min-width:0; flex:1;';
                inf.innerHTML = '<div style="font-size:13px; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + title + '</div><div style="font-size:11px; color:var(--text-sub);">' + sub + '</div>';
                row.appendChild(inf);
                row.onclick = function() {
                    document.getElementById('note-name').value = item.collectionName ? (item.artistName + ' - ' + item.collectionName) : item.artistName;
                    document.getElementById('note-tag').value = item.primaryGenreName || '';
                    document.getElementById('note-cover').value = cov;
                    if (item.collectionViewUrl || item.artistLinkUrl) document.getElementById('note-link').value = item.collectionViewUrl || item.artistLinkUrl;
                    box.style.display = 'none';
                };
                box.appendChild(row);
            });
        }).catch(function() { box.style.display = 'none'; });
    }, 400);
}

var homeDataLoaded = false;

function renderHomePage() {
    if (homeDataLoaded) return;
    homeDataLoaded = true;
    
    fetchITunes('new', 'album', 'home-new-releases');
    fetchITunes('top', 'musicArtist', 'home-top-artists');
    fetchITunes('hits', 'album', 'home-top-albums');
    fetchITunes('indie', 'album', 'home-recommended');
    
    renderUserPlaylists();
    renderGlobalMixes();
}

function fetchITunes(query, entity, containerId) {
    var url = 'https://itunes.apple.com/search?term=' + encodeURIComponent(query) + '&entity=' + entity + '&limit=10&country=ru';
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '<div style="color:var(--text-sub); font-size:12px;">Загрузка...</div>';

    fetch(url).then(function(r) { return r.json(); }).then(function(data) {
        container.innerHTML = '';
        if (!data.results || !data.results.length) {
            container.innerHTML = '<div style="color:var(--text-sub); font-size:12px;">Нет данных</div>';
            return;
        }
        data.results.forEach(function(item) {
            var title = item.collectionName || item.artistName || 'Без названия';
            var sub = item.artistName || (item.primaryGenreName || '');
            var cover = item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '300x300bb') : defaultCover;

            var card = document.createElement('div');
            card.className = 'home-card';
            card.innerHTML = '<img src="' + cover + '"><div class="h-title">' + title + '</div><div class="h-sub">' + sub + '</div>';
            card.onclick = function() {
                var previewItem = {
                    id: 'preview_' + Date.now(),
                    type: 'note',
                    title: item.collectionName ? (item.artistName + ' - ' + item.collectionName) : item.artistName,
                    artist: item.primaryGenreName || 'Жанр не указан',
                    cover: cover,
                    url: item.collectionViewUrl || item.artistLinkUrl || '',
                    score: '',
                    status: 'plan',
                    review: ''
                };
                openReleaseDetails(previewItem.id, previewItem, true);
            };
            container.appendChild(card);
        });
    }).catch(function() {
        container.innerHTML = '<div style="color:var(--text-sub); font-size:12px;">Ошибка загрузки</div>';
    });
}

function renderGlobalMixes() {
    var box = document.getElementById('home-global-mixes');
    if (!box) return;
    box.innerHTML = '';
    
    var globalMixes = myMusic.filter(function(t) { return t.type === 'yt'; });
    
    if (globalMixes.length === 0) {
        box.innerHTML = '<div style="color:var(--text-sub); font-size:12px; text-align:center; padding:10px;">Пока нет глобальных миксов.</div>';
        return;
    }

    globalMixes.forEach(function(mix) {
        var card = document.createElement('div');
        card.className = 'home-card';
        card.innerHTML = '<img src="' + defaultCover + '"><div class="h-title">' + mix.title + '</div><div class="h-sub">Микс</div>';
        card.onclick = function() {
            currentList = [mix];
            play(0);
        };
        box.appendChild(card);
    });
}

var userPlaylists = JSON.parse(localStorage.getItem('fx_playlists') || '[]');

function renderUserPlaylists() {
    var box = document.getElementById('home-playlists');
    if (!box) return;
    box.innerHTML = '';
    if (userPlaylists.length === 0) {
        box.innerHTML = '<div style="color:var(--text-sub); font-size:12px; text-align:center; padding:10px;">У вас пока нет плейлистов.</div>';
        return;
    }
    userPlaylists.forEach(function(pl, index) {
        var d = document.createElement('div');
        d.className = 'track-item';
        d.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:10px;';
        var info = document.createElement('div');
        info.innerHTML = '<div style="font-weight:600; font-size:14px;">' + pl.title + '</div><div style="font-size:11px; color:var(--text-sub);">' + pl.service + '</div>';
        var act = document.createElement('div');
        var a = document.createElement('a');
        a.href = pl.url; a.target = '_blank'; a.innerText = '🔗 Открыть'; a.style.cssText = 'color:var(--accent); font-size:12px; text-decoration:none; margin-right:10px;';
        var del = document.createElement('button');
        del.innerText = '✖'; del.style.cssText = 'background:none; border:none; color:#777; cursor:pointer;';
        del.onclick = function(e) { e.stopPropagation(); if(confirm('Удалить?')) { userPlaylists.splice(index, 1); localStorage.setItem('fx_playlists', JSON.stringify(userPlaylists)); renderUserPlaylists(); } };
        act.appendChild(a); act.appendChild(del);
        d.appendChild(info); d.appendChild(act);
        box.appendChild(d);
    });
}

function openPlaylistModal() {
    var title = prompt('Название плейлиста:');
    if (!title) return;
    var url = prompt('Ссылка на плейлист (ВК, Яндекс, YouTube, Spotify, SoundCloud):');
    if (!url) return;
    var service = 'Другое';
    if (url.includes('vk.com')) service = 'ВКонтакте';
    else if (url.includes('music.yandex')) service = 'Яндекс.Музыка';
    else if (url.includes('spotify.com')) service = 'Spotify';
    else if (url.includes('soundcloud.com')) service = 'SoundCloud';
    else if (url.includes('youtube.com') || url.includes('youtu.be')) service = 'YouTube';
    userPlaylists.push({ title: title, url: url, service: service });
    localStorage.setItem('fx_playlists', JSON.stringify(userPlaylists));
    renderUserPlaylists();

function renderProfile() {
    var nameEl = document.getElementById('prof-name');
    var avatarEl = document.getElementById('prof-avatar');
    var statsEl = document.getElementById('prof-stats');

    if (!nameEl || !avatarEl || !statsEl) return;

    if (!window.Telegram || !Telegram.WebApp) {
        nameEl.textContent = 'Ошибка: Скрипт TG не загружен';
        avatarEl.src = 'https://ui-avatars.com/api/?name=X&background=ff0000&color=fff&rounded=true';
        return;
    }

    var user = Telegram.WebApp.initDataUnsafe ? Telegram.WebApp.initDataUnsafe.user : null;

    if (user) {
        var fullName = (user.first_name || '') + (user.last_name ? ' ' + user.last_name : '');
        nameEl.textContent = fullName.trim() || 'Пользователь Telegram';
        if (user.photo_url) {
            avatarEl.src = user.photo_url;
        } else {
            avatarEl.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(fullName || 'U') + '&background=1db954&color=fff&rounded=true';
        }
    } else {
        nameEl.textContent = 'Данные не получены';
        avatarEl.src = 'https://ui-avatars.com/api/?name=?&background=333333&color=fff&rounded=true';
        var debugInfo = Telegram.WebApp.initData ? 'Есть initData' : 'Пустой initData';
        statsEl.textContent = 'Открыто не по прямой ссылке. ' + debugInfo;
        return;
    }

    var notesCount = tracks.filter(function(x) { return x.type === 'note'; }).length;
    var playlistsCount = userPlaylists ? userPlaylists.length : 0;
    statsEl.textContent = 'Заметок: ' + notesCount + ' • Плейлистов: ' + playlistsCount;
}

var SYNC_URL = 'https://FXEGOR.pythonanywhere.com';

function syncToBot() {
    var statusEl = document.getElementById('sync-status');
    if (!window.Telegram || !Telegram.WebApp.initDataUnsafe.user) {
        if (statusEl) statusEl.textContent = 'Ошибка: открой через кнопку Menu в боте';
        return;
    }
    var userId = Telegram.WebApp.initDataUnsafe.user.id;
    var dataStr = JSON.stringify(savedTracks);
    if (statusEl) statusEl.textContent = 'Сохранение в облако...';

    fetch(SYNC_URL + '/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, data: dataStr })
    })
    .then(function(res) { return res.json(); })
    .then(function(res) {
        if (res.status === 'ok') {
            if (statusEl) statusEl.textContent = '✅ База сохранена в облаке!';
            alert('Успех! Твоя база сохранена на сервере.');
        } else {
            if (statusEl) statusEl.textContent = '❌ Ошибка сохранения';
        }
    })
    .catch(function(e) { 
        if (statusEl) statusEl.textContent = '❌ Ошибка сети';
        console.error(e);
    });
}

function syncFromBot() {
    var statusEl = document.getElementById('sync-status');
    if (!window.Telegram || !Telegram.WebApp.initDataUnsafe.user) {
        if (statusEl) statusEl.textContent = 'Ошибка: открой через кнопку Menu в боте';
        return;
    }
    var userId = Telegram.WebApp.initDataUnsafe.user.id;
    if (statusEl) statusEl.textContent = 'Загрузка из облака...';

    fetch(SYNC_URL + '/api/get/' + userId)
    .then(function(res) { return res.json(); })
    .then(function(res) {
        if (res.status === 'ok' && res.data) {
            var parsed = JSON.parse(res.data);
            if (Array.isArray(parsed)) {
                savedTracks = parsed;
                localStorage.setItem('my_tg_tracks', JSON.stringify(savedTracks));
                if (window.Telegram && Telegram.WebApp.CloudStorage) {
                    Telegram.WebApp.CloudStorage.setItem('my_tg_tracks', JSON.stringify(savedTracks));
                }
                tracks = myMusic.concat(savedTracks);
                renderCurrentTab();
                renderProfile();
                if (statusEl) statusEl.textContent = '✅ База загружена!';
                alert('Успех! База загружена с сервера и обновлена.');
            }
        } else {
            if (statusEl) statusEl.textContent = '❌ На сервере нет сохранений';
            alert('На сервере пока нет сохранений.');
        }
    })
    .catch(function(e) { 
        if (statusEl) statusEl.textContent = '❌ Ошибка сети';
        console.error(e);
    });
}

function openReleaseDetails(id, customItem, isPreview) {
    var item = customItem;
    if (!item) {
        item = savedTracks.find(function(t) { return String(t.id) === String(id); });
    }
    if (!item) return;
    
    currentReleaseId = id;
    var isPreviewMode = isPreview || false;
    
    document.getElementById('rel-cover').src = item.cover || defaultCover;
    document.getElementById('rel-title').textContent = cleanName(item.title);
    document.getElementById('rel-artist').textContent = item.artist || 'Жанр не указан';
    document.getElementById('rel-genre').textContent = item.tags || ''; 
    
    var scoreEl = document.getElementById('rel-score');
    if (item.score) {
        scoreEl.textContent = '★ ' + item.score + '/10';
        scoreEl.style.color = '#f59e0b';
    } else {
        scoreEl.textContent = 'Без оценки';
        scoreEl.style.color = 'var(--text-sub)';
    }
    
    var stKey = item.status || (item.done ? 'done' : 'plan');
    var stObj = statusMap[stKey] || statusMap.plan;
    document.getElementById('rel-status').textContent = stObj.label;
    document.getElementById('rel-status').style.color = stObj.color;
    
    var reviewEl = document.getElementById('rel-review');
    if (item.review) {
        reviewEl.textContent = item.review;
        reviewEl.style.fontStyle = 'normal';
        reviewEl.style.color = 'var(--text-main)';
    } else {
        reviewEl.textContent = 'Вы еще не написали рецензию...';
        reviewEl.style.fontStyle = 'italic';
        reviewEl.style.color = 'var(--text-sub)';
    }

    var qTitle = cleanName(item.title);
    if (item.artist && qTitle.toLowerCase().includes(item.artist.toLowerCase())) {
        qTitle = qTitle.replace(new RegExp(item.artist, 'ig'), '').replace(/^- /, '').trim();
    }
    
    var query = encodeURIComponent((item.artist ? item.artist + ' ' : '') + qTitle);
    var linksContainer = document.getElementById('rel-links');
    linksContainer.innerHTML = ''; 
    
    var services = [
        { name: 'Apple Music', icon: '🍎', url: item.url, color: '#FA243C' },
        { name: 'VK Музыка', icon: '🎵', url: 'https://vk.com/audio?q=' + query, color: '#0077FF' },
        { name: 'Яндекс', icon: '🔔', url: 'https://music.yandex.ru/search?text=' + query, color: '#FFCC00' },
        { name: 'YouTube', icon: '▶️', url: 'https://music.youtube.com/search?q=' + query, color: '#FF0000' },
        { name: 'Spotify', icon: '🟢', url: 'https://open.spotify.com/search/' + query, color: '#1DB954' }
    ];

    services.forEach(function(s) {
        if (!s.url) return; 
        var a = document.createElement('a');
        a.href = s.url;
        a.target = '_blank';
        a.style.cssText = 'display:flex; align-items:center; gap:6px; background: var(--bg-card); padding: 8px 12px; border-radius: 8px; text-decoration: none; color: var(--text-main); font-size: 12px; font-weight: bold; border: 1px solid var(--border); transition: 0.2s;';
        a.onmouseover = function() { a.style.borderColor = s.color; };
        a.onmouseout = function() { a.style.borderColor = 'var(--border)'; };
        a.innerHTML = '<span>' + s.icon + '</span> ' + s.name;
        a.onclick = function(e) { e.stopPropagation(); };
        linksContainer.appendChild(a);
    });

    var actionBtn = document.getElementById('rel-action-btn');
    if (isPreviewMode) {
        actionBtn.innerHTML = '➕ Добавить в библиотеку';
        actionBtn.style.background = 'var(--accent)';
        actionBtn.style.color = '#000';
        actionBtn.onclick = function() {
            closeReleaseDetails();
            openNoteModal(); 
            document.getElementById('note-name').value = item.title;
            document.getElementById('note-tag').value = item.artist;
            document.getElementById('note-cover').value = item.cover;
            document.getElementById('note-link').value = item.url;
        };
    } else {
        actionBtn.innerHTML = '✏️ Редактировать карточку';
        actionBtn.style.background = 'transparent';
        actionBtn.style.color = 'var(--text-main)';
        actionBtn.onclick = function() { editNoteFromDetails(); };
    }

    document.getElementById('release-modal').classList.add('open');
}

function closeReleaseDetails() {
    document.getElementById('release-modal').classList.remove('open');
}

function editNoteFromDetails() {
    closeReleaseDetails();
    editNote(currentReleaseId);
}

init();

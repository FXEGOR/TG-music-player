var playlists = [
    { id: 'all', name: 'Все треки', icon: '🎧', bg: '#1db954' },
    { id: 'tyan', name: 'Тян', icon: '🌸', bg: '#ff758c' },
    { id: 'postpunk', name: 'Пост-панк', icon: '🌧️', bg: '#4b6cb7' },
    { id: 'youtube', name: 'ВК Видео', icon: '📺', bg: '#0077ff' }
];

var defaultCover = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzI4MjgyOCIvPjx0ZXh0IHg9IjUwIiB5PSI2NSIgZm9udC1zaXplPSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+OtTwvdGV4dD48L3N2Zz4=';
var vkPrefix = atob('aHR0cHM6Ly92ay5jb20vdmlkZW9fZXh0LnBocD9vaWQ9');
var savedTracks = JSON.parse(localStorage.getItem('my_tg_tracks') || '[]');
var myMusic = (typeof customMusic !== 'undefined') ? customMusic : [];
var tracks = myMusic.concat(savedTracks);

var currentPl = 'all';
var currentList = tracks.slice();
var idx = 0;
var repeatMode = 0;
var audio = document.getElementById('audio');
var ytBox = document.getElementById('yt-container');
var ytFrame = document.getElementById('yt-frame');

function cleanName(name) {
    var str = Array.isArray(name) ? name.join('') : String(name || 'Без названия');
    return str.replace(/\.(mp3|m4a|ogg|wav)$/i, '').replace(/,\s*$/, '');
}

function init() {
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
    renderTracks();
}

function filterTracks(id, name) {
    currentPl = id;
    document.getElementById('pl-title').innerText = name;
    document.getElementById('search-input').value = '';
    currentList = (id === 'all') ? tracks.slice() : tracks.filter(function(t) { return t.pl === id; });
    renderTracks();
}

function searchTracks() {
    var q = document.getElementById('search-input').value.toLowerCase().trim();
    var base = (currentPl === 'all') ? tracks : tracks.filter(function(t) { return t.pl === currentPl; });
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
        var isCurrent = (t.type === 'audio' && audio.src && decodeURI(audio.src).indexOf(t.url) !== -1) || (t.type === 'yt' && ytFrame.src && ytFrame.src.indexOf(t.ytId.split('_').pop()) !== -1);
        d.className = 'track' + (isCurrent ? ' active' : '');
        var img = document.createElement('img');
        img.className = 't-img';
        img.src = t.cover ? t.cover : defaultCover;
        d.appendChild(img);
        var titleSpan = document.createElement('span');
        titleSpan.innerText = cleanName(t.title);
        titleSpan.style.flex = '1';
        d.appendChild(titleSpan);
        d.onclick = function() { play(i); };
        tBox.appendChild(d);
    });
}
function play(i) {
    idx = i;
    var t = currentList[idx];
    if (!t) return;
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

function saveYtVideo() {
    var url = document.getElementById('yt-url-input').value.trim();
    var title = document.getElementById('yt-title-input').value.trim() || 'ВК Видео';
    var match = url.match(/video(-?\d+_\d+)/);
    var videoId = match ? match.pop() : null;
    if (!videoId) { alert('Не удалось распознать ссылку! Нужна ссылка вида ://vk.com'); return; }
    savedTracks.push({ type: 'yt', title: title, artist: 'ВК Видео', pl: 'youtube', ytId: videoId, custom: true });
    localStorage.setItem('my_tg_tracks', JSON.stringify(savedTracks));
    tracks = myMusic.concat(savedTracks);
    document.getElementById('yt-url-input').value = '';
    document.getElementById('yt-title-input').value = '';
    closeModal();
    filterTracks(currentPl, document.getElementById('pl-title').innerText);
}

init();

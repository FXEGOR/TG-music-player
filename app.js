var playlists = [
    { id: 'all', name: 'Все треки', icon: '🎧', bg: '#1db954' },
    { id: 'tyan', name: 'Тян', icon: '🌸', bg: '#ff758c' },
    { id: 'postpunk', name: 'Пост-панк', icon: '🌧️', bg: '#4b6cb7' },
    { id: 'youtube', name: 'YouTube Видео', icon: '📺', bg: '#ff0000' }
];

var defaultCover = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzI4MjgyOCIvPjx0ZXh0IHg9IjUwIiB5PSI2NSIgZm9udC1zaXplPSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+OtTwvdGV4dD48L3N2Zz4=';
var ytPrefix = atob('aHR0cHM6Ly93d3cueW91dHViZS5jb20vZW1iZWQv');
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
    return name ? name.replace(/\.(mp3|m4a|ogg|wav)$/i, '').replace(/,\s*$/, '') : 'Без названия';
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
        var isCurrent = (t.type === 'audio' && audio.src && decodeURI(audio.src).indexOf(t.url) !== -1) || (t.type === 'yt' && ytFrame.src && ytFrame.src.indexOf(t.ytId) !== -1);
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
        audio.pause(); audio.src = '';
        ytBox.style.display = 'block';
        ytFrame.src = ytPrefix + t.ytId + '?autoplay=1';
        syncBtns('📺');
    } else {
        ytBox.style.display = 'none'; ytFrame.src = '';
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
    if (idx + 1 < currentList.length) {
        play(idx + 1);
    } else if (repeatMode === 1) {
        play(0);
    } else {
        audio.pause();
        syncBtns('▶');
    }
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
        if (newIdx > 0) {
            currentList.splice(newIdx, 1);
            currentList.unshift(currentTrack);
        }
        idx = 0;
        renderTracks();
    } else {
        play(0);
    }
}

function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    var b1 = document.getElementById('mini-rep-btn');
    var b2 = document.getElementById('big-rep-btn');
    if (repeatMode === 0) {
        b1.innerText = '🔁'; b2.innerText = '🔁';
        b1.classList.remove('active'); b2.classList.remove('active');
    } else if (repeatMode === 1) {
        b1.innerText = '🔁'; b2.innerText = '🔁';
        b1.classList.add('active'); b2.classList.add('active');
    } else {
        b1.innerText = '🔂'; b2.innerText = '🔂';
        b1.classList.add('active'); b2.classList.add('active');
    }
}

audio.addEventListener('ended', function() {
    if (repeatMode === 2) {
        audio.currentTime = 0;
        audio.play();
    } else {
        nextTrack();
    }
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

function seekAudio(val) {
    if (audio.duration) audio.currentTime = (val / 100) * audio.duration;
}

function fmtTime(sec) {
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
}

function setTheme(theme) {
    if (theme === 'amoled') {
        document.body.classList.add('amoled-theme');
    } else {
        document.body.classList.remove('amoled-theme');
    }
    localStorage.setItem('fx_theme', theme);
}

function openSettings() { document.getElementById('settings-modal').style.display = 'flex'; }
function closeSettings() { document.getElementById('settings-modal').style.display = 'none'; }
function toggleVolPopup() { document.getElementById('vol-popup').classList.toggle('open'); }
function changeVolume() { var v = document.getElementById('vol-slider').value; audio.volume = v; document.getElementById('vol-btn').innerText = (v == 0) ? '🔇' : (v < 0.5 ? '🔉' : '🔊'); }
function openFull() { document.getElementById('full-screen').classList.add('open'); }
function closeFull() { document.getElementById('full-screen').classList.remove('open'); }
function openModal() { document.getElementById('add-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('add-modal').style.display = 'none'; }

function extractYtId(url) {
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    var match = url.match(regExp);
    return (match && match.length === 11) ? match : null;
}

function saveYtVideo() {
    var url = document.getElementById('yt-url-input').value.trim();
    var title = document.getElementById('yt-title-input').value.trim() || 'YouTube Видео';
    var videoId = extractYtId(url);
    if (!videoId) { alert('Не удалось распознать ссылку!'); return; }
    savedTracks.push({ type: 'yt', title: title, artist: 'YouTube', pl: 'youtube', ytId: videoId, custom: true });
    localStorage.setItem('my_tg_tracks', JSON.stringify(savedTracks));
    tracks = myMusic.concat(savedTracks);
    closeModal();
    filterTracks(currentPl, document.getElementById('pl-title').innerText);
}

init();

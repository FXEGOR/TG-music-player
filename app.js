var playlists = [
    { id: 'all', name: 'Все треки', icon: '🎧', bg: '#1db954' },
    { id: 'tyan', name: 'Тян', icon: '🌸', bg: '#ff758c' },
    { id: 'postpunk', name: 'Пост-панк', icon: '🌧️', bg: '#4b6cb7' },
    { id: 'youtube', name: 'YouTube Видео', icon: '📺', bg: '#ff0000' }
];

var defaultCover = 'data:image/svg+xml;utf8,<svg xmlns="http://w3.org" width="100" height="100"><rect width="100" height="100" fill="%23282828"/><text x="50" y="60" font-size="40" text-anchor="middle">🎵</text></svg>';
var ytPrefix = atob('aHR0cHM6Ly93d3cueW91dHViZS5jb20vZW1iZWQv');
var savedTracks = JSON.parse(localStorage.getItem('my_tg_tracks') || '[]');
var myMusic = (typeof customMusic !== 'undefined') ? customMusic : [];
var tracks = myMusic.concat(savedTracks);

var currentPl = 'all';
var currentList = tracks;
var idx = 0;
var audio = document.getElementById('audio');
var ytBox = document.getElementById('yt-container');
var ytFrame = document.getElementById('yt-frame');

function init() {
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
    currentList = (id === 'all') ? tracks : tracks.filter(function(t) { return t.pl === id; });
    renderTracks();
}

function renderTracks() {
    var tBox = document.getElementById('tracks');
    tBox.innerHTML = '';
    currentList.forEach(function(t, i) {
        var d = document.createElement('div');
        var isCurrent = (t.type === 'audio' && audio.src.indexOf(encodeURI(t.url)) !== -1) || (t.type === 'yt' && ytFrame.src.indexOf(t.ytId) !== -1);
        d.className = 'track' + (isCurrent ? ' active' : '');
        
        var img = document.createElement('img');
        img.className = 't-img';
        img.src = t.cover ? t.cover : defaultCover;
        d.appendChild(img);

        var titleSpan = document.createElement('span');
        titleSpan.innerText = t.title;
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
    document.getElementById('mini-cover').src = cov;
    document.getElementById('big-cover').src = cov;
    document.getElementById('now-playing').innerText = t.title;
    document.getElementById('big-title').innerText = t.title;
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

function nextTrack() { if (currentList.length) play((idx + 1) % currentList.length); }
function prevTrack() {
    if (!currentList.length) return;
    if (audio.currentTime > 3) audio.currentTime = 0;
    else play((idx - 1 + currentList.length) % currentList.length);
}
function shufflePlay() { if (currentList.length) play(Math.floor(Math.random() * currentList.length)); }

audio.addEventListener('ended', nextTrack);
audio.addEventListener('timeupdate', function() {
    if (!audio.duration) return;
    document.getElementById('seek-bar').value = (audio.currentTime / audio.duration) * 100;
    document.getElementById('time-cur').innerText = fmtTime(audio.currentTime);
    document.getElementById('time-dur').innerText = fmtTime(audio.duration);
});

function seekAudio() { if (audio.duration) audio.currentTime = (document.getElementById('seek-bar').value / 100) * audio.duration; }
function fmtTime(sec) { var m = Math.floor(sec / 60); var s = Math.floor(sec % 60); return m + ':' + (s < 10 ? '0' : '') + s; }
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

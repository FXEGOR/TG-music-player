var playlists = [
    { id: 'all', name: 'Все треки', icon: '🎧', bg: '#1db954' },
    { id: 'youtube', name: 'YouTube Видео', icon: '📺', bg: '#ff0000' },
    { id: 'tyan', name: 'Тян', icon: '🌸', bg: '#ff758c' },
    { id: 'postpunk', name: 'Пост-панк', icon: '🌧️', bg: '#4b6cb7' }
];

var ytPrefix = atob('aHR0cHM6Ly93d3cueW91dHViZS5jb20vZW1iZWQv');
var demoAudio1 = atob('aHR0cHM6Ly93d3cuc291bmRoZWxpeC5jb20vZXhhbXBsZXMvbXAzL1NvdW5kSGVsaXgtU29uZy0xLm1wMw==');

var defaultTracks = [
    { type: 'yt', title: 'Lofi Hip Hop Radio (Тест видео)', artist: 'YouTube', pl: 'youtube', ytId: 'jfKfPfyJRdk' },
    { type: 'audio', title: 'Демо: Атмосферный бит', artist: 'Тян', pl: 'tyan', url: demoAudio1 }
];

var savedTracks = JSON.parse(localStorage.getItem('my_tg_tracks') || '[]');
var tracks = defaultTracks.concat(savedTracks);

var currentPl = 'all';
var currentList = tracks;
var idx = 0;
var audio = document.getElementById('audio');
var ytBox = document.getElementById('yt-container');
var ytFrame = document.getElementById('yt-frame');

function init() {
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
        var isCurrent = (t.type === 'audio' && audio.src === t.url) || (t.type === 'yt' && ytFrame.src.indexOf(t.ytId) !== -1);
        d.className = 'track' + (isCurrent ? ' active' : '');
        
        var titleSpan = document.createElement('span');
        titleSpan.innerText = (t.type === 'yt' ? '📺 ' : '🎵 ') + t.title;
        titleSpan.style.flex = '1';
        titleSpan.onclick = function() { play(i); };
        d.appendChild(titleSpan);

        if (t.custom) {
            var del = document.createElement('button');
            del.className = 'del-btn';
            del.innerText = '✖';
            del.onclick = function(e) { e.stopPropagation(); deleteTrack(t.ytId); };
            d.appendChild(del);
        }
        tBox.appendChild(d);
    });
}

function play(i) {
    idx = i;
    var t = currentList[idx];
    if (!t) return;
    if (t.type === 'yt') {
        audio.pause();
        audio.src = '';
        ytBox.style.display = 'block';
        ytFrame.src = ytPrefix + t.ytId + '?autoplay=1';
        document.getElementById('play-btn').innerText = '📺';
    } else {
        ytBox.style.display = 'none';
        ytFrame.src = '';
        audio.src = t.url;
        audio.play();
        document.getElementById('play-btn').innerText = '⏸';
    }
    document.getElementById('now-playing').innerText = t.title;
    renderTracks();
}

function togglePlay() {
    if (ytBox.style.display === 'block') return;
    if (!audio.src) { play(0); return; }
    if (audio.paused) { audio.play(); document.getElementById('play-btn').innerText = '⏸'; }
    else { audio.pause(); document.getElementById('play-btn').innerText = '▶'; }
}

function nextTrack() { play((idx + 1) % currentList.length); }
function shufflePlay() { play(Math.floor(Math.random() * currentList.length)); }

function openModal() { document.getElementById('add-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('add-modal').style.display = 'none'; }

function extractYtId(url) {
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    var match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function saveYtVideo() {
    var url = document.getElementById('yt-url-input').value.trim();
    var title = document.getElementById('yt-title-input').value.trim() || 'YouTube Видео';
    var videoId = extractYtId(url);
    
    if (!videoId) {
        alert('Не удалось распознать ссылку на YouTube!');
        return;
    }

    var newTrack = { type: 'yt', title: title, artist: 'YouTube', pl: 'youtube', ytId: videoId, custom: true };
    savedTracks.push(newTrack);
    localStorage.setItem('my_tg_tracks', JSON.stringify(savedTracks));
    tracks = defaultTracks.concat(savedTracks);
    
    document.getElementById('yt-url-input').value = '';
    document.getElementById('yt-title-input').value = '';
    closeModal();
    filterTracks(currentPl, document.getElementById('pl-title').innerText);
}

function deleteTrack(ytId) {
    savedTracks = savedTracks.filter(function(t) { return t.ytId !== ytId; });
    localStorage.setItem('my_tg_tracks', JSON.stringify(savedTracks));
    tracks = defaultTracks.concat(savedTracks);
    filterTracks(currentPl, document.getElementById('pl-title').innerText);
}

init();

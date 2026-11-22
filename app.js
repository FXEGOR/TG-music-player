var playlists = [
    { id: 'all', name: 'Все треки', icon: '🎧', bg: '#1db954' },
    { id: 'youtube', name: 'YouTube Видео', icon: '📺', bg: '#ff0000' },
    { id: 'tyan', name: 'Тян', icon: '🌸', bg: '#ff758c' },
    { id: 'postpunk', name: 'Пост-панк', icon: '🌧️', bg: '#4b6cb7' }
];

var tracks = [
    { type: 'yt', title: 'Chikoi The Maid — Mix', artist: 'Maidcore (Видео)', pl: 'youtube', ytId: 'wnw3YwlvTvw' },
    { type: 'audio', title: 'Демо: Атмосферный бит', artist: 'Тян', pl: 'tyan', url: 'https://soundhelix.com' },
    { type: 'audio', title: 'Демо: Ночной город', artist: 'Пост-панк', pl: 'postpunk', url: 'https://soundhelix.com' }
];

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
        d.innerText = (t.type === 'yt' ? '📺 ' : '🎵 ') + t.title + ' — ' + t.artist;
        d.onclick = function() { play(i); };
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
        ytFrame.src = 'https://youtube.com' + t.ytId + '?autoplay=1';
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

init();

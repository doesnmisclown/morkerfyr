import Plyr from "plyr";
import ReconnectingEventSource from "reconnecting-eventsource";
import { html, render } from "lit-html";
const controls = `
<div class="plyr__controls justify-center items-center bg-white">
  <button type="button" class="plyr__control" aria-label="Play, {title}" data-plyr="play">
    <svg class="icon--pressed" role="presentation"><use xlink:href="#plyr-pause"></use></svg>
    <svg class="icon--not-pressed" role="presentation"><use xlink:href="#plyr-play"></use></svg>
  </button>
  <button type="button" class="plyr__control" aria-label="Mute" data-plyr="mute">
    <svg class="icon--pressed" role="presentation"><use xlink:href="#plyr-muted"></use></svg>
    <svg class="icon--not-pressed" role="presentation"><use xlink:href="#plyr-volume"></use></svg>
  </button>
    <div class="plyr__volume">
      <input data-plyr="volume" type="range" min="0" max="1" step="0.05" value="1" autocomplete="off" aria-label="Volume">
    </div>
  </button>
</div>
`;
const player = new Plyr("#player", {
  controls,
});

const playlists = [
        "Electronic",
	"LoFi",
	"Metal",
	"RuRock",
];
const playlistNode = document.getElementById("playlist");
const sourceNode = document.getElementById("source")
const audioNode = document.getElementById("player")
let nowPlayingSong = "";
let playedSongsHistory = [];
const nowPlayingSongNode = document.getElementById("nowplaying");
const playedSongsHistoryNode = document.getElementById("history");
let isPlaying = false;
async function setNowPlayingSong(event) {
  const metadata = await JSON.parse(event.data);
  nowPlayingSong = metadata["metadata"];

  const nowPlayingSongTemplate = (song) => {
    return html`${song}`;
  };
  render(nowPlayingSongTemplate(nowPlayingSong), nowPlayingSongNode);
}
async function updatePlayedSongsHistory() {
  await fetch("https://radio.doesnm.cc/" + window.playlist.toLowerCase() + "/metadata-history")
    .then((res) => res.json())
    .then((out) => {
      playedSongsHistory = out.slice(1);

      const playedSongsHistoryTemplate = playedSongsHistory.map((song) => {
        return html`<li>${song.metadata.song}</li>`;
      });
      render(playedSongsHistoryTemplate, playedSongsHistoryNode);
    });
}
audioNode.onplaying = function(){
	isPlaying = true;
}
audioNode.onpaused = function(){
	isPlaying = false;
}
function Play(){
	if(audioNode.paused &&  !isPlaying){
		return audioNode.play()
	}
}
function Pause(){
	if(!audioNode.paused && isPlaying){
		audioNode.pause();
		return new Promise(r => r())
	}
}
let playlistPosition = 0;
window.nextPlaylist = function(n){
	playlistPosition += n;
	if(playlistPosition > playlists.length - 1) playlistPosition = 0;
	if(playlistPosition < 0) playlistPosition = playlists.length - 1;
	let current = playlists[playlistPosition];
	window.playlist = current;
	playlistNode.innerText = current;
	source.src = "https://radio.doesnm.cc/" + current.toLowerCase();
	Pause();
	audioNode.load();
	Play();
	if(window.evSource) window.evSource.close();
	window.evSource = new ReconnectingEventSource("https://radio.doesnm.cc/" + current.toLowerCase() + "/metadata");

	window.evSource.addEventListener("message", (event) => {
		setNowPlayingSong(event);
		updatePlayedSongsHistory();
	});
}
window.playlist = null;
window.evSource = null;
window.nextPlaylist(0)

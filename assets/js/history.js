import ReconnectingEventSource from "reconnecting-eventsource";
import { html, render } from "lit-html";

class Radio {
  constructor(mount) {
    this.url = "http://84.252.75.195:8000" + mount;
    this.metadata = this.url + "/metadata";
    this.history = this.metadata + "-history";
  }

  initEventSource() {
    return new ReconnectingEventSource(this.metadata);
  }
}

// Init global values.
let nowPlayingSong = "";
let playedSongsHistory = [];
let mainRadioMountIsAlive = false;

const nowPlayingSongNode = document.getElementById("nowplaying");
const playedSongsHistoryNode = document.getElementById("history");

// Get JSON from EventSource stream and set now playing track from it.
async function setNowPlayingSong(event) {
  const metadata = await JSON.parse(event.data);
  nowPlayingSong = metadata["metadata"];

  const nowPlayingSongTemplate = (song) => {
    return html`${song}`;
  };
  render(nowPlayingSongTemplate(nowPlayingSong), nowPlayingSongNode);

  // Print now playing song.
  console.log("Now playing: " + nowPlayingSong);
}

// Update and print history of last played songs.
async function updatePlayedSongsHistory(history) {
  await fetch(history)
    .then((res) => res.json())
    .then((out) => {
      playedSongsHistory = out.slice(1);

      const playedSongsHistoryTemplate = playedSongsHistory.map((song) => {
        return html`<li>${song.metadata.song}</li>`;
      });
      render(playedSongsHistoryTemplate, playedSongsHistoryNode);

      console.log("History: ", playedSongsHistory);
    });
}

// Main radio mount. Should be used when everything is fine.
const radioStreamMain = new Radio("/stream");
const eventSourceMain = radioStreamMain.initEventSource();
// Secondary radio mount. Should be used if the main one is down. Fallback.
const radioStreamSecondary = new Radio("/secondary");
const eventSourceSecondary = radioStreamSecondary.initEventSource();

eventSourceMain.addEventListener("message", (event) => {
  setNowPlayingSong(event);
  updatePlayedSongsHistory(radioStreamMain.history);
  mainRadioMountIsAlive = true;
});

eventSourceMain.addEventListener("error", () => {
  mainRadioMountIsAlive = false;
});

// If main radio mount is down, replace metadata with the secondary one.
eventSourceSecondary.addEventListener("message", (event) => {
  if (mainRadioMountIsAlive === false) {
    setNowPlayingSong(event);
    updatePlayedSongsHistory(radioStreamSecondary.history);
  }
});

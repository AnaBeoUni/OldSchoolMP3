import './App.css';
import { useState, useRef, useEffect } from "react";
//import "bootstrap/dist/css/bootstrap.min.css";

const API = "http://localhost:8080/api/player";

function App() {

  // DRAG WINDOW
  const playerRef = useRef(null);
  const [pos, setPos] = useState({ x: 100, y: 100 });
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });
  
  // APP STATE
  const [songs, setSongs] = useState([]);
  const [autoplay, setAutoplay] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showSongs, setShowSongs] = useState(false); // hidden by default
  const [currentSong, setCurrentSong] = useState(null);

  // AUTO LOAD SONGS ON START
  useEffect(() => {
    loadSongs();
    loadNowPlaying();
  }, []);

  // LOAD SONGS
  const loadSongs = async () => {
    const res = await fetch(`${API}/songs`);
    const data = await res.json();
    setSongs(data);
  };

  const loadNowPlaying = async () => {
    const res = await fetch(`${API}/now-playing`);
    const data = await res.json();
    setCurrentSong(data); 
  };
  const playSong = async (index) => {
  await fetch(`${API}/play/${index}`, { method: "POST" });
  await loadNowPlaying();
  setIsPaused(false);
  };

  const next = async () => {
    await fetch(`${API}/next`, { method: "POST" });
    await loadNowPlaying();
    setIsPaused(false);
  };

  const prev = async () => {
    await fetch(`${API}/previous`, { method: "POST" });
    await loadNowPlaying();
    setIsPaused(false);
  };

  const stop = async () => {
    await fetch(`${API}/stop`, { method: "POST" });
    setCurrentSong(null);
    setIsPaused(false);
  };

  const pause = async () => {
    await fetch(`${API}/pause`, { method: "POST" });
  };

  const resume = async () => {
    await fetch(`${API}/resume`, { method: "POST" });
  };

  // AUTOPLAY TOGGLE
  const toggleAutoplay = async () => {
    const newValue = !autoplay;
    setAutoplay(newValue);

    await fetch(`${API}/autoplay?enabled=${newValue}`, {
      method: "PATCH",
    });
  };


  const togglePlayPause = async () => {
    if (!currentSong) return; // nothing selected yet

    if (isPaused) {
      resume();
      setIsPaused(false);
    } else {
      pause();
      setIsPaused(true);
    }
  };

  // DRAG START
  const startDrag = (e) => {
    setDragging(true);
    offset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
  };

  // DRAG MOVE
  const onDrag = (e) => {
    if (!dragging) return;

    setPos({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y,
    });
  };

  // DRAG END
  const stopDrag = () => {
    setDragging(false);
  };

  return (
    <div
      className="player player-col"
      ref={playerRef}
      style={{ left: pos.x, top: pos.y }}
      onMouseMove={onDrag}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
    >

      {/* HEADER */}
      <div className="header" onMouseDown={startDrag}>
        🎵 OldSchool MP3 Player
      </div>

      {/* SONG TOGGLE */}
      <button onClick={() => setShowSongs(!showSongs)}>
        {showSongs ? "Hide songs" : "Show songs"}
      </button>

      {/* SONG LIST */}
      {showSongs && (
        <div className="songs">
          {songs.map((s, i) => (
            <div key={i} className="song">
              {s.title}
              <button onClick={() => playSong(i)}>▶ Play</button>
            </div>
          ))}
        </div>
      )}

      {/* NOW PLAYING (NOW ABOVE CONTROLS) */}
      {currentSong && (
        <div className="now-playing glow">
          🎧 NOW PLAYING: {currentSong ? currentSong.title : "—"}
        </div>
      )}

      {/* CONTROLS */}
      <div className="controls">
        <button onClick={prev}>⏮</button>
        <button onClick={togglePlayPause}>
          {isPaused ? "▶" : "⏸"}
        </button>
        <button onClick={next}>⏭</button>
        <button onClick={stop}>⏹</button>

        <button onClick={toggleAutoplay}>
          🔁 Autoplay: {autoplay ? "ON" : "OFF"}
        </button>
      </div>

    </div>
  );
}

export default App;
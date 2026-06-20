import './App.css';
import { useState, useEffect, useRef } from "react";

const API = "http://localhost:8080/api/player";

const emptyPlaylist = {
  name: "All Songs",
  songs: []
};

function App() {

  const [playlists, setPlaylists] = useState([]);
  const [activePlaylistIndex, setActivePlaylistIndex] = useState(0);
  const [songs, setSongs] = useState([]);
  const [autoplay, setAutoplay] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [loop, setLoop] = useState(false);
  const [showSongs, setShowSongs] = useState(false);
  const [showCD, setShowCD] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const [currentSong, setCurrentSong] = useState(null);
  const [currentSongIndex, setCurrentSongIndex] = useState(null);
  const [libraryError, setLibraryError] = useState("");

  useEffect(() => {
    loadLibrary();
    loadNowPlaying();
  }, []);

  const activePlaylist = playlists[activePlaylistIndex] || emptyPlaylist;

  useEffect(() => {
    if (!currentSong || songs.length === 0) {
      setCurrentSongIndex(null);
      return;
    }

    const index = songs.findIndex(s => {
      if (currentSong.path && s.path) {
        return s.path === currentSong.path;
      }

      return s.title === currentSong.title;
    });

    setCurrentSongIndex(index !== -1 ? index : null);
  }, [currentSong, songs]);

 useEffect(() => {
  if (playlists.length === 0) return;

  const playlist = playlists[activePlaylistIndex];

  if (playlist && Array.isArray(playlist.songs)) {
    setSongs(playlist.songs);
  } else {
    setSongs([]);
  }

  setCurrentSong(null);
  setCurrentSongIndex(null);

}, [playlists, activePlaylistIndex]);

  const nowPlayingIntervalRef = useRef(null);
  const playerRef = useRef(null);

  // Get ipcRenderer if in Electron
  const ipcRenderer = window.require ? window.require('electron').ipcRenderer : null;

  // AUTO REFRESH NOW PLAYING
  useEffect(() => {

    if (nowPlayingIntervalRef.current) {
      clearInterval(nowPlayingIntervalRef.current);
    }

    nowPlayingIntervalRef.current = setInterval(() => {
      loadNowPlaying();
    }, 2000);

    return () => {
      if (nowPlayingIntervalRef.current) {
        clearInterval(nowPlayingIntervalRef.current);
      }
    };

  }, []);

  // RESIZE WINDOW ON PLAYER HEIGHT CHANGE
  useEffect(() => {
    if (!playerRef.current || !ipcRenderer) return;

    const observer = new ResizeObserver(() => {
      const height = playerRef.current?.offsetHeight;
      if (height) {
        ipcRenderer.send('resize-window', height + 36); // +36 for padding
      }
    });

    observer.observe(playerRef.current);

    return () => observer.disconnect();
  }, [ipcRenderer]);

  // LOAD LIBRARY
  const loadLibrary = async () => {

    try {
      const res = await fetch(`${API}/playlists`);

      if (!res.ok) {
        throw new Error("Failed to load playlists");
      }

      const data = await res.json();
      const normalized = Array.isArray(data) ? data.map((playlist) => ({
        ...playlist,
        songs: Array.isArray(playlist.songs) ? playlist.songs : []
      })) : [];

      setPlaylists(normalized);

      if (normalized.length > 0) {
        const nextIndex = (activePlaylistIndex >= 0 && activePlaylistIndex < normalized.length)
          ? activePlaylistIndex
          : 0;

        setActivePlaylistIndex(nextIndex);
        setSongs(normalized[nextIndex].songs || []);
        setLibraryError("");
        return;
      }

      setSongs([]);
      setLibraryError("No playlists found in the music folder.");
    } catch (error) {
      console.error(error);

      try {
        const fallbackRes = await fetch(`${API}/songs`);

        if (!fallbackRes.ok) {
          throw new Error("Failed to load songs");
        }

        const fallbackSongs = await fallbackRes.json();
        const safeSongs = Array.isArray(fallbackSongs) ? fallbackSongs : [];

        setPlaylists([{ name: "All Songs", songs: safeSongs }]);
        setActivePlaylistIndex(0);
        setSongs(safeSongs);
        setLibraryError("Playlist endpoint unavailable, using the flat song list.");
      } catch (fallbackError) {
        console.error(fallbackError);
        setPlaylists([]);
        setSongs([]);
        setLibraryError("Could not load your library.");
      }
    }
  };

  const syncPlaylistOnBackend = async (index) => {
    const candidateEndpoints = [
      `${API}/selectPlaylist/${index}`,
      `${API}/playlist/${index}`,
      `${API}/playlists/${index}/select`
    ];

    for (const endpoint of candidateEndpoints) {
      try {
        const response = await fetch(endpoint, { method: "POST" });

        if (response.ok) {
          return true;
        }
      } catch (error) {
        console.debug(`Playlist sync failed for ${endpoint}`, error);
      }
    }

    return false;
  };

  const selectPlaylist = async (index) => {
    const playlist = playlists[index];
    if (!playlist) return;

    setActivePlaylistIndex(index);
    setSongs(playlist.songs || []);
    setCurrentSong(null);
    setCurrentSongIndex(null);

    // 🔥 FIX: sync playlist context to backend
    await fetch(`${API}/playlist/select`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(playlist.songs || [])
    });
  };

  const playPlaylist = async (index) => {
    const playlist = playlists[index];

    if (!playlist || !playlist.songs || playlist.songs.length === 0) {
      return;
    }

    setActivePlaylistIndex(index);
    setSongs(playlist.songs || []);
    setCurrentSong(null);
    setCurrentSongIndex(null);

    await syncPlaylistOnBackend(index);
    await playSong(0, playlist.songs);
  };

  // LOAD CURRENT SONG
  const loadNowPlaying = async () => {

    const res = await fetch(`${API}/now-playing`);

    if (!res.ok) return;

    const data = await res.json();

    setCurrentSong(data);
  };

  // PLAY SONG
  const playSong = async (index, trackList = songs) => {

    if (!trackList || !trackList[index]) return;

    await fetch(`${API}/play/${index}`, {
      method: "POST"
    });

    setCurrentSongIndex(index);
    setCurrentSong(trackList[index]);
    setIsPaused(false);
  };

  // NEXT
  const next = async () => {

    await fetch(`${API}/next`, {
      method: "POST"
    });

    loadNowPlaying();

    setIsPaused(false);
  };

  // PREVIOUS
  const prev = async () => {

    await fetch(`${API}/previous`, {
      method: "POST"
    });

    loadNowPlaying();

    setIsPaused(false);
  };

  // STOP
  const stop = async () => {

    await fetch(`${API}/stop`, {
      method: "POST"
    });

    setCurrentSong(null);

    setCurrentSongIndex(null);

    setIsPaused(false);
  };

  // PAUSE
  const pause = async () => {

    await fetch(`${API}/pause`, {
      method: "POST"
    });

    setIsPaused(true);
  };

  // RESUME
  const resume = async () => {

    await fetch(`${API}/resume`, {
      method: "POST"
    });

    setIsPaused(false);
  };

  // PLAY / PAUSE TOGGLE
  const togglePlayPause = () => {

    if (!currentSong) return;

    if (isPaused) {
      resume();
    } else {
      pause();
    }
  };

  // AUTOPLAY
  const toggleAutoplay = async () => {

    const newValue = !autoplay;

    setAutoplay(newValue);

    await fetch(`${API}/autoplay?enabled=${newValue}`, {
      method: "PATCH",
    });
  };

  // SHUFFLE
  const toggleShuffle = async () => {

    const newValue = !shuffle;

    setShuffle(newValue);

    await fetch(`${API}/shuffle?enabled=${newValue}`, {
      method: "PATCH",
    });
  };

  // LOOP
  const toggleLoop = async () => {

    const newValue = !loop;

    setLoop(newValue);

    await fetch(`${API}/loop?enabled=${newValue}`, {
      method: "PATCH",
    });
  };

  return (

    <div className="player" ref={playerRef}>

      {/* HEADER */}
      <div className="header">
        <span>♬⋆.˚OldSchool MP3 Player</span>
        <button 
          onClick={() => setShowMenu(!showMenu)} 
          style={{ 
            background: "none", 
            border: "none", 
            color: "var(--primary)", 
            fontSize: "18px", 
            cursor: "pointer",
            padding: "0",
            margin: "0"
          }}
        >
          ☰
        </button>
      </div>

      {/* TOP CONTROLS */}
      {showMenu && (
        <div className="menu-actions">
          <button onClick={() => setShowSongs(!showSongs)}>
            {showSongs ? "Hide library" : "Show library"}
          </button>
          <button onClick={() => setShowCD(!showCD)} style={{ fontSize: "16px" }}>
            {showCD ? "🙈" : "💿"}
          </button>
          <button onClick={loadLibrary}>
            Refresh
          </button>
        </div>
      )}

      {libraryError && (
        <div className="library-error">
          {libraryError}
        </div>
      )}

      {/* SONG LIST */}
      {showSongs && (

        <div className="library">
          <div className="playlist-rail">
            <div className="section-title">Playlists</div>

            {playlists.map((playlist, index) => {
              const isActive = index === activePlaylistIndex;

              return (
                <button
                  key={`${playlist.name}-${index}`}
                  type="button"
                  className={`playlist-card ${isActive ? "active" : ""}`}
                  onClick={() => selectPlaylist(index)}
                >
                  <div className="playlist-card__meta">
                    <span className="playlist-card__icon">▣</span>
                    <div>
                      <div className="playlist-card__name">{playlist.name}</div>
                      <div className="playlist-card__count">{playlist.songs?.length || 0} tracks</div>
                    </div>
                  </div>

                  <span className="playlist-card__play" onClick={(event) => {
                    event.stopPropagation();
                    playPlaylist(index);
                  }}>
                    ▶
                  </span>
                </button>
              );
            })}
          </div>

          <div className="track-panel">
            <div className="track-panel__header">
              <div>
                <div className="section-title">Tracks</div>
                <div className="track-panel__subtitle">
                  {activePlaylist.name || "All Songs"}
                </div>
              </div>

              <button type="button" onClick={() => playPlaylist(activePlaylistIndex)} disabled={songs.length === 0}>
                Play playlist
              </button>
            </div>

            <div className="songs">
              {songs.length === 0 ? (
                <div className="empty-state">No songs in this playlist.</div>
              ) : (
                songs.map((song, index) => (
                  <div key={`${song.path || song.title}-${index}`} className={`song ${currentSongIndex === index ? "active" : ""}`}>
                    <button type="button" className="song-name" onClick={() => playSong(index)}>
                      <span className="song-index">{index + 1}</span>
                      <span>{song.title}</span>
                    </button>

                    <button type="button" onClick={() => playSong(index)}>
                      ▶
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      )}

      {/* VINYL */}
      {showCD && (
        <div className="cd-wrap">
          <div className={`cd ${isPaused ? "paused" : ""}`}>

            {currentSongIndex !== null && (

              <img
                src={`${API}/cover/${currentSongIndex}`}
                alt="cover"
                className="cover"
              />

            )}

          </div>
        </div>
      )}

      {/* NOW PLAYING */}
      <div className="now-playing">
        <b>✧ Now playing:</b> {currentSong?.title || "—"}
      </div>

      {/* CONTROLS */}
      <div className="controls">

        <button onClick={prev}>
          ⏮
        </button>

        <button onClick={togglePlayPause}>
          {isPaused ? "▶" : "⏸"}
        </button>

        <button onClick={next}>
          ⏭
        </button>

        <button onClick={stop}>
          ⏹
        </button>

        {/* AUTOPLAY */}
        <button>

          <img
            src="/icons/autoplay.png"
            className="icon-button"
            onClick={toggleAutoplay}
            style={{ opacity: autoplay ? 1 : 0.4 }}
            alt="autoplay"
          />

        </button>

        {/* SHUFFLE */}
        <button>

          <img
            src="/icons/shuffle.png"
            className="icon-button"
            onClick={toggleShuffle}
            style={{ opacity: shuffle ? 1 : 0.4 }}
            alt="shuffle"
          />

        </button>

        {/* LOOP */}
        <button>

          <img
            src="/icons/loop-one.png"
            className="icon-button"
            onClick={toggleLoop}
            style={{ opacity: loop ? 1 : 0.4 }}
            alt="loop"
          />

        </button>

      </div>

    </div>

  );
}

export default App;
import { useCallback, useEffect, useMemo, useState } from 'react'

const API = 'http://localhost:8080/api/player'

function App() {
  const [songs, setSongs] = useState([])
  const [autoplay, setAutoplay] = useState(true)
  const [showSongs, setShowSongs] = useState(false)
  const [status, setStatus] = useState({
    songIndex: -1,
    isPaused: false,
    isPlaying: false,
    positionMs: 0,
    durationMs: 0,
    song: null,
  })

  const formatMs = (ms) => {
    const safeMs = Math.max(0, ms || 0)
    const minutes = Math.floor(safeMs / 60000)
    const seconds = Math.floor((safeMs % 60000) / 1000)
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  const loadSongs = useCallback(async () => {
    const response = await fetch(`${API}/songs`)
    if (!response.ok) {
      return
    }
    const data = await response.json()
    setSongs(Array.isArray(data) ? data : [])
  }, [])

  const loadStatus = useCallback(async () => {
    const response = await fetch(`${API}/status`)
    if (!response.ok) {
      return
    }
    const data = await response.json()
    setStatus({
      songIndex: typeof data.songIndex === 'number' ? data.songIndex : -1,
      isPaused: Boolean(data.isPaused),
      isPlaying: Boolean(data.isPlaying),
      positionMs: typeof data.positionMs === 'number' ? data.positionMs : 0,
      durationMs: typeof data.durationMs === 'number' ? data.durationMs : 0,
      song: data.song ?? null,
    })
  }, [])

  useEffect(() => {
    const bootstrap = async () => {
      await loadSongs()
      await loadStatus()
    }
    bootstrap()
    const pollTimer = setInterval(loadStatus, 400)
    return () => clearInterval(pollTimer)
  }, [loadSongs, loadStatus])

  const currentSong = useMemo(() => {
    if (status.song) {
      return status.song
    }
    if (status.songIndex >= 0 && status.songIndex < songs.length) {
      return songs[status.songIndex]
    }
    return null
  }, [status, songs])

  const post = async (path) => {
    await fetch(`${API}${path}`, { method: 'POST' })
    await loadStatus()
  }

  const playSong = async (index) => {
    await fetch(`${API}/play/${index}`, { method: 'POST' })
    await loadStatus()
  }

  const nextSong = async () => {
    await post('/next')
  }

  const previousSong = async () => {
    await post('/previous')
  }

  const stopSong = async () => {
    await post('/stop')
  }

  const togglePlayPause = async () => {
    const endpoint = status.isPaused ? '/resume' : '/pause'
    await post(endpoint)
  }

  const toggleAutoplay = async () => {
    const nextValue = !autoplay
    setAutoplay(nextValue)
    await fetch(`${API}/autoplay?enabled=${nextValue}`, { method: 'PATCH' })
  }

  const hasTrack = status.songIndex >= 0
  const safePositionMs = Math.max(0, status.positionMs)
  const safeDurationMs = Math.max(0, status.durationMs)
  const progress = safeDurationMs > 0 ? Math.min(100, (safePositionMs / safeDurationMs) * 100) : 0
  const toggleLabel = status.isPaused ? '▶ Resume' : '⏸ Pause'
  const remainingMs = Math.max(safeDurationMs - safePositionMs, 0)

  return (
    <div className="container py-3 py-md-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
          <div className="card shadow-sm">
            <div className="card-body">
              <h1 className="h5 mb-3">Old School MP3 Player</h1>

              <div className="d-flex flex-wrap gap-2 mb-3">
                <button className="btn btn-primary" onClick={() => setShowSongs((value) => !value)}>
                  {showSongs ? 'Hide Songs' : 'Show Songs'}
                </button>
                <button className="btn btn-success" onClick={previousSong} disabled={!songs.length}>
                  ⏮ Previous
                </button>
                <button className="btn btn-success" onClick={nextSong} disabled={!songs.length}>
                  ⏭ Next
                </button>
                <button
                  className="btn btn-warning"
                  onClick={togglePlayPause}
                  disabled={!status.isPlaying && !status.isPaused}
                >
                  {toggleLabel}
                </button>
                <button className="btn btn-danger" onClick={stopSong} disabled={!hasTrack}>
                  ⏹ Stop
                </button>
                <button className="btn btn-outline-secondary ms-auto" onClick={toggleAutoplay}>
                  Autoplay: {autoplay ? 'On' : 'Off'}
                </button>
              </div>

              <div className="mb-3">
                <div className="small text-body-secondary mb-1">
                  Now Playing: {currentSong ? currentSong.title : '—'}
                </div>
                <div className="progress" role="progressbar" aria-label="Playback progress">
                  <div className="progress-bar" style={{ width: `${progress}%` }} />
                </div>
                <div className="d-flex justify-content-between small text-body-secondary mt-1">
                  <span>{formatMs(safePositionMs)}</span>
                  <span>-{formatMs(remainingMs)}</span>
                </div>
              </div>

              {showSongs && (
                <ul className="list-group">
                  {songs.map((song, index) => (
                    <li
                      key={`${song.title}-${index}`}
                      className={`list-group-item d-flex justify-content-between align-items-center ${
                        status.songIndex === index ? 'active' : ''
                      }`}
                    >
                      <span className="text-truncate me-2">{song.title}</span>
                      <button
                        className={`btn btn-sm ${status.songIndex === index ? 'btn-light' : 'btn-outline-primary'}`}
                        onClick={() => playSong(index)}
                      >
                        ▶ Play
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

# OldSchoolMP3

## Player API

### `GET /api/player/status`
Returns current playback status (JavaFX-backed):

- `songIndex` (`int`, `-1` when no active track)
- `isPaused` (`boolean`)
- `isPlaying` (`boolean`)
- `positionMs` (`long`)
- `durationMs` (`long`)
- `song` (`Song`, nullable)

## UI behavior

- Frontend now uses a single **Pause/Resume** toggle button (calls `/api/player/pause` and `/api/player/resume`).
- A Bootstrap progress bar shows elapsed and remaining playback time.
- Frontend polls `/api/player/status` every ~400ms to keep UI state in sync after play/next/previous/stop.

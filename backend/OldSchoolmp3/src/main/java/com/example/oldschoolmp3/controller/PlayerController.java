package com.example.oldschoolmp3.controller;

import com.example.oldschoolmp3.model.Playlist;
import com.example.oldschoolmp3.model.Song;
import com.example.oldschoolmp3.service.AudioPlayerService;
import com.mpatric.mp3agic.ID3v2;
import com.mpatric.mp3agic.Mp3File;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/player")
@CrossOrigin(origins = "*")
public class PlayerController {

    private final AudioPlayerService audioPlayerService;

    public PlayerController(AudioPlayerService audioPlayerService) {
        this.audioPlayerService = audioPlayerService;
    }

    // ---------------- SONGS ----------------
    @GetMapping("/songs")
    public List<Song> getSongs() {
        audioPlayerService.reloadSongs();
        return audioPlayerService.getSongs();
    }

    // ---------------- PLAYLISTS ----------------
    @GetMapping("/playlists")
    public List<Playlist> getPlaylists() {
        return audioPlayerService.getPlaylists();
    }

    // ---------------- PLAY ----------------
    @PostMapping("/play/{index}")
    public Map<String, Object> playSong(@PathVariable int index) {
        audioPlayerService.playSongAtIndex(index);
        return Map.of(
                "status", "ok",
                "message", "Playing index " + index
        );
    }

    // ---------------- CONTROLS ----------------
    @PostMapping("/next")
    public Map<String, String> nextSong() {
        audioPlayerService.nextSong();
        return Map.of("status", "ok", "action", "next");
    }

    @PostMapping("/previous")
    public Map<String, String> previousSong() {
        audioPlayerService.previousSong();
        return Map.of("status", "ok", "action", "previous");
    }

    @PostMapping("/pause")
    public Map<String, String> pause() {
        audioPlayerService.pauseSong();
        return Map.of("status", "ok", "action", "pause");
    }

    @PostMapping("/resume")
    public Map<String, String> resume() {
        audioPlayerService.resumeSong();
        return Map.of("status", "ok", "action", "resume");
    }

    @PostMapping("/stop")
    public Map<String, String> stop() {
        audioPlayerService.stopSong();
        return Map.of("status", "ok", "action", "stop");
    }

    // ---------------- SETTINGS ----------------
    @PatchMapping("/shuffle")
    public Map<String, Object> shuffle(@RequestParam boolean enabled) {
        audioPlayerService.setShuffle(enabled);
        return Map.of("shuffle", enabled);
    }

    @PatchMapping("/loop")
    public Map<String, Object> loop(@RequestParam boolean enabled) {
        audioPlayerService.setLoop(enabled);
        return Map.of("loop", enabled);
    }

    @PatchMapping("/autoplay")
    public Map<String, Object> autoplay(@RequestParam boolean enabled) {
        audioPlayerService.setAutoPlay(enabled);
        return Map.of("autoplay", enabled);
    }

    // ---------------- NOW PLAYING ----------------
    @GetMapping("/now-playing")
    public Song nowPlaying() {
        return audioPlayerService.getCurrentSong();
    }

    // ---------------- COVER ----------------
    @GetMapping("/cover/{index}")
    public ResponseEntity<byte[]> cover(@PathVariable int index) {

        List<Song> songs = audioPlayerService.getSongs();

        if (songs == null || index < 0 || index >= songs.size()) {
            return ResponseEntity.notFound().build();
        }

        Song song = songs.get(index);

        try {
            Mp3File mp3 = new Mp3File(song.getPath());

            if (!mp3.hasId3v2Tag()) {
                return ResponseEntity.notFound().build();
            }

            ID3v2 tag = mp3.getId3v2Tag();

            byte[] img = tag.getAlbumImage();

            if (img == null) {
                return ResponseEntity.notFound().build();
            }

            HttpHeaders headers = new HttpHeaders();

            String mime = tag.getAlbumImageMimeType();
            headers.setContentType(
                    MediaType.parseMediaType(
                            mime != null ? mime : "image/jpeg"
                    )
            );

            return new ResponseEntity<>(img, headers, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.notFound().build();
        }
    }
}
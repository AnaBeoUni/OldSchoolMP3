package com.example.oldschoolmp3.controller;

import com.example.oldschoolmp3.model.Song;
import org.springframework.web.bind.annotation.*;
import com.example.oldschoolmp3.service.AudioPlayerService;

import java.util.List;

@RestController
@RequestMapping("/api/player")
@CrossOrigin(origins = "http://localhost:3000")
public class PlayerController {

    private final AudioPlayerService audioPlayerService;

    // Spring injects automatically
    public PlayerController(AudioPlayerService audioPlayerService) {
        this.audioPlayerService = audioPlayerService;
    }

    @GetMapping("/songs")
    public List<Song> getSongs(){

        return audioPlayerService.getSongs();
    }

    @PostMapping("/play/{index}")
    public String playSong(@PathVariable int index){

        audioPlayerService.playSongAtIndex(index);
        return "Playing song at index: " + index + "\nCurrent index: " +audioPlayerService.currentlyPlaying();
    }

    @PostMapping("/next")
    public String nextSong(){

        audioPlayerService.nextSong();
        return "Next song";
    }

    @PostMapping("/previous")
    public String previousSong(){

        audioPlayerService.previousSong();
        return "Previous song";
    }


    @PostMapping("/pause")
    public String pauseSong(){

        audioPlayerService.pauseSong();
        return "Song paused";
    }


    @PostMapping("/resume")
    public String resumeSong(){

        audioPlayerService.resumeSong();
        return "Song resumed";
    }


    @PostMapping("/stop")
    public String stopSong(){

        audioPlayerService.stopSong();
        return "Song stopped";
    }

    @DeleteMapping("/deleteSong/{index}")
    public String deleteSong(@PathVariable int index) {
        audioPlayerService.deleteSong(index);
        return "Deleted song at index " + index;
    }
    @PatchMapping("/autoplay")
    public String toggleAutoplay(@RequestParam boolean enabled){

        audioPlayerService.setAutoPlay(enabled);
        return "Autoplay set to: " + enabled;
    }
    @PostMapping("/secure/test")
    public String test(@RequestHeader("X-Client") String client) {
        return "Hello " + client;
    }
    @GetMapping("/now-playing")
    public Song nowPlaying() {
        int idx = audioPlayerService.currentlyPlayingIndex();
        if (idx < 0) return null;

        List<Song> songs = audioPlayerService.getSongs();
        if (idx >= songs.size()) return null;

        return songs.get(idx);
    }
}
package com.example.oldschoolmp3.service;

import com.example.oldschoolmp3.model.Playlist;
import com.example.oldschoolmp3.model.Song;
import javafx.scene.media.Media;
import javafx.scene.media.MediaPlayer;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.*;

@Service
public class AudioPlayerService {

    private MediaPlayer player;

    private Song currentSong;

    @Getter
    private List<Song> songs = new ArrayList<>();

    @Getter
    private final List<Playlist> playlists;

    private final MusicLibraryService libraryService;

    private boolean shuffle = false;

    @Setter
    private boolean loop = false;

    @Getter
    private boolean autoPlay = true;

    private List<Song> shuffleQueue = new ArrayList<>();
    private int shuffleIndex = 0;

    public AudioPlayerService(MusicLibraryService libraryService) {
        this.libraryService = libraryService;
        this.playlists = libraryService.loadPlaylists();
        reloadSongs();
    }

    // ---------------- LOAD ----------------
    public void reloadSongs() {
        this.songs = libraryService.loadAllSongs();

        if (shuffle) {
            generateShuffleQueue();
        }
    }

    // ---------------- SHUFFLE ----------------
    private void generateShuffleQueue() {
        shuffleQueue = new ArrayList<>(songs);
        Collections.shuffle(shuffleQueue);
        shuffleIndex = 0;
    }

    public void setShuffle(boolean shuffle) {
        this.shuffle = shuffle;
        if (shuffle) generateShuffleQueue();
    }

    public void setAutoPlay(boolean autoPlay) {
        this.autoPlay = autoPlay;
    }

    // ---------------- PLAY BY INDEX (kept for compatibility) ----------------
    public void playSongAtIndex(int index) {
        if (songs.isEmpty()) return;
        if (index < 0 || index >= songs.size()) return;

        playSong(songs.get(index));
    }

    // ---------------- CORE PLAY ----------------
    private void playSong(Song song) {

        try {
            stopSong();

            currentSong = song;

            File file = new File(song.getPath());
            Media media = new Media(file.toURI().toString());

            player = new MediaPlayer(media);
            player.play();

            player.setOnEndOfMedia(() -> {
                if (loop) {
                    playSong(song);
                } else if (autoPlay) {
                    nextSong();
                }
            });

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // ---------------- NEXT ----------------
    public void nextSong() {

        if (songs.isEmpty()) return;

        if (shuffle) {
            if (shuffleIndex >= shuffleQueue.size()) generateShuffleQueue();
            playSong(shuffleQueue.get(shuffleIndex++));
            return;
        }

        int idx = songs.indexOf(currentSong);
        idx = (idx + 1) % songs.size();

        playSong(songs.get(idx));
    }

    // ---------------- PREVIOUS ----------------
    public void previousSong() {

        if (songs.isEmpty()) return;

        int idx = songs.indexOf(currentSong);
        idx = (idx - 1 + songs.size()) % songs.size();

        playSong(songs.get(idx));
    }

    // ---------------- STATE ----------------
    public Song getCurrentSong() {
        return currentSong;
    }

    public int currentlyPlayingIndex() {
        return songs.indexOf(currentSong);
    }

    public void pauseSong() {
        if (player != null) player.pause();
    }

    public void resumeSong() {
        if (player != null) player.play();
    }

    public void stopSong() {
        if (player != null) player.stop();
    }
}
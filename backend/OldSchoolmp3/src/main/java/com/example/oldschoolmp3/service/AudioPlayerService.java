package com.example.oldschoolmp3.service;
import com.example.oldschoolmp3.model.PlayerStatus;
import javafx.scene.media.Media;
import javafx.scene.media.MediaPlayer;
import javafx.util.Duration;
import lombok.Getter;
import com.example.oldschoolmp3.model.Song;
import org.springframework.stereotype.Service;
import javafx.application.Platform;

import java.io.File;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.function.Supplier;

@Service
public class AudioPlayerService {

    private MediaPlayer player;
    private Integer currentSongIndex = 0;
    @Getter
    private List<Song> songs;

    @Getter
    private boolean autoPlay = true;

    //bean injects itself here and now audioplayerservoce uses musiclibraryservice!!
    public AudioPlayerService(MusicLibraryService libraryService) {
        System.out.println("Songs loaded!");

        this.songs = libraryService.loadAllSongs();
    }

    public void playSong(String songPath){

            try {
                releasePlayer(false);
                //file objektas gaunamas per path
                File file = new File(songPath);

                Media media = new Media(file.toURI().toString());

                player = new MediaPlayer(media);
                System.out.println("Playing song: "+songs.get(currentSongIndex).getTitle());
                player.play();

                player.setOnEndOfMedia(() -> {
                    if(autoPlay){
                        nextSong();
                    }
                });

            } catch (Exception e) {
                e.printStackTrace();
            }
    }

    public String currentlyPlaying(){
        return "Currently playing: "+songs.get(currentSongIndex).getTitle();
    }
    public int currentlyPlayingIndex(){
        if (player == null) {
            return -1;
        }
        return currentSongIndex;
    }

    public void setAutoPlay(boolean autoPlay) {
        this.autoPlay = autoPlay;
        System.out.println("AutoPlay: "+autoPlay);
    }

    public void playSongAtIndex(int index){
        if(index < 0 || index >= songs.size()){
            return;
        }
        this.currentSongIndex = index;
        this.playSong(songs.get(currentSongIndex).getPath());
    }

    public void nextSong(){
        currentSongIndex++;
        if(currentSongIndex >= songs.size()){
            currentSongIndex = 0;
        }
        this.playSongAtIndex(currentSongIndex);
    }

    public void previousSong(){
        currentSongIndex--;
        if(currentSongIndex < 0){
            currentSongIndex = songs.size()-1;
        }
        this.playSongAtIndex(currentSongIndex);
    }

    public void pauseSong(){
        if(player != null){
            player.pause();
        }
    }
    public void resumeSong(){
        if(player != null){
            player.play();
        }
    }

    public void stopSong(){
        releasePlayer(true);
    }

    public void deleteSong(int index) {
        //fakin lol
        songs.remove(index);
    }

    public PlayerStatus getStatus() {
        return readOnFxThread(this::buildStatusSnapshot);
    }

    private PlayerStatus buildStatusSnapshot() {
        MediaPlayer currentPlayer = this.player;
        MediaPlayer.Status status = currentPlayer != null ? currentPlayer.getStatus() : null;

        boolean isPaused = status == MediaPlayer.Status.PAUSED;
        boolean isPlaying = status == MediaPlayer.Status.PLAYING;

        long positionMs = 0L;
        long durationMs = 0L;

        if (currentPlayer != null) {
            Duration currentTime = currentPlayer.getCurrentTime();
            Duration totalDuration = currentPlayer.getTotalDuration();

            if (currentTime != null && !currentTime.isUnknown() && !currentTime.isIndefinite()) {
                positionMs = Math.max(0L, (long) currentTime.toMillis());
            }

            if (totalDuration != null && !totalDuration.isUnknown() && !totalDuration.isIndefinite()) {
                durationMs = Math.max(0L, (long) totalDuration.toMillis());
            }
        }

        int songIndex = -1;
        Song song = null;
        if (currentPlayer != null && currentSongIndex >= 0 && currentSongIndex < songs.size()) {
            songIndex = currentSongIndex;
            song = songs.get(currentSongIndex);
        }

        return new PlayerStatus(songIndex, isPaused, isPlaying, positionMs, durationMs, song);
    }

    private <T> T readOnFxThread(Supplier<T> supplier) {
        if (Platform.isFxApplicationThread()) {
            return supplier.get();
        }

        CompletableFuture<T> future = new CompletableFuture<>();
        try {
            Platform.runLater(() -> {
                try {
                    future.complete(supplier.get());
                } catch (Exception ex) {
                    future.completeExceptionally(ex);
                }
            });
            return future.get(250, TimeUnit.MILLISECONDS);
        } catch (IllegalStateException | InterruptedException | ExecutionException | TimeoutException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            return supplier.get();
        }
    }

    private void releasePlayer(boolean clearIndex) {
        if (player != null) {
            player.stop();
            player.dispose();
            player = null;
        }

        if (clearIndex) {
            currentSongIndex = -1;
        }
    }
}

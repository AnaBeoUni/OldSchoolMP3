package com.example.oldschoolmp3.service;
import javafx.scene.media.Media;
import javafx.scene.media.MediaPlayer;
import lombok.Getter;
import com.example.oldschoolmp3.model.Song;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.List;

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
                stopSong();
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
        if(player != null){
            player.stop();
        }

    }

    public void deleteSong(int index) {
        //fakin lol
        songs.remove(index);
    }
}

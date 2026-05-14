package com.example.oldschoolmp3.service;

import com.example.oldschoolmp3.model.Song;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

@Service
public class MusicLibraryService {

    private final String SONGS_FOLDER = "C:\\Users\\edvin\\OneDrive\\Stalinis kompiuteris\\Old School MP3\\backend\\Songs";

    public List<Song> loadAllSongs(){

        List<Song> songs = new ArrayList<>();
        File folder = new File(SONGS_FOLDER);

        //automatiskai nuskaito visus failus File objeko "listFiles()" :D
        File[] files = folder.listFiles();

        if(files == null) {
            System.out.println("Folder is empty! Add some songs and start groovin!~");
            return songs;
        };

        System.out.println("Loading songs. . .");
        for(File file : files){

            if(file.getName().endsWith(".mp3")){

                String title = file.getName();
                String path = file.getAbsolutePath();

                Song song = new Song(title, path);
                songs.add(song);

            }

        }
        System.out.println("[ "+songs.size()+" songs have been loaded YEEHAW! ]");

        return songs;
    }

}

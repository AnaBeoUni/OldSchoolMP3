package com.example.oldschoolmp3.service;

import com.example.oldschoolmp3.model.Playlist;
import com.example.oldschoolmp3.model.Song;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

@Service
public class MusicLibraryService {

    private final String SONGS_FOLDER =
            "C:\\Users\\edvin\\OneDrive\\Stalinis kompiuteris\\Old School MP3\\backend\\Songs";

    public List<Playlist> loadPlaylists() {

        File musicFolder = new File(SONGS_FOLDER);
        List<Playlist> playlists = new ArrayList<>();

        // ROOT SONGS
        List<Song> rootSongs = loadSongsFromFolder(musicFolder);

        if (!rootSongs.isEmpty()) {
            playlists.add(new Playlist("All Songs", rootSongs));
        }

        // SUBFOLDERS
        File[] folders = musicFolder.listFiles(File::isDirectory);

        if (folders != null) {
            for (File folder : folders) {
                List<Song> songs = loadSongsFromFolder(folder);
                playlists.add(new Playlist(folder.getName(), songs));
            }
        }

        return playlists;
    }

    private List<Song> loadSongsFromFolder(File folder) {
        List<Song> songs = new ArrayList<>();

        File[] files = folder.listFiles();
        if (files == null) return songs;

        int idCounter = 0;

        for (File file : files) {
            if (file.getName().toLowerCase().endsWith(".mp3")) {

                songs.add(new Song(
                        file.getAbsolutePath(), // 🔥 ID = FULL PATH (safe & unique)
                        file.getName(),
                        file.getAbsolutePath()
                ));
            }
        }

        return songs;
    }

    public List<Song> loadAllSongs() {

        List<Song> songs = new ArrayList<>();
        File folder = new File(SONGS_FOLDER);

        File[] files = folder.listFiles();
        if (files == null) {
            System.out.println("Folder empty");
            return songs;
        }

        for (File file : files) {
            if (file.getName().toLowerCase().endsWith(".mp3")) {

                songs.add(new Song(
                        file.getAbsolutePath(),   // 🔥 ID
                        file.getName(),
                        file.getAbsolutePath()
                ));
            }
        }

        System.out.println("[ " + songs.size() + " songs loaded ]");
        return songs;
    }
}
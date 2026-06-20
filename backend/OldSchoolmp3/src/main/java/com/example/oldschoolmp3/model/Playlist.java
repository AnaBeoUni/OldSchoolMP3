package com.example.oldschoolmp3.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
@Setter
@Getter
@AllArgsConstructor
public class Playlist {

    private String name;
    private List<Song> songs;


}

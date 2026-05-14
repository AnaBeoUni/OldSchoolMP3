package com.example.oldschoolmp3.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Song {
    String title;
    String path;

    @Override
    public String toString() {
        return "Song{" +
                "title='" + title + '\'' +
                ", path='" + path + '\'' +
                '}';
    }
}

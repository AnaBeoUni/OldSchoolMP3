package com.example.oldschoolmp3.model;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PlayerStatus {
    private int songIndex;
    private boolean isPaused;
    private boolean isPlaying;
    private long positionMs;
    private long durationMs;
    private Song song;
}

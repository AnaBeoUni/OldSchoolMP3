package com.example.oldschoolmp3;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.SpringApplication;
import javafx.embed.swing.JFXPanel;

@SpringBootApplication
public class OldSchoolmp3Application {

    public static void main(String[] args) {

        new JFXPanel();

        SpringApplication.run(OldSchoolmp3Application.class, args);

    }

}

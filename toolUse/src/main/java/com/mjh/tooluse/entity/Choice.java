package com.mjh.tooluse.entity;

public class Choice {
    private Message message;

    public Choice() {}

    public Choice(Message message) {
        this.message = message;
    }

    public Message getMessage() {
        return message;
    }

    public void setMessage(Message message) {
        this.message = message;
    }
}

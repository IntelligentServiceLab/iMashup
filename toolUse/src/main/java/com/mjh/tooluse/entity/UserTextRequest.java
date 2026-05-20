package com.mjh.tooluse.entity;

public class UserTextRequest {
    private String userText;
    private String sessionId;
    private String username;

    public UserTextRequest(String userText, String sessionId, String username) {
        this.userText = userText;
        this.sessionId = sessionId;
        this.username = username;
    }

    public String getUserText() {
        return userText;
    }

    public void setUserText(String userText) {
        this.userText = userText;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}

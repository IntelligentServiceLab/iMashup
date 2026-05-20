package com.mjh.tooluse.entity;

public class SesssionRequest {
    private String sessionId;
    private String username;
    private Ai ai;

    public SesssionRequest(String sessionId, String username, Ai ai) {
        this.sessionId = sessionId;
        this.username = username;
        this.ai = ai;
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

    public Ai getAi() {
        return ai;
    }

    public void setAi(Ai ai) {
        this.ai = ai;
    }
}

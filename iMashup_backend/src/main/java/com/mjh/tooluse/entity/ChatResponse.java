package com.mjh.tooluse.entity;

//对话响应DTO
public class ChatResponse {
    private int code;
    private String message;
    private String userId;
    private String response;

    public ChatResponse() {}

    public ChatResponse(int code, String userId, String message, String response) {
        this.code = code;
        this.userId = userId;
        this.message = message;
        this.response = response;
    }

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getResponse() {
        return response;
    }

    public void setResponse(String response) {
        this.response = response;
    }
}


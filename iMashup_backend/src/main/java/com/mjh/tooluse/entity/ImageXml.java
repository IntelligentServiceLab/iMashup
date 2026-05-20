package com.mjh.tooluse.entity;

public class ImageXml {
    private String recordId;
    private String username;
    private String content;
    private String imageUrl;

    public ImageXml(String recordId, String username, String content, String imageUrl) {
        this.recordId = recordId;
        this.username = username;
        this.content = content;
        this.imageUrl = imageUrl;
    }

    public String getRecordId() {
        return recordId;
    }

    public void setRecordId(String recordId) {
        this.recordId = recordId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}

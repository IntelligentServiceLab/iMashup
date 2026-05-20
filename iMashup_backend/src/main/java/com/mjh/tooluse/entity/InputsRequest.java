package com.mjh.tooluse.entity;

public class InputsRequest {
    private String finalUrl;

    public InputsRequest() {}

    public InputsRequest(String finalUrl) {
        this.finalUrl = finalUrl;
    }

    public String getFinalUrl() {
        return finalUrl;
    }

    public void setFinalUrl(String finalUrl) {
        this.finalUrl = finalUrl;
    }
}

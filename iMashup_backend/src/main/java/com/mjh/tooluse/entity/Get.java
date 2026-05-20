package com.mjh.tooluse.entity;

public class Get {
    private String urlValueName;
    private String urlValue;

    public Get(String urlValueName, String urlValue) {
        this.urlValueName = urlValueName;
        this.urlValue = urlValue;
    }

    public String getUrlValueName() {
        return urlValueName;
    }

    public void setUrlValueName(String urlValueName) {
        this.urlValueName = urlValueName;
    }

    public String getUrlValue() {
        return urlValue;
    }

    public void setUrlValue(String urlValue) {
        this.urlValue = urlValue;
    }

    @Override
    public String toString() {
        return "Get{" +
                "urlValueName:'" + urlValueName + '\'' +
                ", urlValue:'" + urlValue + '\'' +
                '}';
    }
}

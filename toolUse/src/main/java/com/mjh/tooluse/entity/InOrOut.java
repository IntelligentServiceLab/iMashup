package com.mjh.tooluse.entity;

import com.fasterxml.jackson.annotation.JsonProperty;

public class InOrOut {
    private String id;
    @JsonProperty("res")
    private String res;

    public InOrOut() {}

    public InOrOut(String id, String res) {
        this.id = id;
        this.res = res;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getRes() {
        return res;
    }

    public void setRes(String res) {
        this.res = res;
    }

    @Override
    public String toString() {
        return "InOrOut{" +
                "id:'" + id + '\'' +
                ", res:'" + res + '\'' +
                '}';
    }
}

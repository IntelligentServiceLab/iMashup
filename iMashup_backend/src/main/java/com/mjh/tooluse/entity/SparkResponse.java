package com.mjh.tooluse.entity;

import java.util.List;

//星火API响应结构
public class SparkResponse {
    private List<Choice> choices;

    public SparkResponse() {}

    public SparkResponse(List<Choice> choices) {
        this.choices = choices;
    }

    public List<Choice> getChoices() {
        return choices;
    }

    public void setChoices(List<Choice> choices) {
        this.choices = choices;
    }
}

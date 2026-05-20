package com.mjh.tooluse.entity;

import java.util.List;

public class LlmSubTaskResponse {
    private Integer code;
    private String msg;
    private List<SubTask> data;

    public Integer getCode() {
        return code;
    }

    public void setCode(Integer code) {
        this.code = code;
    }

    public String getMsg() {
        return msg;
    }

    public void setMsg(String msg) {
        this.msg = msg;
    }

    public List<SubTask> getData() {
        return data;
    }

    public void setData(List<SubTask> data) {
        this.data = data;
    }
}

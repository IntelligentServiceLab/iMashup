package com.mjh.tooluse.entity;

public class RequestPython {
    private String taskName;
    private String taskContentEn;

    public RequestPython(String taskName, String taskContentEn) {
        this.taskName = taskName;
        this.taskContentEn = taskContentEn;
    }

    public String getTaskName() {
        return taskName;
    }

    public void setTaskName(String taskName) {
        this.taskName = taskName;
    }

    public String getTaskContentEn() {
        return taskContentEn;
    }

    public void setTaskContentEn(String taskContentEn) {
        this.taskContentEn = taskContentEn;
    }
}

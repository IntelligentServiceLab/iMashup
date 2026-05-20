package com.mjh.tooluse.entity;

import java.util.List;

public class SubTask {
    private String taskId;
    private String taskName;
    private String taskNameEn;
    private String taskContent;
    private String taskContentEn;
    private Integer taskOrder;
    private List<String> nextTasks;

    public String getTaskId() {
        return taskId;
    }

    public void setTaskId(String taskId) {
        this.taskId = taskId;
    }

    public String getTaskName() {
        return taskName;
    }

    public void setTaskName(String taskName) {
        this.taskName = taskName;
    }

    public String getTaskNameEn() {
        return taskNameEn;
    }

    public void setTaskNameEn(String taskNameEn) {
        this.taskNameEn = taskNameEn;
    }

    public String getTaskContent() {
        return taskContent;
    }

    public void setTaskContent(String taskContent) {
        this.taskContent = taskContent;
    }

    public Integer getTaskOrder() {
        return taskOrder;
    }

    public void setTaskOrder(Integer taskOrder) {
        this.taskOrder = taskOrder;
    }

    public String getTaskContentEn() {
        return taskContentEn;
    }

    public void setTaskContentEn(String taskContentEn) {
        this.taskContentEn = taskContentEn;
    }

    public List<String> getNextTasks() {
        return nextTasks;
    }

    public void setNextTasks(List<String> nextTasks) {
        this.nextTasks = nextTasks;
    }
}

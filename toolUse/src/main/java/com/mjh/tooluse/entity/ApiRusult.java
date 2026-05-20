package com.mjh.tooluse.entity;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class ApiRusult {
    private int code;
    private String msg;
    private List<ApiInfo> data;

    public ApiRusult(int code, String msg, List<ApiInfo> data) {
        this.code = code;
        this.msg = msg;
        this.data = data;
    }

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public String getMsg() {
        return msg;
    }

    public void setMsg(String msg) {
        this.msg = msg;
    }

    public List<ApiInfo> getData() {
        return data;
    }

    public void setData(List<ApiInfo> data) {
        this.data = data;
    }

    @Override
    public String toString() {
        return "{" +
                "code:" + code +
                ", msg:'" + msg + '\'' +
                ", data" + data +
                '}';
    }

    public static class ApiInfo {
        private String taskId;
        private String taskName;
        @JsonProperty("API链接")
        private String apiLink;
        private Double score;

        public ApiInfo(String taskId, String taskName, String apiLink, Double score) {
            this.taskId = taskId;
            this.taskName = taskName;
            this.apiLink = apiLink;
            this.score = score;
        }

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

        public String getApiLink() {
            return apiLink;
        }

        public void setApiLink(String apiLink) {
            this.apiLink = apiLink;
        }

        public Double getScore() {
            return score;
        }

        public void setScore(Double score) {
            this.score = score;
        }

//        @Override
//        public String toString() {
//            return "{" +
//                    "index:" + index +
//                    ", apiLink:'" + apiLink + '\'' +
//                    ", score:" + score +
//                    '}';
//        }

        @Override
        public String toString() {
            return "ApiInfo{" +
                    "taskId:'" + taskId + '\'' +
                    ", taskName:'" + taskName + '\'' +
                    ", apiLink:'" + apiLink + '\'' +
                    ", score:" + score +
                    '}';
        }
    }
}

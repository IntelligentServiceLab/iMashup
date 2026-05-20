package com.mjh.tooluse.entity;

public class Edge {
    private String id;
    private String type;
    private String source;
    private String sourceHandle;
    private String target;
    private String targetHandle;

    public Edge() {}

    public Edge(String id, String type, String source, String sourceHandle, String target, String targetHandle) {
        this.id = id;
        this.type = type;
        this.source = source;
        this.sourceHandle = sourceHandle;
        this.target = target;
        this.targetHandle = targetHandle;
    }

    public String getSourceHandle() {
        return sourceHandle;
    }

    public void setSourceHandle(String sourceHandle) {
        this.sourceHandle = sourceHandle;
    }

    public String getTargetHandle() {
        return targetHandle;
    }

    public void setTargetHandle(String targetHandle) {
        this.targetHandle = targetHandle;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getTarget() {
        return target;
    }

    public void setTarget(String target) {
        this.target = target;
    }

    @Override
    public String toString() {
        return "Edge{" +
                "id:'" + id + '\'' +
                ", type:'" + type + '\'' +
                ", source:'" + source + '\'' +
                ", sourceHandle:'" + sourceHandle + '\'' +
                ", target:'" + target + '\'' +
                ", targetHandle:'" + targetHandle + '\'' +
                '}';
    }
}

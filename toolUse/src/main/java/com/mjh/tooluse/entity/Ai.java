package com.mjh.tooluse.entity;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Ai {
    private List<Node> nodes;
    private List<Edge> edges;

    public Ai() {}

    public Ai(List<Node> nodes, List<Edge> edges) {
        this.nodes = nodes;
        this.edges = edges;
    }

    public List<Node> getNodes() {
        return nodes;
    }

    public void setNodes(List<Node> nodes) {
        this.nodes = nodes;
    }

    public List<Edge> getEdges() {
        return edges;
    }

    public void setEdges(List<Edge> edges) {
        this.edges = edges;
    }

    @Override
    public String toString() {
        return "Ai{" +
                "nodes:" + nodes +
                ", edges:" + edges +
                '}';
    }
}

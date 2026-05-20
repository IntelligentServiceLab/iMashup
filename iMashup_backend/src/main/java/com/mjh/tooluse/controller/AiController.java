package com.mjh.tooluse.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mjh.tooluse.entity.*;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;

@RestController
public class AiController {
    @PostMapping("/url")
    public List<Node> url(@RequestBody Ai ai) throws IOException, InterruptedException {
        System.out.println(ai);
        //获取所有节点
        List<Node> nodesBegin = ai.getNodes();

        //获取所有的边
        List<Edge> edgesLine = ai.getEdges();

        //获取边中的逻辑
        String[] edgeNames = new String[edgesLine.size()];
        for (int i = 0; i < edgesLine.size(); i++) {
            String edgesSource = edgesLine.get(i).getSource();
            String edgesTarget = edgesLine.get(i).getTarget();
            String edgeName = edgesSource + "->" + edgesTarget;
            edgeNames[i] = edgeName;
        }

        // 构建图
        Map<String, Set<String>> graph = new HashMap<>();
        Map<String, Integer> inDegree = new HashMap<>();

        for (String edgeName : edgeNames) {
            String[] nodeName = edgeName.split("->");
            String nodeA = nodeName[0];
            String nodeB = nodeName[1];

            graph.putIfAbsent(nodeA, new HashSet<>());
            graph.get(nodeA).add(nodeB);

            graph.putIfAbsent(nodeB, new HashSet<>());

            // 记录入度
            inDegree.put(nodeB, inDegree.getOrDefault(nodeB, 0) + 1);
            inDegree.putIfAbsent(nodeA, 0);
        }

        // 执行拓扑排序
        List<String> sortedOrder = topologicalSort(graph, inDegree);

        // 输出排序后的节点顺序
        System.out.println("排序后的节点顺序: " + sortedOrder);

        //定义一个排序后的节点顺序
        List<Node> nodes = new ArrayList<>();

        //根据节点顺序，将节点进行排序
        for (int e = 0; e < sortedOrder.size(); e++) {
            for (int n = 0; n < nodesBegin.size(); n++) {
                if (nodesBegin.get(n).getId().equals(sortedOrder.get(e))) {
                    nodes.add(nodesBegin.get(n));
                }
            }
        }

        String label1 = nodes.get(0).getData().getLabel();
        for (int k = 0; k < nodes.size(); k++) {
            if (nodes.get(k).getData().getUrlLine() != null){
                //定义一个数组接收该节点的输出中的 text
                List<ResultList> resultList = new ArrayList<>();
                //获取 url
                String urlBegin = nodes.get(k).getData().getUrlLine();
                System.out.println("urlBegin:" + urlBegin);

                //获取 header 中 x-rapidapi-host
                String host = UriComponentsBuilder.fromHttpUrl(urlBegin).build().getHost();
                System.out.println("host:" + host);

                //获取方法类型：GET or POST
                String way = nodes.get(k).getData().getMethod();
                System.out.println("way:" + way);

                //找出该节点对应的参数名和参数值
                List<Node.Data.Input> inputsK = nodes.get(k).getData().getInputs();
                System.out.println("inputsK:" + inputsK);
                List<Body> bodys  = new ArrayList<>();
                for (int i = 0; i < inputsK.size(); i++) {
                    for (int j = 0; j <= k; j++) {
                        if (inputsK.get(i).getValue().getName().equals(nodes.get(j).getData().getLabel())){
                            List<Node.Data.Input> inputIn = nodes.get(j).getData().getInputs();
                            List<Node.Data.Output> outputIn = new ArrayList<>();
                            if (nodes.get(j).getData().getOutputs() != null){
                                outputIn = nodes.get(j).getData().getOutputs();
                            }
                            for (int in = 0; in < inputIn.size(); in++){
                                if (inputsK.get(i).getValue().getInput().equals(nodes.get(j).getData().getInputs().get(in).getName())){
                                    // 将数据存到 getBody 数组中
                                    Body body = new Body(
                                            inputsK.get(i).getValue().getUrlValueName(),
                                            nodes.get(j).getData().getInputs().get(in).getText()
                                    );
                                    bodys.add(body);
                                }
                            }
                            if (!outputIn.isEmpty()){
                                for (int out = 0; out < outputIn.size(); out++){
                                    if (inputsK.get(i).getValue().getInput().equals(nodes.get(j).getData().getOutputs().get(out).getName())){
                                        // 将数据存到 getBody 数组中
                                        Body body= new Body(
                                                inputsK.get(i).getValue().getUrlValueName(),
                                                nodes.get(j).getData().getOutputs().get(out).getText()
                                        );
                                        bodys.add(body);
                                    }
                                }
                            }
                        }
                    }
                }
                for (int i = 0; i < bodys.size(); i++){
                    System.out.println("bodys:" + bodys.get(i));
                }

                //组合 GET 的请求 URL
                //初始化一个 StringBuilder 用于拼接字符串
//                StringBuilder urlInputs = new StringBuilder();

                //组合最终的GET-url
//                int beginGet = 0;
//                List<InputsRequest> inputsRequestsUrl = new ArrayList<>();
//                if ("GET".equalsIgnoreCase(way)){
//                    for (int i = beginGet; i < bodys.size(); i++) {
//                        String getUrlValueName = bodys.get(beginGet).getUrlValueName();
//                        if (bodys.get(i).getUrlValueName().equals(getUrlValueName) && i != beginGet){
//                            beginGet = i;
//                            String finalUrl = urlBegin + "?" + urlInputs;
//                            InputsRequest inputsRequest = new InputsRequest(finalUrl);
//                            inputsRequestsUrl.add(inputsRequest);
//                            urlInputs.setLength(0);
//                            // 结束当前循环，跳到新的 i = begin 继续
//                            // 在循环末尾 i 会自增，所以设置为 begin - 1 来实现新的开始
//                            i = beginGet - 1;
//                        } else if (i == bodys.size() - 1){
//                            urlInputs.append("&");
//                            // 拼接当前的 requestInput
//                            urlInputs.append(bodys.get(i).getUrlValueName());
//                            urlInputs.append("=");
//                            urlInputs.append(bodys.get(i).getUrlValue());
//                            String finalUrl = urlBegin + "?" + urlInputs;
//                            InputsRequest inputsRequest = new InputsRequest(finalUrl);
//                            inputsRequestsUrl.add(inputsRequest);
//                        } else {
//                            if (i - beginGet > 0){
//                                urlInputs.append("&");
//                            }
//                            // 拼接当前的 requestInput
//                            urlInputs.append(bodys.get(i).getUrlValueName());
//                            urlInputs.append("=");
//                            urlInputs.append(bodys.get(i).getUrlValue());
//                        }
//                    }
//                }
                // 组合最终的GET-url（支持同名参数拼接）
                int beginGet = 0;
                List<InputsRequest> inputsRequestsUrl = new ArrayList<>();

                if ("GET".equalsIgnoreCase(way)) {
                    Map<String, StringBuilder> paramMap = new HashMap<>();
                    for (Body body : bodys) {
                        String key = body.getUrlValueName();
                        String val = body.getUrlValue().toString();
                        if (paramMap.containsKey(key)) {
                            paramMap.get(key).append(" ").append(val);
                        } else {
                            paramMap.put(key, new StringBuilder(val));
                        }
                    }

                    // 拼接成最终一个URL
                    StringBuilder urlInputs = new StringBuilder();
                    for (Map.Entry<String, StringBuilder> entry : paramMap.entrySet()) {
                        if (!urlInputs.isEmpty()) {
                            urlInputs.append("&");
                        }
                        urlInputs.append(entry.getKey()).append("=").append(entry.getValue());
                    }

                    String finalUrl = urlBegin + "?" + urlInputs;
                    InputsRequest inputsRequest = new InputsRequest(finalUrl);
                    inputsRequestsUrl.add(inputsRequest);
                }
                for (InputsRequest inputsRequest : inputsRequestsUrl) {
                    System.out.println("inputsRequestsUrl:" + inputsRequest);
                }


                // GET 的请求
                for (InputsRequest inputsRequest : inputsRequestsUrl) {
                    HttpRequest request = null;
                    if ("GET".equalsIgnoreCase(way)) {
                        String endUrl = inputsRequest.getFinalUrl();
                        //请求
                        request = HttpRequest.newBuilder()
                                .uri(URI.create(endUrl))
                                .header("x-rapidapi-key", "49ae8595d7msh24cc0dcd7f05ed5p183d1fjsn43672a8cab9b")
                                .header("x-rapidapi-host", host)
                                .method("GET", HttpRequest.BodyPublishers.noBody())
                                .build();
                    }
                    HttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
                    System.out.println(response.body());
                    String jsonResponse = response.body();

                    // 解析 JSON 数据
                    ObjectMapper objectMapper = new ObjectMapper();
                    JsonNode rootNode = objectMapper.readTree(jsonResponse);

                    // 遍历并存储所有有值的节点到 List
                    traverseJsonNode(rootNode, "", resultList);
                }

                // 组合最终的 POST-body
                int beginPost = 0;
                List<String> inputsRequestsBody  = new ArrayList<>();
                Map<String, Object> message = new HashMap<>();
                Map<String, Object> messageEmpt = new HashMap<>();
                List<Map<String, Object>> messageList = new ArrayList<>();
                List<Map<String, Object>> messageListEmpt = new ArrayList<>();

                if ("POST".equals(way)) {
                    boolean hasEmptyValue = false;
                    for (int j = beginPost; j < bodys.size(); j++){
                        // 处理是否出现 {}
                        if (!hasEmptyValue && bodys.get(j).getUrlValue().equals("{}")) {
                            hasEmptyValue = true;

                            for (int empt = j + 1; empt < bodys.size(); empt++){
//                                messageEmpt.put(bodys.get(empt).getUrlValueName(), bodys.get(empt).getUrlValue());
                                String key = bodys.get(empt).getUrlValueName();
                                Object val = bodys.get(empt).getUrlValue();
                                if (messageEmpt.containsKey(key)) {
                                    messageEmpt.put(key, messageEmpt.get(key) + " " + val);
                                } else {
                                    messageEmpt.put(key, val);
                                }
                                if (empt == bodys.size() - 1){
                                    messageListEmpt.add(messageEmpt);
                                    message.put(bodys.get(j).getUrlValueName(), messageListEmpt);
                                    messageList.add(message);
                                }
                            }

                            break;
                        } else {
                            String getUrlValueName = bodys.get(beginPost).getUrlValueName();
                            if (bodys.get(j).getUrlValueName().equals(getUrlValueName) && j != beginPost){
                                messageList.add(message);
                                message = new HashMap<>();
                                beginPost = j;
                                j = beginPost - 1;
                            } else if (j == bodys.size() - 1){
//                                message.put(bodys.get(j).getUrlValueName(), bodys.get(j).getUrlValue());
                                String key = bodys.get(j).getUrlValueName();
                                Object val = bodys.get(j).getUrlValue();
                                if (message.containsKey(key)) {
                                    message.put(key, message.get(key) + " " + val);
                                } else {
                                    message.put(key, val);
                                }
                                messageList.add(message);
                            } else {
//                                message.put(bodys.get(j).getUrlValueName(), bodys.get(j).getUrlValue());
                                String key = bodys.get(j).getUrlValueName();
                                Object val = bodys.get(j).getUrlValue();
                                if (message.containsKey(key)) {
                                    message.put(key, message.get(key) + " " + val);
                                } else {
                                    message.put(key, val);
                                }
                            }
                        }
                    }

                    ObjectMapper objectMapper = new ObjectMapper();
                    String json = objectMapper.writeValueAsString(messageList);
                    System.out.println(json);
                    inputsRequestsBody.add(json);
                    System.out.println(inputsRequestsBody);
                }

                System.out.println("inputsRequestsBody.size:" + inputsRequestsBody.size());

                if (inputsRequestsBody.size() == 1) {
                    // 如果只有一个请求体，获取该请求体
                    String singleRequestBody = inputsRequestsBody.get(0);
                    System.out.println("原始请求体:" + singleRequestBody + ";");

                    // 检查是否是JSON数组格式（以 [ 开头，以 ] 结尾）
                    if (singleRequestBody.startsWith("[") && singleRequestBody.endsWith("]")) {
                        try {
                            // 使用Jackson解析JSON数组
                            ObjectMapper objectMapper = new ObjectMapper();
                            JsonNode arrayNode = objectMapper.readTree(singleRequestBody);

                            // 检查数组长度
                            if (arrayNode.isArray()) {
                                if (arrayNode.size() == 1) {
                                    // 如果数组中只有一个元素，提取该元素
                                    singleRequestBody = objectMapper.writeValueAsString(arrayNode.get(0));
                                    System.out.println("处理后的请求体(单元素数组):" + singleRequestBody + ";");
                                } else {
                                    // 如果数组中有多个元素，保持原格式
                                    System.out.println("处理后的请求体(多元素数组):" + singleRequestBody + ";");
                                }
                            }
                        } catch (JsonProcessingException e) {
                            e.printStackTrace();
                            // 解析失败时，使用原始字符串
                            System.out.println("JSON解析失败，使用原始请求体");
                        }
                    }

                    // 构建并发送HTTP请求
                    HttpRequest request = HttpRequest.newBuilder()
                            .uri(URI.create(urlBegin))
                            .header("x-rapidapi-key", "49ae8595d7msh24cc0dcd7f05ed5p183d1fjsn43672a8cab9b")
                            .header("x-rapidapi-host", host)
                            .header("Content-Type", "application/json")
                            .method("POST", HttpRequest.BodyPublishers.ofString(singleRequestBody))
                            .build();

                    HttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
                    System.out.println(response.body());
                    String jsonResponse = response.body();

                    // 解析 JSON 数据
                    ObjectMapper objectMapper = new ObjectMapper();
                    JsonNode rootNode = objectMapper.readTree(jsonResponse);

                    // 遍历并存储所有有值的节点到 List
                    traverseJsonNode(rootNode, "", resultList);
                } else {
                    // 处理多个请求体的情况
                    for (String s : inputsRequestsBody) {
                        HttpRequest request = null;
                        request = HttpRequest.newBuilder()
                                .uri(URI.create(urlBegin))
                                .header("x-rapidapi-key", "49ae8595d7msh24cc0dcd7f05ed5p183d1fjsn43672a8cab9b")
                                .header("x-rapidapi-host", host)
                                .header("Content-Type", "application/json")
                                .method("POST", HttpRequest.BodyPublishers.ofString(s))
                                .build();
                        HttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
                        System.out.println(response.body());
                        String jsonResponse = response.body();

                        // 解析 JSON 数据
                        ObjectMapper objectMapper = new ObjectMapper();
                        JsonNode rootNode = objectMapper.readTree(jsonResponse);

                        // 遍历并存储所有有值的节点到 List
                        traverseJsonNode(rootNode, "", resultList);
                    }
                }

                //将输出放到该节点的 outputs 中
                if (!resultList.isEmpty()) {
                    for (int i = 0; i < nodes.get(k).getData().getOutputs().size(); i++) {
                        nodes.get(k).getData().getOutputs().get(i).setText(resultList.get(i).getValue());
                    }
                }
            }

            //输入到最后一个节点的out中
            List<Node.Data.Input> inputsEndNode = nodes.get(0).getData().getInputs();

            if (k == nodes.size() - 1){
                System.out.println(k);
                List<Node.Data.Output> endNodeOutputs =nodes.get(k).getData().getOutputs();
                for (Node.Data.Output endNodeOutput : endNodeOutputs) {
                    if (endNodeOutput.getValue().getName().equals(label1)) {
                        for (Node.Data.Input input : inputsEndNode) {
                            if (endNodeOutput.getValue().getInput().equals(input.getName())) {
                                endNodeOutput.getValue().setText(input.getText());
                            }
                        }
                    }
                    for (int h = 1; h < nodes.size(); h++) {
                        if (endNodeOutput.getValue().getName().equals(nodes.get(h).getData().getLabel())) {
                            for (int o = 0; o < nodes.get(h).getData().getOutputs().size(); o++) {
                                if (endNodeOutput.getValue().getInput().equals(nodes.get(h).getData().getOutputs().get(o).getName())) {
                                    endNodeOutput.getValue().setText(nodes.get(h).getData().getOutputs().get(o).getText());
                                    System.out.println("1");
                                }
                            }
                        }
                    }
                }
            }
        }
        System.out.println(nodes);
        return nodes;
    }

    // 拓扑排序
    public static List<String> topologicalSort(Map<String, Set<String>> graph, Map<String, Integer> inDegree) {
        List<String> sortedOrder = new ArrayList<>();
        Queue<String> queue = new LinkedList<>();

        // 初始化队列，将所有入度为0的节点加入队列
        for (String node : inDegree.keySet()) {
            if (inDegree.get(node) == 0) {
                queue.offer(node);
            }
        }

        // 进行拓扑排序
        while (!queue.isEmpty()) {
            String current = queue.poll();
            sortedOrder.add(current);

            // 遍历所有与当前节点相连的邻接节点
            if (graph.containsKey(current)) {
                for (String neighbor : graph.get(current)) {
                    // 减少邻接节点的入度
                    inDegree.put(neighbor, inDegree.get(neighbor) - 1);
                    // 如果入度为0，加入队列
                    if (inDegree.get(neighbor) == 0) {
                        queue.offer(neighbor);
                    }
                }
            }
        }

        // 返回拓扑排序的结果
        return sortedOrder;
    }

    private static void traverseJsonNode(JsonNode node, String path, List<ResultList> resultList) {
        if (node.isObject()) {
            node.fieldNames().forEachRemaining(fieldName -> {
                String newPath = path.isEmpty() ? fieldName : path + "." + fieldName;
                traverseJsonNode(node.get(fieldName), newPath, resultList);
            });
        } else if (node.isArray()) {
            for (int i = 0; i < node.size(); i++) {
                String newPath = path + "[" + i + "]";
                traverseJsonNode(node.get(i), newPath, resultList);
            }
        } else if (!node.isNull()) {
            resultList.add(new ResultList(path, node.asText()));
        }
    }
}
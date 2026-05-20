package com.mjh.tooluse.controller;

import com.alibaba.fastjson.JSON;
import com.mjh.tooluse.entity.ChatRequest;
import com.mjh.tooluse.entity.ChatResponse;
import com.mjh.tooluse.entity.RoleContent;
import com.mjh.tooluse.entity.SparkResponse;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;


@Controller
@RequestMapping("/api/ai")
public class ModelController {

    private static final String API_HEADER = "Bearer 8b8a17589f70b4d6913513cede276e37:NmVhMGZhZGE0OGUxMzkzNmU2ZmE3YWY0";
    static final ConcurrentHashMap<String, List<RoleContent>> userHistories = new ConcurrentHashMap<>();

    public String callAIModel(String userId, String userMessage) {
        try {
            // 获取或创建用户历史
            List<RoleContent> historyList = userHistories.getOrDefault(userId, new ArrayList<>());

            // 构建请求JSON
            com.alibaba.fastjson.JSONObject jsonObject = new com.alibaba.fastjson.JSONObject();
            jsonObject.put("user", userId);
            jsonObject.put("model", "lite");

            com.alibaba.fastjson.JSONArray messagesArray = new com.alibaba.fastjson.JSONArray();
            if (!historyList.isEmpty()) {
                for (RoleContent history : historyList) {
                    com.alibaba.fastjson.JSONObject msg = new com.alibaba.fastjson.JSONObject();
                    msg.put("role", history.getRole());
                    msg.put("content", history.getContent());
                    messagesArray.add(msg);
                }
            }
            // 添加当前消息
            com.alibaba.fastjson.JSONObject currentMsg = new com.alibaba.fastjson.JSONObject();
            currentMsg.put("role", "user");
            currentMsg.put("content", userMessage);
            messagesArray.add(currentMsg);

            // 保存用户消息到内存历史
            RoleContent userRoleContent = new RoleContent("user", userMessage);
            historyList.add(userRoleContent);

            jsonObject.put("messages", messagesArray);
            jsonObject.put("stream", false);
            jsonObject.put("max_tokens", 4096);
            jsonObject.put("temperature", 0.1);

            // 发送请求
            URL apiUrl = new URL("https://spark-api-open.xf-yun.com/v1/chat/completions");
            HttpURLConnection connection = (HttpURLConnection) apiUrl.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Authorization", API_HEADER);
            connection.setDoOutput(true);

            try (OutputStream os = connection.getOutputStream()) {
                os.write(jsonObject.toJSONString().getBytes());
                os.flush();
            }

            // 解析响应
            if (connection.getResponseCode() == HttpURLConnection.HTTP_OK) {
                StringBuilder response = new StringBuilder();
                try (BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()))) {
                    String inputLine;
                    while ((inputLine = in.readLine()) != null) {
                        response.append(inputLine);
                    }
                }

                SparkResponse sparkResponse = JSON.parseObject(response.toString(), SparkResponse.class);
                if (sparkResponse != null && sparkResponse.getChoices() != null && !sparkResponse.getChoices().isEmpty()) {
                    String aiResponse = sparkResponse.getChoices().get(0).getMessage().getContent();
                    // 保存AI回复到内存历史
                    RoleContent aiRoleContent = new RoleContent("assistant", aiResponse);
                    historyList.add(aiRoleContent);
                    userHistories.put(userId, historyList);
                    return aiResponse;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "调用AI失败，请重试";
    }

    @PostMapping("/chat")
    @ResponseBody
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        try {
            String userId = request.getUserId();
            String userInput = request.getMessage();
            String aiResponse = callAIModel(userId, userInput);

            ChatResponse chatResponse = new ChatResponse();
            chatResponse.setCode(200);
            chatResponse.setMessage("Success");
            chatResponse.setUserId(userId);
            chatResponse.setResponse(aiResponse);
            return ResponseEntity.ok(chatResponse);
        } catch (Exception e) {
            e.printStackTrace();
            ChatResponse errorResponse = new ChatResponse();
            errorResponse.setCode(500);
            errorResponse.setMessage("Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/clear-history/{userId}")
    @ResponseBody
    public ResponseEntity<ChatResponse> clearHistory(@PathVariable String userId) {
        userHistories.remove(userId);
        ChatResponse response = new ChatResponse();
        response.setCode(200);
        response.setMessage("History cleared for user: " + userId);
        response.setUserId(userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history/{userId}")
    @ResponseBody
    public ResponseEntity<List<RoleContent>> getHistory(@PathVariable String userId) {
        List<RoleContent> history = userHistories.getOrDefault(userId, new ArrayList<>());
        return ResponseEntity.ok(history);
    }
}

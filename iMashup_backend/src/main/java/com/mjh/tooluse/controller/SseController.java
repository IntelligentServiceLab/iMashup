package com.mjh.tooluse.controller;

import com.alibaba.fastjson.JSON;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mjh.tooluse.entity.*;
import com.mjh.tooluse.mapper.LoginAndRegisterAndForgetMapper;
import com.mjh.tooluse.mapper.SessionMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/sse")
public class SseController {
    private final Map<String, PrintWriter> sseSessionMap = new ConcurrentHashMap<>();

    // 异步，防止长耗时操作导致 SSE 卡住
    private final ExecutorService executorService = Executors.newFixedThreadPool(10);
    private final ObjectMapper objectMapper;

    private final ModelController modelController;
    private final Map<String, List<SubTask>> sessionSubTaskMap = new ConcurrentHashMap<>();
    private final Map<String, Boolean> sessionLanguageMap =  new ConcurrentHashMap<>();
    private final Map<String, Boolean> sessionProcessingMap = new ConcurrentHashMap<>();
    private final Map<String, String> sessionIdUserQuestionMap = new ConcurrentHashMap<>();

    @Autowired
    private LoginAndRegisterAndForgetMapper loginMapper;

    @Autowired
    private SessionMapper sessionMapper;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private static final String PYTHON_API_URL = "http://127.0.0.1:5000/search";

    public SseController(ObjectMapper objectMapper, ModelController modelController) {
        this.objectMapper = objectMapper;
        this.modelController = modelController;
    }

    private boolean isRoot (String username) {
        int sum = loginMapper.getRoot(username);
        return sum == 1;
    }

    @PostMapping("/creat")
    public Result creatSession(@RequestBody Map<String, String> map) {
        Result result = new Result();
        String username = map.get("username");
        if (username == null || username.isEmpty()) {
            result.setCode(400);
            result.setMsg("用户名不能为空");
            result.setData(null);
            return result;
        }

        long nowTime = System.currentTimeMillis();
        String sessionId = "session_" + nowTime + "_" + UUID.randomUUID()
                .toString().replace("-", "").substring(0, 8);
        result.setCode(200);
        result.setMsg("success");
        result.setData(sessionId);
        return result;
    }

    @GetMapping("/connect")
    public void connectSse(HttpServletResponse response, @RequestParam("username") String username, @RequestParam("sessionId") String sessionId) throws IOException {
        response.setContentType("text/event-stream");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-cache");
        response.setBufferSize(0);

        PrintWriter writer = null;
        try {
            writer = response.getWriter();
            sseSessionMap.put(sessionId, writer);
            System.out.println("SSE连接建立成功，sessionId: " + sessionId);

            SseMessage initMessage = new SseMessage();
            initMessage.setType("init");
            initMessage.setContent("请描述您的工作流需求！");
            initMessage.setSessionId(sessionId);
            sendSseMessage(writer, initMessage, sessionId);

            while (!Thread.currentThread().isInterrupted()) {
                try {
                    Thread.sleep(10000);
                    if (writer.checkError()) {
                        System.out.println("客户端断开连接，停止心跳");
                        break;
                    }
                    SseMessage pingMsg = new SseMessage();
                    pingMsg.setType("ping");
                    pingMsg.setContent("heartbeat");
                    pingMsg.setSessionId(sessionId);
                    sendSseMessage(writer, pingMsg, sessionId);
                } catch (InterruptedException e) {
                    System.out.println("心跳被中断，退出循环");
                    break;
                }
            }
        } finally {
            sseSessionMap.remove(sessionId);
            sessionSubTaskMap.remove(sessionId);
            sessionLanguageMap.remove(sessionId);
            sessionProcessingMap.remove(sessionId);
            if (writer != null) {
                writer.close();
            }
        }
    }

    private void sendSseMessage(PrintWriter writer, SseMessage sseMessage, String sessionId) throws IOException {
        String jsonData = objectMapper.writeValueAsString(sseMessage);

        writer.write("event: sseMessage\n");
        writer.write("data: " + jsonData + "\n\n");
        writer.flush();
    }

    private boolean isTextChinese(String text) {
        if (text == null || text.trim().isEmpty()) {
            return false;
        }

        int chineseCount = 0;
        int englishCount = 0;
        for (char c : text.toCharArray()) {
            Character.UnicodeBlock ub = Character.UnicodeBlock.of(c);
            if (ub == Character.UnicodeBlock.CJK_UNIFIED_IDEOGRAPHS || ub == Character.UnicodeBlock.CJK_COMPATIBILITY_IDEOGRAPHS || ub == Character.UnicodeBlock.CJK_UNIFIED_IDEOGRAPHS_EXTENSION_A || ub == Character.UnicodeBlock.CJK_UNIFIED_IDEOGRAPHS_EXTENSION_B) {
                chineseCount++;
            } else if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
                englishCount++;
            }
        }
        return chineseCount >= englishCount;
    }

    @PostMapping("/saveSession")
    public Result saveSession(@RequestBody Map<String, String> map) {
        Result result = new Result();
        String username = map.get("username");
        String sessionId = map.get("sessionId");

        if (username == null || sessionId == null ||
                username.isEmpty() || sessionId.isEmpty()) {
            result.setCode(400);
            result.setMsg("参数不完整");
            result.setData(null);
            return result;
        }

        if (!isRoot(username)) {
            result.setCode(200);
            result.setMsg("success");
            result.setData(null);
            return result;
        }

        try {
            long nowTime = System.currentTimeMillis();
            String title = "对话" + nowTime;

            int count = sessionMapper.insertSessionRecord(
                    sessionId, username, title, nowTime, nowTime
            );

            if (count > 0) {
                result.setCode(200);
                result.setMsg("success");
                result.setData(null);
            } else {
                result.setCode(400);
                result.setMsg("保存会话失败");
                result.setData(null);
            }
        } catch (Exception e) {
            result.setCode(400);
            result.setMsg("异常：" + e.getMessage());
            result.setData(null);
        }
        return result;
    }

    @PostMapping("/send")
    public Result submitText(@RequestBody UserTextRequest userTextRequest) throws IOException {
        Result result = new Result();
        String sessionId = userTextRequest.getSessionId();
        String username = userTextRequest.getUsername();
        String userText = userTextRequest.getUserText();
        sessionIdUserQuestionMap.put(sessionId, userText);

        if (!sseSessionMap.containsKey(sessionId)) {
            result.setCode(-1);
            result.setMsg("会话不存在，请重新点击“工作流推荐”按钮！");
            result.setData(null);
            return result;
        }

        boolean isChinese;
        Boolean haveLanguage = sessionLanguageMap.get(sessionId);

        if (haveLanguage != null) {
            isChinese  = haveLanguage;
        } else {
            isChinese = isTextChinese(userText);
            sessionLanguageMap.put(sessionId, isChinese);
        }

        // 清空旧结果
        sessionSubTaskMap.remove(sessionId);
        sessionProcessingMap.put(sessionId, true);
        executorService.submit(() -> {
            PrintWriter writer = sseSessionMap.get(sessionId);
            if (writer == null || writer.checkError()) {
                System.out.println("会话已断开/失效，无法推送消息，sessionId: " + sessionId);
                sseSessionMap.remove(sessionId);
                sessionSubTaskMap.remove(sessionId);
                sessionLanguageMap.remove(sessionId);
                sessionProcessingMap.put(sessionId, false);
                return;
            }
            try {
                String prompt = """
                # Role
                You are an expert Task Decomposition Assistant specialized in API-level workflow design.
                
                Your goal is to break down user requests into the SMALLEST executable API-level tasks.
                
                # CRITICAL: Atomic API Task Rules (STRICT)
                - EACH task MUST map to ONE single API call or function call
                - NEVER combine multiple actions into one task
                - Each task = ONE verb + ONE object
                - Granularity standard:
                   BAD: 查询航班信息
                   GOOD: 调用航班搜索API、解析返回数据、筛选低价航班
                
                # Mandatory Decomposition Dimensions
                You MUST decompose tasks across ALL these phases:
                1. Input Preparation (参数准备)
                2. Validation (参数校验)
                3. API Execution (调用API)
                4. Response Parsing (解析返回结果)
                5. Decision Making (条件判断)
                6. Error Handling (异常处理)
                7. State Persistence (数据存储/缓存)
                8. Cleanup (收尾)
                
                # DAG Rules (VERY IMPORTANT)
                - Output MUST be a Directed Acyclic Graph
                - NO circular dependencies
                - Tasks that can run in parallel MUST share the same taskOrder
                - Each task must clearly point to next executable tasks
                
                # Strong Anti-Aggregation Rules
                - NEVER use vague words like:
                  "查询信息", "处理数据", "完成操作"
                - MUST split into:
                  - API call
                  - Data extraction
                  - Filtering
                  - Sorting
                - If a task contains "和/并且/然后" → MUST split
                
                # API-Level Examples
                
                ## Example: 买票去北京
                
                 CORRECT (API-level):
                - task_001: 收集用户输入（日期、人数）
                - task_002: 校验日期格式API
                - task_003: 调用航班搜索API
                - task_004: 调用火车票搜索API
                - task_005: 解析航班API返回数据
                - task_006: 解析火车API返回数据
                - task_007: 筛选低价航班函数
                - task_008: 筛选高评分车次函数
                - task_009: 合并候选方案数据
                - task_010: 排序候选方案API
                - task_011: 选择最优方案函数
                - task_012: 调用实名认证校验API
                - task_013: 调用下单API
                - task_014: 调用支付API
                - task_015: 验证支付结果API
                
                 WRONG:
                - 查询票价
                - 购买车票
                
                # Output Format (STRICT JSON ONLY)
                - NO markdown
                - NO explanation text
                - ONLY raw JSON
                
                # Schema
                {
                  "code": 200,
                  "msg": "success",
                  "data": [
                    {
                      "taskId": "task_001",
                      "taskName": "任务名称",
                      "taskNameEn": "Task Name",
                      "taskContent": "明确的单一API或函数执行步骤",
                      "taskContentEn": "Single API/function execution step",
                      "taskOrder": 1,
                      "nextTasks": ["task_002"]
                    }
                  ]
                }
                
                # Constraints (STRICT VALIDATION)
                1. Task Count: MIN 8, NO upper limit
                2. taskId format: task_001 → task_999
                3. taskOrder:
                   - Start from 1
                   - Continuous (1,2,3...)
                   - Parallel tasks share same number
                4. nextTasks:
                   - MUST reference valid taskIds
                   - Empty array ONLY for final nodes
                5. Each task MUST:
                   - Contain EXACTLY ONE action
                   - Be executable independently (API/function level)
                6. NO vague abstraction allowed
                
                # Validation Rules
                If ANY rule is violated, return:
                {"code":400,"msg":"validation_error","data":"<REASON>"}
                
                # Current User Request
                User Input: %s
                Assistant Output:
                """.formatted(userText);

                String llmJsonResponse = modelController.callAIModel(sessionId, prompt);
                System.out.println("大模型返回结果：" + llmJsonResponse);

                if (llmJsonResponse == null || llmJsonResponse.isEmpty() || llmJsonResponse.equals("调用AI失败，请重试！")) {
                    throw new Exception("大模型调用失败，返回值：" + llmJsonResponse);
                }

                String cleanJson = llmJsonResponse.trim()
                        .replaceAll("^```json\\s*", "")
                        .replaceAll("\\s*```$", "");
                com.alibaba.fastjson.JSONObject aiResult = JSON.parseObject(cleanJson);
                int code = aiResult.getIntValue("code");
                if (code != 200) {
                    throw  new Exception(aiResult.getString("msg"));
                }

                List<SubTask> subTaskList = aiResult.getJSONArray("data").toJavaList(SubTask.class);
                if (subTaskList == null || subTaskList.isEmpty()) {
                    throw new Exception("AI未返回有效子任务列表");
                }

                SseMessage sseMessage = new SseMessage();
                sseMessage.setType("subTask");
                sseMessage.setContent("子任务拆分完成，共" + subTaskList.size() + "个任务");
                sseMessage.setSessionId(sessionId);
                sseMessage.setSubTaskList(subTaskList);
                sessionSubTaskMap.put(sessionId, subTaskList);
                sendSseMessage(writer, sseMessage, sessionId);
                sessionProcessingMap.put(sessionId,false);

                boolean isInsert = insertMesssage(username, sessionId, "user", userText);
                if (isInsert) {
                    result.setCode(200);
                    result.setMsg("正在划分子任务...");
                    result.setData(null);
                } else {
                    result.setCode(400);
                    result.setMsg("划分子任务失败！");
                    result.setData(null);
                }
            } catch (Exception e) {
                System.out.println("异步处理异常，sessionId: " + sessionId + ", 原因: " + e.getMessage());
                try {
                    SseMessage errorMsg = new SseMessage();
                    errorMsg.setType("error");
                    errorMsg.setContent("任务拆分失败：" + e.getMessage());
                    errorMsg.setSessionId(sessionId);
                    sendSseMessage(writer, errorMsg, sessionId);
                } catch (Exception ex) {
                    System.out.println("推送错误消息失败，sessionId: " + sessionId + ", 原因: " + ex.getMessage());
                }
            }
        });
        result.setCode(200);
        result.setMsg("正在划分子任务...");
        result.setData(null);
        return result;
    }

    @GetMapping("/getSubTasks")
    public Result getSubTasks(@RequestParam String sessionId, @RequestParam String username) throws JsonProcessingException {
        Result result = new Result();
        long nowTime = System.currentTimeMillis();
        if (Boolean.TRUE.equals(sessionProcessingMap.get(sessionId))) {
            result.setCode(-99);
            result.setMsg("任务正在解析中，请稍候...");
            result.setData(null);
            return result;
        }
        StringBuilder sb = new StringBuilder();
        List<SubTask> subTaskList = sessionSubTaskMap.get(sessionId);
        int isChinese = 1;
        if (subTaskList == null || subTaskList.isEmpty()) {
            result.setCode(-1);
            result.setMsg("暂无子任务");
            result.setData(null);
            return result;
        }
        if (!sseSessionMap.containsKey(sessionId)) {
            result.setCode(-1);
            result.setMsg("会话不存在，sessionId: " + sessionId);
            result.setData(null);
        } else if (!sessionSubTaskMap.containsKey(sessionId)) {
            result.setCode(-1);
            result.setMsg("该会话暂无拆分后的子任务，sessionId: " + sessionId);
            result.setData(null);
        } else {
            if (sessionLanguageMap.get(sessionId) == true) {
                for (int i = 0; i < subTaskList.size(); i++) {
                    var subTask = subTaskList.get(i);
                    sb.append("子任务").append(i + 1).append("：")
                            .append(subTask.getTaskName())
                            .append(",\n");
                    sb.append("描述：")
                            .append(subTask.getTaskContent());
                    if (i < subTaskList.size() - 1) {
                        sb.append("\n");
                    }
                }
            } else {
                isChinese = 0;
                for (int i = 0; i < subTaskList.size(); i++) {
                    var subTask = subTaskList.get(i);
                    sb.append("Subtask").append(i + 1).append("：")
                            .append(subTask.getTaskNameEn())
                            .append(",\n");
                    sb.append("Description：")
                            .append(subTask.getTaskContent());
                    if (i < subTaskList.size() - 1) {
                        sb.append("\n");
                    }
                }
            }
        }
        System.out.println(sb.toString());

        if (isRoot(username)) {
            String messageId = "message_" + nowTime + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
            int sum = sessionMapper.insertSessionMessage(messageId, sessionId, "ai", sb.toString(), nowTime);
            if (sum == 0) {
                result.setCode(400);
                result.setMsg("操作有误，请关闭重试！");
                result.setData(null);
            }
        }

        Ai ai = aiInsert(sessionId, isChinese);
        System.out.println(ai);

        Map<String, Object> data = new HashMap<>();
        data.put("taskText", sb.toString());
        data.put("aiFlow", ai);

        result.setCode(200);
        result.setMsg("获取子任务成功！");
        result.setData(data);
        return result;
    }

    private Ai aiInsert(String sessionId, Integer isChinese) {
        List<SubTask> subTaskList = sessionSubTaskMap.get(sessionId);
        Ai ai = new Ai();
        List<Node> nodes = new ArrayList<>();
        List<Edge> edges = new ArrayList<>();

        int maxOrder = subTaskList.stream()
                .mapToInt(SubTask::getTaskOrder)
                .max()
                .orElse(1);

        Map<Integer, Integer> orderCountMap = new HashMap<>();
        for (SubTask sub : subTaskList) {
            orderCountMap.put(sub.getTaskOrder(),
                    orderCountMap.getOrDefault(sub.getTaskOrder(), 0) + 1);
        }

        Set<String> allTaskNames = new HashSet<>();
        Set<String> hasIncomingEdge = new HashSet<>();

        // 记录所有任务名和哪些有入边
        for (SubTask sub : subTaskList) {
            String taskName = isChinese == 1 ? sub.getTaskName() : sub.getTaskNameEn();
            allTaskNames.add(taskName);

            List<String> nextTaskIds = sub.getNextTasks();
            if (nextTaskIds != null && !nextTaskIds.isEmpty()) {
                for (String nextTaskId : nextTaskIds) {
                    SubTask nextTask = subTaskList.stream()
                            .filter(t -> nextTaskId.equals(t.getTaskId()))
                            .findFirst()
                            .orElse(null);
                    if (nextTask != null) {
                        String nextTaskName = isChinese == 1 ? nextTask.getTaskName() : nextTask.getTaskNameEn();
                        hasIncomingEdge.add(nextTaskName);
                    }
                }
            }
        }

        // 处理每个任务的边
        for (int i = 0; i < subTaskList.size(); i++) {
            SubTask nowTask = subTaskList.get(i);
            int nowOrder = nowTask.getTaskOrder();
            List<String> nextTaskIds = nowTask.getNextTasks();
            String nowName = isChinese == 1 ? nowTask.getTaskName() : nowTask.getTaskNameEn();

            if (nowOrder == 1) {
                Edge edge = new Edge();
                edge.setId("a->" + nowName);
                edge.setType("custom-edge");
                edge.setSource("a");
                edge.setSourceHandle(null);
                edge.setTarget(nowName);
                if (orderCountMap.getOrDefault(nowOrder, 1) > 1) {
                    edge.setTargetHandle("b");
                } else {
                    edge.setTargetHandle(null);
                }
                edges.add(edge);
            }

            if (nextTaskIds != null && !nextTaskIds.isEmpty()) {
                // 有明确的下一个任务
                for (String nextTaskId : nextTaskIds) {
                    SubTask nextTask = subTaskList.stream()
                            .filter(sub -> nextTaskId.equals(sub.getTaskId()))
                            .findFirst()
                            .orElse(null);

                    if (nextTask == null) continue;

                    String nextName = isChinese == 1 ? nextTask.getTaskName() : nextTask.getTaskNameEn();
                    int nextOrder = nextTask.getTaskOrder();

                    Edge edge = new Edge();
                    edge.setId(nowName + "->" + nextName);
                    edge.setType("custom-edge");
                    edge.setSource(nowName);
                    edge.setTarget(nextName);

                    if (orderCountMap.getOrDefault(nowOrder, 1) > 1) {
                        edge.setSourceHandle("b");
                    } else {
                        edge.setSourceHandle(null);
                    }

                    if (orderCountMap.getOrDefault(nextOrder, 1) > 1) {
                        edge.setTargetHandle("b");
                    } else {
                        edge.setTargetHandle(null);
                    }
                    edges.add(edge);
                }
            } else {
                Edge edge = new Edge();
                edge.setId(nowName + "->c");
                edge.setType("custom-edge");
                edge.setSource(nowName);
                if (orderCountMap.getOrDefault(nowOrder, 1) > 1) {
                    edge.setSourceHandle("b");
                } else {
                    edge.setSourceHandle(null);
                }
                edge.setTarget("c");
                edge.setTargetHandle(null);
                edges.add(edge);
            }
        }

        // 开始节点
        Node beginNode = new Node();
        beginNode.setId("a");
        beginNode.setType("start-end");

        Node.Position beginPosition = new Node.Position();
        beginPosition.setX(-800.0);
        beginPosition.setY(48.10824742268041);
        beginNode.setPosition(beginPosition);

        Node.Data beginNodeData = new Node.Data();
        beginNodeData.setLabel("开始");
        beginNodeData.setName("输入");
        List<Node.Data.Input> beginNodeInputs = new ArrayList<>();
        Node.Data.Input beginNodeDataInput = new Node.Data.Input();
        beginNodeDataInput.setKey("0");
        beginNodeDataInput.setName("input");
        beginNodeDataInput.setType("string");
        beginNodeDataInput.setText("");
        beginNodeDataInput.setIsFold("true");
        beginNodeDataInput.setValue(null);
        beginNodeInputs.add(beginNodeDataInput);
        beginNodeData.setInputs(beginNodeInputs);
        beginNodeData.setOutputs(new ArrayList<>());
        beginNodeData.setUrlLine(null);
        beginNodeData.setUrlHeader(null);
        beginNodeData.setMethod(null);
        beginNode.setData(beginNodeData);

        Node.Measured beginNodeMeasured = new Node.Measured();
        beginNodeMeasured.setWidth("187");
        beginNodeMeasured.setHeight("65");
        beginNode.setMeasured(beginNodeMeasured);
        beginNode.setSelected(false);
        beginNode.setDragging(false);
        nodes.add(beginNode);

        // 中间节点
        Map<Integer, Integer> orderIndexMap = new HashMap<>();
        for (int i = 0; i < subTaskList.size(); i++) {
            Node middleNode = new Node();
            SubTask subTask = subTaskList.get(i);
            int taskOrder = subTask.getTaskOrder();
            String taskName = isChinese == 1 ? subTask.getTaskName() : subTask.getTaskNameEn();

            middleNode.setId(taskName);
            middleNode.setType("position-logger");

            double baseX = -487.2611683848797;
            double xStep = 350;
            double baseY = 48.10824742268041;
            double yStep = 250;

            double x = baseX + (taskOrder - 1) * xStep;

            int index = orderIndexMap.getOrDefault(taskOrder, 0);
            double y = baseY + index * yStep;
            orderIndexMap.put(taskOrder, index + 1);

            Node.Position middlePosition = new Node.Position();
            middlePosition.setX(x);
            middlePosition.setY(y);
            middleNode.setPosition(middlePosition);
            middleNode.setTargetPosition(null);

            Node.Data middleNodeData = new Node.Data();
            middleNodeData.setLabel(taskName);
            middleNodeData.setName(taskName);

            List<Node.Data.Input> middleNodeInputs = new ArrayList<>();
            Node.Data.Input middleNodeInput = new Node.Data.Input();
            middleNodeInput.setKey("0");
            middleNodeInput.setName("input");
            middleNodeInput.setType("string");
            middleNodeInput.setText("");
            middleNodeInput.setIsFold("true");
            Node.Data.Value middleNodeDataValue = new Node.Data.Value();
            middleNodeDataValue.setName("");
            middleNodeDataValue.setInput("");
            middleNodeDataValue.setType("");
            middleNodeDataValue.setUrlValueName("");
            middleNodeDataValue.setText("");
            middleNodeInput.setValue(middleNodeDataValue);
            middleNodeInputs.add(middleNodeInput);
            middleNodeData.setInputs(middleNodeInputs);

            List<Node.Data.Output> middleNodeOutputs = new ArrayList<>();
            Node.Data.Output middleNodeOutput = new Node.Data.Output();
            middleNodeOutput.setKey("0");
            middleNodeOutput.setName("output");
            middleNodeOutput.setIsFold(null);
            middleNodeOutput.setText("");
            middleNodeOutput.setType("string");
            middleNodeOutput.setValue(null);
            middleNodeOutputs.add(middleNodeOutput);
            middleNodeData.setOutputs(middleNodeOutputs);

            middleNodeData.setUrlLine("");
            middleNodeData.setUrlHeader(null);
            middleNodeData.setMethod("POST");

            middleNode.setData(middleNodeData);
            Node.Measured middleNodeMeasured = new Node.Measured();
            middleNodeMeasured.setWidth("241");
            middleNodeMeasured.setHeight("169");
            middleNode.setMeasured(middleNodeMeasured);
            middleNode.setSelected(false);
            middleNode.setDragging(false);
            nodes.add(middleNode);
        }

        // 结束节点
        Node endNode = new Node();
        double baseX = -487.2611683848797;
        double endX = baseX + (maxOrder + 1) * 350;
        endNode.setId("c");
        endNode.setType("start-end");
        Node.Position endPosition = new Node.Position();
        endPosition.setX(endX);
        endPosition.setY(48.10824742268041);
        endNode.setPosition(endPosition);

        endNode.setTargetPosition("left");
        Node.Data endNodeData = new Node.Data();
        endNodeData.setLabel("结束");
        endNodeData.setName("输出");
        endNodeData.setInputs(new ArrayList<>());
        List<Node.Data.Output> endNodeOutputs = new ArrayList<>();
        Node.Data.Output endNodeOutput = new Node.Data.Output();
        endNodeOutput.setKey("0");
        endNodeOutput.setName("output");
        endNodeOutput.setIsFold(null);
        endNodeOutput.setText(null);
        endNodeOutput.setType("string");
        Node.Data.Value endNodeDataValue = new Node.Data.Value();
        endNodeDataValue.setName("开始");
        endNodeDataValue.setInput("input");
        endNodeDataValue.setType("string");
        endNodeDataValue.setUrlValueName(null);
        endNodeDataValue.setText("");
        endNodeOutput.setValue(endNodeDataValue);
        endNodeOutputs.add(endNodeOutput);
        endNodeData.setOutputs(endNodeOutputs);
        endNodeData.setUrlLine(null);
        endNodeData.setUrlHeader(null);
        endNodeData.setMethod(null);
        endNode.setData(endNodeData);

        Node.Measured endNodeMeasured = new Node.Measured();
        endNodeMeasured.setWidth("187");
        endNodeMeasured.setHeight("65");
        endNode.setMeasured(endNodeMeasured);
        endNode.setSelected(false);
        endNode.setDragging(false);
        nodes.add(endNode);

        ai.setNodes(nodes);
        ai.setEdges(edges);
        return ai;
    }

    @PostMapping("/apiChoice")
    public Result apiChoice(@RequestBody SesssionRequest sesssionRequest) throws IOException {
        Result result = new Result();
        String sessionId = sesssionRequest.getSessionId();
        String username = sesssionRequest.getUsername();
        Ai ai = sesssionRequest.getAi();
        List<Node> nodes = ai.getNodes();

        if (!sseSessionMap.containsKey(sessionId)) {
            result.setCode(-1);
            result.setMsg("会话不存在！");
            result.setData(null);
            return result;
        }

        List<SubTask> subTaskList = sessionSubTaskMap.get(sessionId);
        if (subTaskList == null || subTaskList.isEmpty()) {
            result.setCode(-2);
            result.setMsg("该会话暂无拆分后的子任务，无法调用Python接口！");
            result.setData(null);
            return result;
        }

        PrintWriter writer = sseSessionMap.get(sessionId);

        List<ApiRusult> pythonResponseList = new ArrayList<>();
        int totalTasks = subTaskList.size();
        int successfulTasks = 0;
        int isChinese = sessionLanguageMap.get(sessionId) == true ? 1 : 0;

        for (int i = 0; i < totalTasks; i++) {
            SubTask subTask = subTaskList.get(i);
            String taskIdNode = isChinese == 1 ? subTask.getTaskName() : subTask.getTaskNameEn();
            String taskId = subTask.getTaskNameEn();
            String userQuery = subTask.getTaskContentEn();
            int topK = 1;
            int currentStep = i + 1;

            String name = null;

            if (sessionLanguageMap.get(sessionId) == true) {
                name = subTask.getTaskName();
            } else {
                name = subTask.getTaskNameEn();
            }

            try {
                String progressText = String.format("正在执行任务 %d/%d: %s...", currentStep, totalTasks, name);
                SseMessage sseMessage = new SseMessage();
                sseMessage.setType("progress");
                sseMessage.setContent(progressText);
                sseMessage.setSessionId(sessionId);
                sendSseMessage(writer, sseMessage, sessionId);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }

            try {
                String requestBody = String.format(
                        "{\"query\":\"%s\",\"top_k\":%d}",
                        userQuery.replace("\"", "\\\""),
                        topK
                );

                HttpRequest httpRequest = HttpRequest.newBuilder()
                        .uri(URI.create(PYTHON_API_URL))
                        .header("Content-Type", "application/json; charset=utf-8")
                        .timeout(Duration.ofSeconds(10))
                        .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                        .build();

                HttpResponse<String> response = httpClient.send(
                        httpRequest,
                        HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
                );

                if (response.statusCode() == 200) {
                    String responseBody = response.body();
                    try {
                        ApiRusult apiRusult = objectMapper.readValue(responseBody, ApiRusult.class);
                        apiRusult.getData().get(0).setTaskId(taskId);
                        apiRusult.getData().get(0).setTaskName(taskIdNode);
                        pythonResponseList.add(apiRusult);
                        successfulTasks++;
                        System.out.println("子任务" + taskId + "解析成功：" + apiRusult.getData().get(0).getApiLink());

                        SseMessage sseMessage = new SseMessage();
                        sseMessage.setType("api_result");
                        sseMessage.setContent(String.format(" 任务 %d 完成! 匹配度: %.2f | API: %s", currentStep, apiRusult.getData().get(0).getScore(), apiRusult.getData().get(0).getApiLink()));
                        sseMessage.setSessionId(sessionId);
                        sendSseMessage(writer, sseMessage, sessionId);
                    } catch (JsonProcessingException ex) {
                        System.err.println("子任务" + taskId + "Json解析失败：" + responseBody);
                        ex.printStackTrace();
                    }
                } else {
                    System.out.println("子任务" + taskId + "调用失败，状态码：" + response.statusCode());
                }
            } catch (Exception e) {
                System.out.println("子任务" + taskId + "网络调用异常：" + e.getMessage());
                e.printStackTrace();
            }
        }

        try {
            SseMessage finishMsg = new SseMessage();
            finishMsg.setType("final_result");
            finishMsg.setSessionId(sessionId);
            finishMsg.setContent(String.format("🎉 所有任务处理完毕！成功 %d/%d", successfulTasks, totalTasks));
            sendSseMessage(writer, finishMsg, sessionId);
            System.out.println("已推送最终结果给前端");
        } catch (Exception e) {
            System.err.println("推送最终结果失败: " + e.getMessage());
        }
        System.out.println(pythonResponseList);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < pythonResponseList.size(); i++) {
            var pythonResponse = pythonResponseList.get(i);
            String taskName = pythonResponse.getData().get(0).getTaskName();
            sb.append("子任务Id：").append(taskName)
                    .append(",\n");
            sb.append("子任务链接").append(":")
                    .append(pythonResponse.getData().get(0).getApiLink())
                    .append(",\n");
            Node targetNode = nodes.stream()
                    .filter(node ->
                            taskName.equals(node.getId())
                    )
                    .findFirst()
                    .orElse(null);
            targetNode.getData().setUrlLine(pythonResponse.getData().get(0).getApiLink());
        }
        boolean isInsert = insertMesssage(username, sessionId, "ai", sb.toString());
        if (!isInsert) {
            result.setCode(400);
            result.setMsg("操作有误，请关闭重试！");
            result.setData(null);
        }
        System.out.println(ai);
        Map<String, Object> apiData = new HashMap<>();
        apiData.put("taskText", sb.toString());
        apiData.put("apiData", ai);
        if (!pythonResponseList.isEmpty()) {
            result.setCode(200);
            result.setMsg("子任务Python接口调用完成");
            result.setData(apiData);
        } else {
            result.setCode(-3);
            result.setMsg("无可用的子任务调用结果");
            result.setData(null);
        }
        SseMessage resetMsg = new SseMessage();
        resetMsg.setType("reset");
        resetMsg.setSessionId(sessionId);
        resetMsg.setContent("reset");
        sendSseMessage(writer, resetMsg, sessionId);
        return result;
    }

    private boolean insertMesssage (String username, String sessionId, String role, String content) {
        long nowTime = System.currentTimeMillis();
        if (isRoot(username)) {
            String messageId = "message_" + nowTime + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
            int sum = sessionMapper.insertSessionMessage(messageId, sessionId, role, content, nowTime);
            return sum == 1;
        } else {
            return false;
        }
    }

    @GetMapping("/list")
    public Result getSessionList(@RequestParam String username) {
        Result result = new Result();
        boolean isRoot = isRoot(username);
        if (!isRoot) {
            result.setCode(400);
            result.setMsg("未登录，请先登录！");
            result.setData(null);
            return result;
        }
        try {
            List<ChatSession> sessions = sessionMapper.selectByUserId(username);
            List<Map<String, Object>> list = new ArrayList<>();

            if (sessions != null) {
                for (ChatSession session : sessions) {
                    List<ChatMessage> messages = sessionMapper.selectLastMessageBySessionId(session.getSessionId());

                    String lastMessage = "";
                    if (messages != null && !messages.isEmpty()) {
                        lastMessage = messages.get(messages.size() - 1).getContent();
                    }

                    Map<String, Object> item = new HashMap<>();
                    item.put("sessionId", session.getSessionId());
                    item.put("title", session.getTitle());
                    item.put("lastMessage", lastMessage);
                    item.put("updateTime", session.getUpdateTime());

                    list.add(item);
                }
            }

            result.setCode(200);
            result.setMsg("success");
            result.setData(list);
        } catch (Exception e) {
            result.setCode(500);
            result.setMsg("查询失败：" + e.getMessage());
            result.setData("请关闭重试！");
        }
        return result;
    }

    @GetMapping("/detail")
    public Result getSessionDetail(@RequestParam String username, @RequestParam String sessionId) {
        Result result = new Result();
        if (!isRoot(username)) {
            result.setCode(400);
            result.setMsg("未登录，无权查看");
            result.setData(null);
            return result;
        }

        try {
            ChatSession session = sessionMapper.selectBySessionId(sessionId);
            if (session == null || !username.equals(session.getUserId())) {
                result.setCode(404);
                result.setMsg("未找到该会话");
                result.setData(null);
                return result;
            }

            List<ChatMessage> messages = sessionMapper.selectLastMessageBySessionId(sessionId);
            Map<String, Object> data = getStringObjectMap(messages, session);

            result.setCode(200);
            result.setMsg("success");
            result.setData(data);
        } catch (Exception e) {
            result.setCode(500);
            result.setMsg("查询失败：" + e.getMessage());
            result.setData(null);
        }
        return result;
    }

    @NotNull
    private static Map<String, Object> getStringObjectMap(List<ChatMessage> messages, ChatSession session) {
        List<Map<String, Object>> messageList = new ArrayList<>();

        if (messages != null) {
            for (ChatMessage msg : messages) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", msg.getMessageId());
                item.put("type", "user".equals(msg.getRole()) ? "user" : "ai");
                item.put("content", msg.getContent());
                item.put("timestamp", msg.getCreateTime());
                messageList.add(item);
            }
        }

        Map<String, Object> data = new HashMap<>();
        data.put("sessionId", session.getSessionId());
        data.put("title", session.getTitle());
        data.put("messages", messageList);
        return data;
    }

    @PostMapping("/deleteSession")
    public Result deleteSession(@RequestParam String username, @RequestParam String sessionId) {
        Result result = new Result();
        if (!isRoot(username)) {
            result.setCode(400);
            result.setMsg("未登录，无权查看");
            result.setData(null);
            return result;
        }
        try {
            int count = sessionMapper.delectByUsernameAndSessionIdSession(username, sessionId);
            int sum = sessionMapper.delectByUsernameAndSessionIdMessage(username, sessionId);
            if (count + sum >= 2) {
                result.setCode(200);
                result.setMsg("删除成功！");
                result.setData(null);
            } else {
                result.setCode(500);
                result.setMsg("删除失败！");
                result.setData(null);
            }
        } catch (Exception e) {
            result.setCode(500);
            result.setMsg("查询失败：" + e.getMessage());
            result.setData(null);
        }
        return result;
    }
}
package com.mjh.tooluse.controller;

import org.springframework.http.*;
import org.springframework.core.io.*;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.util.StringUtils;
import org.springframework.util.FileCopyUtils;

import java.io.*;
import java.nio.file.*;
import java.net.URLEncoder;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.*;
import java.util.zip.*;

@RestController
@RequestMapping("/exe")
public class ExeController {
    private static final Logger logger = LoggerFactory.getLogger(ExeController.class);

    // 路径配置
    private static final String FRONTEND_PROJECT_PATH = "/var/www/html/combination-tools";
    private static final String RELEASE_DIR = FRONTEND_PROJECT_PATH + "/release";
    private static final String ZIP_STORAGE_DIR = FRONTEND_PROJECT_PATH + "/zips";
    private static final String FLOW_DATA_DIR = FRONTEND_PROJECT_PATH + "/flowData";

    // 超时配置
    private static final long BUILD_TIMEOUT = TimeUnit.MINUTES.toMillis(30);
    private static final long STATUS_RETENTION = TimeUnit.HOURS.toMillis(24);
    private static final int MAX_CONCURRENT_BUILDS = 2;

    // 构建状态跟踪
    private static final ConcurrentMap<String, BuildStatus> buildStatuses = new ConcurrentHashMap<>();
    private static final ExecutorService buildExecutor = Executors.newFixedThreadPool(MAX_CONCURRENT_BUILDS);
    private static final ScheduledExecutorService cleanupExecutor = Executors.newSingleThreadScheduledExecutor();

    static {
        cleanupExecutor.scheduleAtFixedRate(() -> {
            try {
                cleanOldBuilds();
            } catch (Exception e) {
                logger.error("清理任务失败", e);
            }
        }, 1, 1, TimeUnit.HOURS);
    }

    @GetMapping("/check-env")
    public ResponseEntity<Map<String, Object>> checkEnvironment() {
        Map<String, Object> result = new HashMap<>();
        try {
            // 检查必要工具
            result.put("npm", getToolVersion("npm --version"));
            result.put("electron-builder", getToolVersion("npx electron-builder --version"));
            result.put("node", getToolVersion("node --version"));

            // 检查目录权限
            result.put("writable", checkDirectoryPermissions());

            // 环境就绪状态
            boolean envReady = result.get("npm") != null &&
                    result.get("electron-builder") != null;
            result.put("envReady", envReady);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("环境检查失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> triggerBuild(@RequestBody Map<String, Object> requestData) {
        String buildId = UUID.randomUUID().toString();
        BuildStatus status = new BuildStatus();
        buildStatuses.put(buildId, status);

        try {
            // 验证流程数据
            String flowData = (String) requestData.get("flowData");
            if (!StringUtils.hasText(flowData)) {
                throw new IllegalArgumentException("flowData参数不能为空");
            }

            // 保存流程数据
            saveFlowData(buildId, flowData);

            // 提交构建任务
            buildExecutor.execute(() -> {
                try {
                    executeBuildProcess(buildId, status);
                } catch (Exception e) {
                    logger.error("构建过程失败", e);
                    status.update("FAILED", e.getMessage());
                }
            });

            return ResponseEntity.ok(Map.of(
                    "buildId", buildId,
                    "status", "started",
                    "timeout", BUILD_TIMEOUT,
                    "checkInterval", 5000
            ));

        } catch (Exception e) {
            logger.error("触发构建失败", e);
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/status/{buildId}")
    public ResponseEntity<Map<String, Object>> getBuildStatus(@PathVariable String buildId) {
        BuildStatus status = buildStatuses.get(buildId);
        if (status == null) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("status", status.status);
        response.put("message", status.message);
        response.put("timestamp", status.lastActivity);

        if ("COMPLETED".equals(status.status)) {
            response.put("downloadUrl", "/exe/download/" + buildId);
            response.put("filename", "EasyComposer_" + buildId + ".zip");
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/download/{buildId}")
    public ResponseEntity<Resource> downloadBuild(
            @PathVariable String buildId,
            @RequestHeader(value = "User-Agent", required = false) String userAgent) throws IOException {

        // 验证构建状态
        BuildStatus status = buildStatuses.get(buildId);
        if (status == null || !"COMPLETED".equals(status.status)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "构建不存在或未完成");
        }

        Path zipPath = Paths.get(status.message);
        if (!Files.exists(zipPath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "ZIP文件不存在");
        }

        // 准备下载响应
        String filename = "EasyComposer_" + buildId + ".zip";
        Resource resource = new FileSystemResource(zipPath);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        buildContentDisposition(filename, userAgent))
                .header(HttpHeaders.CONTENT_TYPE, "application/zip")
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(Files.size(zipPath)))
                .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                .body(resource);
    }

    // ========== 私有方法 ==========

    private void executeBuildProcess(String buildId, BuildStatus status) throws Exception {
        status.update("IN_PROGRESS", "准备构建环境...");

        // 1. 准备构建目录
        prepareBuildEnvironment();

        // 2. 执行构建命令
        status.update("IN_PROGRESS", "启动Electron构建...");
        Process process = new ProcessBuilder()
                .command("npm", "run", "make:win")
                .directory(new File(FRONTEND_PROJECT_PATH))
                .redirectErrorStream(true)
                .start();

        // 3. 监控构建输出
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                logger.info("[electron-builder] {}", line);
                status.lastActivity = System.currentTimeMillis();

                if (line.contains("Building")) {
                    status.update("IN_PROGRESS", "构建应用中...");
                } else if (line.contains("Packaging")) {
                    status.update("IN_PROGRESS", "打包安装程序中...");
                } else if (line.contains("FAILED") || line.contains("ERR!")) {
                    status.update("FAILED", line);
                    process.destroy();
                    return;
                }
            }
        }

        // 4. 等待构建完成
        if (!process.waitFor(BUILD_TIMEOUT, TimeUnit.MILLISECONDS)) {
            process.destroyForcibly();
            throw new RuntimeException("构建超时");
        }

        if (process.exitValue() != 0) {
            throw new RuntimeException("构建失败，退出码: " + process.exitValue());
        }

        // 5. 打包结果文件
        status.update("IN_PROGRESS", "准备分发文件...");
        Path outputDir = Paths.get(RELEASE_DIR);
        if (!Files.exists(outputDir)) {
            throw new RuntimeException("未找到输出目录");
        }

        String zipFilename = "EasyComposer_" + buildId + ".zip";
        Path zipPath = Paths.get(ZIP_STORAGE_DIR, zipFilename);
        Files.createDirectories(zipPath.getParent());

        zipDirectory(outputDir, zipPath);
        status.update("COMPLETED", zipPath.toString());
    }

    private void prepareBuildEnvironment() throws IOException {
        // 确保构建目录存在
        Path buildDir = Paths.get(FRONTEND_PROJECT_PATH, "build");
        if (!Files.exists(buildDir)) {
            Files.createDirectories(buildDir);
        }

        // 创建默认NSIS脚本
        Path installerNsh = buildDir.resolve("installer.nsh");
        if (!Files.exists(installerNsh)) {
            Files.write(installerNsh, """
                !include "MUI2.nsh"
                !include "FileFunc.nsh"
                """.getBytes());
        }
    }

    private void saveFlowData(String buildId, String flowData) throws IOException {
        // 确保目录存在
        Files.createDirectories(Paths.get(FLOW_DATA_DIR));

        // 保存流程数据
        Path flowFile = Paths.get(FLOW_DATA_DIR, "flow_" + buildId + ".json");
        Files.write(flowFile, flowData.getBytes());

        // 复制到public目录
        Path publicFlow = Paths.get(FRONTEND_PROJECT_PATH, "public", "flowData.json");
        Files.createDirectories(publicFlow.getParent());
        Files.write(publicFlow, flowData.getBytes());
    }

    private void zipDirectory(Path sourceDir, Path targetZip) throws IOException {
        try (ZipOutputStream zos = new ZipOutputStream(new FileOutputStream(targetZip.toFile()))) {
            Files.walk(sourceDir)
                    .filter(path -> !Files.isDirectory(path))
                    .filter(path -> !path.toString().endsWith(".blockmap"))
                    .forEach(path -> {
                        try {
                            String entryName = sourceDir.relativize(path).toString()
                                    .replace("\\", "/");
                            zos.putNextEntry(new ZipEntry(entryName));
                            Files.copy(path, zos);
                            zos.closeEntry();
                        } catch (IOException e) {
                            throw new UncheckedIOException(e);
                        }
                    });
        }
    }

    private static void cleanOldBuilds() throws IOException {
        long cutoff = System.currentTimeMillis() - STATUS_RETENTION;

        // 清理旧构建状态
        buildStatuses.entrySet().removeIf(entry ->
                entry.getValue().lastActivity < cutoff
        );

        // 清理旧流程数据
        cleanupOldFiles(FLOW_DATA_DIR, "flow_");

        // 清理旧ZIP文件
        cleanupOldFiles(ZIP_STORAGE_DIR, "EasyComposer_");
    }

    private static void cleanupOldFiles(String dir, String prefix) throws IOException {
        Path dirPath = Paths.get(dir);
        if (!Files.exists(dirPath)) return;

        long cutoff = System.currentTimeMillis() - STATUS_RETENTION;

        try (Stream<Path> files = Files.list(dirPath)) {
            files.filter(path -> path.getFileName().toString().startsWith(prefix))
                    .filter(path -> {
                        try {
                            return Files.getLastModifiedTime(path).toMillis() < cutoff;
                        } catch (IOException e) {
                            return false;
                        }
                    })
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                            logger.info("清理旧文件: {}", path);
                        } catch (IOException e) {
                            logger.warn("删除文件失败: {}", path, e);
                        }
                    });
        }
    }

    private static String buildContentDisposition(String filename, String userAgent) throws UnsupportedEncodingException {
        boolean isIE = userAgent != null &&
                (userAgent.contains("MSIE") || userAgent.contains("Trident"));

        if (isIE) {
            return "attachment; filename=" + URLEncoder.encode(filename, "UTF-8");
        } else {
            return "attachment; filename=\"" + filename + "\"";
        }
    }

    private static String getToolVersion(String command) {
        try {
            Process process = Runtime.getRuntime().exec(command);
            String output = readProcessOutput(process, 5);
            return output != null ? output.trim() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private static String readProcessOutput(Process process, int timeoutSeconds) throws Exception {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream()))) {
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
            }

            if (!process.waitFor(timeoutSeconds, TimeUnit.SECONDS)) {
                process.destroy();
                return null;
            }

            return output.length() > 0 ? output.toString() : null;
        }
    }

    private boolean checkDirectoryPermissions() {
        try {
            Path testFile = Paths.get(ZIP_STORAGE_DIR, "permission_test.tmp");
            Files.createDirectories(testFile.getParent());
            Files.write(testFile, "test".getBytes());
            Files.delete(testFile);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private static class BuildStatus {
        String status = "PENDING";
        String message = "";
        long lastActivity = System.currentTimeMillis();

        void update(String status, String message) {
            this.status = status;
            this.message = message;
            this.lastActivity = System.currentTimeMillis();
        }
    }
}
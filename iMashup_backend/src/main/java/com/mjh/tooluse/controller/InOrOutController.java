package com.mjh.tooluse.controller;

import com.mjh.tooluse.entity.ImageXml;
import com.mjh.tooluse.entity.Result;
import com.mjh.tooluse.mapper.InOrOutMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.UUID;

@RestController
public class InOrOutController {
    @Value("${file.upload.path}")
    private String uploadPath;

    @Value("${file.upload.url-prefix}")
    private String urlPrefix;

    @Autowired
    private InOrOutMapper inOrOutMapper;

    @PostMapping("/export")
    public Result export(@RequestParam("userName") String username, @RequestParam("image") MultipartFile image, @RequestParam("jsonData") String jsonData) throws IOException {
        Result result = new Result();
        try {
            File dir = new File(uploadPath);
            if (!dir.exists()) dir.mkdirs();

            String recordId = "export_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
            String originalFileName = image.getOriginalFilename();
            String suffix = originalFileName.substring(originalFileName.lastIndexOf("."));
            String fileName = UUID.randomUUID().toString() + suffix;
            File destFile = new File(dir, fileName);

            try (InputStream in = image.getInputStream();
                 FileOutputStream out = new FileOutputStream(destFile)) {

                byte[] buffer = new byte[4096];
                int len;
                while ((len = in.read(buffer)) != -1) {
                    out.write(buffer, 0, len);
                }
            }

            String imageUrl = urlPrefix + fileName;
            String content = jsonData;

            int count = inOrOutMapper.inDatabase(recordId, username, content, imageUrl);
            if (count == 1) {
                result.setCode(200);
                result.setMsg("导出成功！");
                result.setData(imageUrl);
                return result;
            } else {
                result.setCode(500);
                result.setMsg("请重新导出！");
                return result;
            }

        } catch (Exception e) {
            e.printStackTrace();
            result.setCode(500);
            result.setMsg("导出失败：" + e.getMessage());
            return result;
        }
    }

    @GetMapping("/exportRecords")
    public Result exportRecords(@RequestParam("userName") String username) {
        Result result = new Result();
        try {
            List<ImageXml> list = inOrOutMapper.getExportRecords(username);
            result.setCode(200);
            result.setMsg("success");
            result.setData(list);
        } catch (Exception e) {
            result.setCode(500);
            result.setMsg("获取记录失败！");
            result.setData(null);
        }
        return result;
    }

    @GetMapping("/importFromDB")
    public Result importFromDB(@RequestParam("recordId") String recordId, @RequestParam("userName") String username) {
        Result result = new Result();
        try {
            ImageXml record = inOrOutMapper.getRecordByIdAndUser(recordId, username);

            if (record == null) {
                result.setCode(404);
                result.setMsg("记录不存在或无权限！");
                result.setData(null);
                return result;
            }

            result.setCode(200);
            result.setMsg("导入成功！");
            result.setData(record);
        } catch (Exception e) {
            result.setCode(500);
            result.setMsg("导入失败：" + e.getMessage());
            result.setData(null);
        }
        return result;
    }

    @PostMapping("/deleteExportRecord")
    public Result deleteExportRecord(@RequestParam("recordId") String recordId, @RequestParam("userName") String username) {
        Result result = new Result();
        try {
            ImageXml record = inOrOutMapper.getRecordByIdAndUser(recordId, username);
            if (record == null) {
                result.setCode(404);
                result.setMsg("记录不存在！");
                return result;
            }
            String imageUrl = record.getImageUrl();
            if (imageUrl != null && !imageUrl.isEmpty()) {
                String fileName = imageUrl.substring(urlPrefix.length());
                String filePath = uploadPath + File.separator + fileName;
                File imageFile = new File(filePath);
                if (imageFile.exists()) {
                    boolean deleted = imageFile.delete();
                    if (deleted) {
                        System.out.println("图片文件删除成功：" + filePath);
                    } else {
                        System.err.println("图片文件删除失败：" + filePath);
                    }
                } else {
                    System.out.println("图片文件不存在，无需删除：" + filePath);
                }

                int count = inOrOutMapper.deleteExportRecord(recordId, username);
                if (count == 1) {
                    result.setCode(200);
                    result.setMsg("删除成功！");
                    result.setData(null);
                } else {
                    result.setCode(500);
                    result.setMsg("记录不存在或无权删除！");
                    result.setData(null);
                }
            }
        } catch (Exception e){
            e.printStackTrace();
            result.setCode(500);
            result.setMsg("删除失败：" + e.getMessage());
            result.setData(null);
        }
        return result;
    }
}

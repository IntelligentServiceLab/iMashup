package com.mjh.tooluse;


import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@MapperScan("com.mjh.tooluse.mapper")
@SpringBootApplication
public class ToolUseApplication {

    public static void main(String[] args) {
        SpringApplication.run(ToolUseApplication.class, args);
    }

}

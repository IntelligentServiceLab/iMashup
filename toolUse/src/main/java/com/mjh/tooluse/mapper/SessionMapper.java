package com.mjh.tooluse.mapper;

import com.mjh.tooluse.entity.ChatMessage;
import com.mjh.tooluse.entity.ChatSession;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface SessionMapper {
    @Insert("insert into esaycomposer.chat_session(sessionId, userId, title, createTime, updateTime) VALUES (#{sessionId}, #{username}, #{title}, #{nowTime}, #{nowTime})")
    int insertSessionRecord(String sessionId, String username, String title, long nowTime, long nowTime1);

    @Select("select * from chat_session where userId = #{username}")
    List<ChatSession> selectByUserId(String username);

    @Select("select * from chat_message where sessionId = #{sessionId} order by create_time asc")
    List<ChatMessage> selectLastMessageBySessionId(String sessionId);

    @Select("select * from chat_session where sessionId = #{sessionId}")
    ChatSession selectBySessionId(String sessionId);

    @Insert("insert into esaycomposer.chat_message(messageId, sessionId, role, content, create_time) VALUES (#{messageId}, #{sessionId}, #{ai}, #{userText}, #{nowTime})")
    int insertSessionMessage(String messageId, String sessionId, String ai, String userText, long nowTime);

    @Delete("delete from chat_session where userId = #{username} and sessionId = #{sessionId}")
    int delectByUsernameAndSessionIdSession(String username, String sessionId);

    @Delete("delete from chat_message where sessionId = #{sessionId}")
    int delectByUsernameAndSessionIdMessage(String username, String sessionId);
}

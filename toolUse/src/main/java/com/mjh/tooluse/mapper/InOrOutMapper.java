package com.mjh.tooluse.mapper;

import com.mjh.tooluse.entity.Ai;
import com.mjh.tooluse.entity.ImageXml;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface InOrOutMapper {
    @Insert("insert into esaycomposer.imageandxml(recordId, username, content, imageURL) VALUES (#{recordId}, #{username}, #{content}, #{imageURL} )")
    int inDatabase(String recordId, String username, String content, String imageURL);

    @Select("select content from esaycomposer.imageandxml where recordId = #{recordId} and username = #{username}")
    Ai getJson(String recordId, String username);

    @Select("select * from imageandxml where username = #{username} order by recordId desc")
    List<ImageXml> getExportRecords(String username);

    @Select("select * from imageandxml where recordId = #{recordId} and username = #{username}")
    ImageXml getRecordByIdAndUser(String recordId, String username);

    @Delete("delete from imageandxml where recordId = #{recordId} and username = #{username}")
    int deleteExportRecord(String recordId, String username);
}

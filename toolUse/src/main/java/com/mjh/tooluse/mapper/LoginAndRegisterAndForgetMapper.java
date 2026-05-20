package com.mjh.tooluse.mapper;

import com.mjh.tooluse.entity.ForgetPassword;
import com.mjh.tooluse.entity.Register;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface LoginAndRegisterAndForgetMapper {
    @Insert("insert into esaycomposer.user(phone, email, password) VALUES (#{phone}, #{email}, #{password})")
    int registerData(Register register);

    @Select("select * from esaycomposer.user where phone = #{phone}")
    Register getLoginData(String phone);

    @Update("update esaycomposer.user set password = #{newpassword} where phone = #{phone}")
    int updatePassword(String phone, String newpassword);

    @Select("select * from esaycomposer.user where phone = #{phone}")
    ForgetPassword getFinishData(String phone);

    @Select("select count(*) from esaycomposer.user where phone = #{username}")
    int getRoot(String username);
}

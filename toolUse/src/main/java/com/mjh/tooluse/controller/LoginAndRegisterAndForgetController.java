package com.mjh.tooluse.controller;

import cn.hutool.core.util.RandomUtil;
import com.mjh.tooluse.entity.*;
import com.mjh.tooluse.mapper.LoginAndRegisterAndForgetMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

@RestController
public class LoginAndRegisterAndForgetController {
    // 验证码 5min过期、60s防刷
    private static final long CODE_EXPIRE = 300l;
    private static final long SEND_LIMIT = 60l;

    // Spring 邮件发送器
    @Autowired
    private JavaMailSender mailSender;

    // Radis 操作模板
    @Autowired
    private StringRedisTemplate redisTemplate;

    @Autowired
    private LoginAndRegisterAndForgetMapper loginAndRegisterAndForgetMapper;

    // 发件人邮箱
    @Value("${spring.mail.username}")
    private  String sendEmail;

    // 发送验证码
    @PostMapping("/easycomposer/sendEmailCode")
    public Result sendEmailCode(@RequestBody Captcha captcha) {
        Result resultCode = new Result();
        if (captcha.getPhone() == null || !captcha.getPhone().matches("^1[3-9]\\d{9}$")) {
            resultCode.setCode(500);
            resultCode.setMsg("手机号格式错误！");
            resultCode.setData(null);
            return resultCode;
        }
        if (captcha.getEmail() == null || !captcha.getEmail().contains("@") || !captcha.getEmail().endsWith("@qq.com")) {
            resultCode.setCode(500);
            resultCode.setMsg("请输入正确的QQ邮箱");
            resultCode.setData(null);
            return resultCode;
        }

        // 防刷限制
        String limitKey = "email:limit:" + captcha.getType() + ":" + captcha.getPhone();
        if (redisTemplate.hasKey(limitKey)) {
            resultCode.setCode(500);
            resultCode.setMsg("验证码发送太频繁，请60秒后再试！");
            resultCode.setData(null);
            return resultCode;
        }

        // 生成6位数字验证码
        String verifyCode = RandomUtil.randomNumbers(6);

        // 存 Redis，验证码过期-5min，防刷过期-60s
        String codeKey = "email:code:" + captcha.getType() + ":" + captcha.getPhone();
        redisTemplate.opsForValue().set(codeKey, verifyCode, CODE_EXPIRE, TimeUnit.SECONDS);
        redisTemplate.opsForValue().set(limitKey, "1", SEND_LIMIT, TimeUnit.SECONDS);

        // 发送邮件
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(sendEmail);
            message.setTo(captcha.getEmail());
            message.setSubject("EasyComposer验证码通知");
            message.setText("您所用的手机号为：" + captcha.getPhone() + "\n您的验证码是：" + verifyCode + "\n有效期5分钟，请尽快使用！");
            mailSender.send(message);

            resultCode.setCode(200);
            resultCode.setMsg("验证码已发送至您的QQ邮箱，请查收！");
            resultCode.setData(null);
        } catch (Exception e) {
            e.printStackTrace();
            resultCode.setCode(500);
            resultCode.setMsg("邮件发送失败：" + e.getMessage());
        }
        return resultCode;
    }

    // 校验验证码
    private boolean checkCode(String phone, String type, String inputCode) {
        String codeKey = "email:code:" + type + ":" + phone;
        String realCode = redisTemplate.opsForValue().get(codeKey); // 从Redis取真实验证码

        // 验证码不存在（过期）或输入错误 → 返回false
        if (realCode == null || !realCode.equals(inputCode)) {
            return false;
        }
        redisTemplate.delete(codeKey); // 校验成功后删除，防止重复使用
        return true;
    }

    // 注册
    @PostMapping("/easyComposer/register")
    public Result register(@RequestBody Register register) {
        Result resultCode = new Result();
        if (!checkCode(register.getPhone(), "register", register.getCoderegister())) {
            resultCode.setCode(500);
            resultCode.setMsg("验证码错误或已过期！");
            resultCode.setData(null);
            return resultCode;
        }

        int i = loginAndRegisterAndForgetMapper.registerData(register);
        if (i == 1) {
            resultCode.setCode(200);
            resultCode.setMsg("注册成功！");
            resultCode.setData(null);
            return resultCode;
        } else {
            resultCode.setCode(500);
            resultCode.setMsg("注册失败，请重新注册！");
            resultCode.setData(null);
            return resultCode;
        }
    }

    // 登录
    @PostMapping("/easyComposer/login")
    public Result login(@RequestBody Login login) {
        Result resultCode = new Result();
        Register loginCheck = loginAndRegisterAndForgetMapper.getLoginData(login.getPhone());
        if (loginCheck == null) {
            resultCode.setCode(500);
            resultCode.setMsg("用户不存在！");
            resultCode.setData(null);
            return resultCode;
        }
        if (loginCheck.getPassword().equals(login.getPassword())) {
            resultCode.setCode(200);
            resultCode.setMsg("登录成功！");
            resultCode.setData(null);
            return resultCode;
        } else {
            resultCode.setCode(500);
            resultCode.setMsg("密码有误！");
            resultCode.setData(null);
            return resultCode;
        }
    }

    // 忘记密码
    @PostMapping("/easycomposer/resetPassword")
    public Result resetPassword(@RequestBody ForgetPassword forgetPassword) {
        System.out.println(forgetPassword);
        Result resultCode = new Result();
        if (!checkCode(forgetPassword.getPhone(), "forget_password", forgetPassword.getCodeforget())) {
            resultCode.setCode(500);
            resultCode.setMsg("验证码错误或已过期！");
            resultCode.setData(null);
            return resultCode;
        }

        int i = loginAndRegisterAndForgetMapper.updatePassword(forgetPassword.getPhone(), forgetPassword.getNewpassword());
        if (i == 1) {
                resultCode.setCode(200);
                resultCode.setMsg("修改成功！");
                resultCode.setData(null);
                return resultCode;
        } else {
            resultCode.setCode(500);
            resultCode.setMsg("修改失败！");
            resultCode.setData(null);
            return resultCode;
        }
    }
}

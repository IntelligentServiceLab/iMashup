package com.mjh.tooluse.entity;

public class Captcha {
    private String phone;
    private String email;
    private String type;

    public Captcha() {}

    public Captcha(String phone, String email, String type) {
        this.phone = phone;
        this.email = email;
        this.type = type;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}

package com.mjh.tooluse.entity;

public class Register {
    private String phone;
    private String password;
    private String email;
    private String coderegister;

    public Register() {}

    public Register(String phone, String password, String email, String coderegister) {
        this.phone = phone;
        this.password = password;
        this.email = email;
        this.coderegister = coderegister;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getCoderegister() {
        return coderegister;
    }

    public void setCoderegister(String coderegister) {
        this.coderegister = coderegister;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}

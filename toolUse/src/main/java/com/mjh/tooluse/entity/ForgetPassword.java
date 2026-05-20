package com.mjh.tooluse.entity;

public class ForgetPassword {
    private String phone;
    private String newpassword;
    private String codeforget;

    public ForgetPassword() {}

    public ForgetPassword(String phone, String newpassword, String codeforget) {
        this.phone = phone;
        this.newpassword = newpassword;
        this.codeforget = codeforget;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getNewpassword() {
        return newpassword;
    }

    public void setNewpassword(String newpassword) {
        this.newpassword = newpassword;
    }

    public String getCodeforget() {
        return codeforget;
    }

    public void setCodeforget(String codeforget) {
        this.codeforget = codeforget;
    }
}

import { useState, useCallback, useEffect } from "react";
import { Button, Input, message, Tabs, Modal } from "antd";
import './Login.css';
import request from "../../utils/request";

// 定义登录组件的Props接口
interface LoginProps {
  onLoginSuccess: (phone: string) => void; // 登录成功回调
  onCancel?: () => void; // 取消操作回调
}

// 手机号正则表达式：1开头，第二位3-9，共11位
const phoneReg = /^1[3-9]\d{9}$/;
// QQ邮箱正则表达式：1-9开头，4-10位数字，后接@qq.com
const emailReg = /^[1-9]\d{4,11}@qq\.com$/;

// 登录组件
const Login: React.FC<LoginProps> = ({ onLoginSuccess, onCancel }) => {
  // ==================== 登录相关状态 ====================
  const [phone, setPhone] = useState(''); // 登录手机号
  const [password, setPassword] = useState(''); // 登录密码
  const [loginLoading, setLoginLoading] = useState(false); // 登录加载状态/

  // ==================== 注册相关状态 ====================
  const [registerPhone, setRegisterPhone] = useState(''); // 注册手机号
  const [registerEmail, setRegisterEmail] = useState(''); // 注册邮箱
  const [registerCode, setRegisterCode] = useState(''); // 注册验证码
  const [registerPassword, setRegisterPassword] = useState(''); // 注册密码
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState(''); // 确认注册密码
  const [registerLoading, setRegisterLoading] = useState(false); // 注册加载状态
  const [registerCodeTime, setRegisterCodeTime] = useState(0); // 注册验证码倒计时
  const [registerCodeLoading, setRegisterCodeLoading] = useState(false); // 获取注册验证码加载状态

  // ==================== 忘记密码相关状态 ====================
  const [forgetWindow, setForgetWindow] = useState(false); // 忘记密码弹窗显示状态
  const [forgetPhone, setForgetPhone] = useState(''); // 忘记密码手机号
  const [forgetEmail, setForgetEmail] = useState(''); // 忘记密码邮箱
  const [captcha, setCaptcha] = useState(''); // 忘记密码验证码
  const [newPassword, setNewPassword] = useState(''); // 新密码
  const [newConfirmPassword, setNewConfirmPassword] = useState(''); // 确认新密码
  const [codeLoading, setCodeLoading] = useState(false); // 获取验证码加载状态
  const [resetLoading, setResetLoading] = useState(false); // 重置密码加载状态
  const [codeTime, setCodeTime] = useState(0); // 验证码倒计时

  /**
   * 验证手机号
   * @param value 待验证的手机号
   * @returns 验证结果
   */
  const validatePhone = (value: string) => {
    if (!value) {
      message.error('请输入手机号！');
      return false;
    }
    if (!phoneReg.test(value)) {
      message.error('请输入正确的11位手机号！');
      return false;
    }
    return true;
  };

  /**
   * 验证QQ邮箱
   * @param value 待验证的邮箱
   * @returns 验证结果
   */
  const validateQQEmail = (value: string) => {
    if (!value) {
      message.error('请输入QQ邮箱！');
      return false;
    }
    if (!emailReg.test(value)) {
      message.error('请输入正确的QQ邮箱格式！');
      return false;
    }
    return true;
  };

  /**
   * 验证密码
   * @param value 待验证的密码
   * @param label 密码字段标签
   * @returns 验证结果
   */
  const validatePassword = (value: string, label = '密码') => {
    if (!value) {
      message.error(`请输入${label}！`);
      return false;
    }
    if (value.length < 6) {
      message.error('密码长度不能少于6位！');
      return false;
    }
    return true;
  };

  /**
   * 开始倒计时
   * @param setter 设置倒计时的函数
   */
  const startCountdown = (setter: React.Dispatch<React.SetStateAction<number>>) => {
    setter(60);
  };

  /**
   * 清空注册表单
   */
  const clearRegisterForm = () => {
    setRegisterPhone('');
    setRegisterEmail('');
    setRegisterCode('');
    setRegisterPassword('');
    setRegisterConfirmPassword('');
    setRegisterCodeTime(0);
  };

  /**
   * 清空忘记密码表单
   */
  const clearForgetForm = () => {
    setForgetPhone('');
    setForgetEmail('');
    setCaptcha('');
    setNewPassword('');
    setNewConfirmPassword('');
    setCodeTime(0);
  };

  /**
   * 处理登录操作
   */
  const handleLogin = useCallback(async () => {
    if (!validatePhone(phone)) return;
    if (!password) {
      message.error('请输入密码！');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await request('/easyComposer/login', {
        method: "POST",
        data: { phone, password }
      });

      if (res?.data?.code === 200) {
        onLoginSuccess(phone);
      } else {
        message.error(res?.data?.msg || '手机号或者密码错误！');
      }
    } catch (error) {
      console.error('登录请求失败：', error);
      message.error('登录失败，请稍后重试！');
    } finally {
      setLoginLoading(false);
    }
  }, [phone, password, onLoginSuccess]);

  /**
   * 获取注册验证码
   */
  const getRegisterCode = useCallback(async () => {
    if (!validatePhone(registerPhone)) return;
    if (!validateQQEmail(registerEmail)) return;

    setRegisterCodeLoading(true);
    try {
      const res = await request('/easycomposer/sendEmailCode', {
        method: "POST",
        data: {
          phone: registerPhone,
          email: registerEmail,
          type: "register"
        }
      });

      if (res?.data?.code === 200) {
        message.success(res.data.msg || '验证码发送成功！');
        startCountdown(setRegisterCodeTime);
      } else {
        message.error(res?.data?.msg || '获取验证码失败！');
      }
    } catch (error) {
      console.error('获取注册验证码失败：', error);
      message.error('获取验证码失败，请稍后重试！');
    } finally {
      setRegisterCodeLoading(false);
    }
  }, [registerPhone, registerEmail]);

  /**
   * 处理注册操作
   */
  const handleRegister = useCallback(async () => {
    if (!validatePhone(registerPhone)) return;
    if (!validateQQEmail(registerEmail)) return;

    if (!registerCode) {
      message.error('请输入验证码！');
      return;
    }
    if (!validatePassword(registerPassword, '密码')) return;
    if (registerPassword !== registerConfirmPassword) {
      message.error('两次密码输入不一致！');
      return;
    }

    setRegisterLoading(true);
    try {
      const res = await request('/easyComposer/register', {
        method: "POST",
        data: {
          phone: registerPhone,
          password: registerPassword,
          email: registerEmail,
          coderegister: registerCode
        }
      });

      if (res?.data?.code >= 200) {
        message.success('注册成功！请登录');
        clearRegisterForm();
      } else {
        message.error(res?.data?.msg || '该手机号已注册');
      }
    } catch (error) {
      console.error('注册请求失败：', error);
      message.error('注册失败，请稍后重试！');
    } finally {
      setRegisterLoading(false);
    }
  }, [registerPhone, registerEmail, registerCode, registerPassword, registerConfirmPassword]);

  /**
   * 打开忘记密码弹窗
   */
  const openForgetWindow = useCallback(() => {
    clearForgetForm();
    setForgetWindow(true);
  }, []);

  /**
   * 关闭忘记密码弹窗
   */
  const closeForgetWindow = useCallback(() => {
    setForgetWindow(false);
  }, []);

  /**
   * 获取忘记密码验证码
   */
  const getCaptcha = useCallback(async () => {
    if (!validatePhone(forgetPhone)) return;
    if (!validateQQEmail(forgetEmail)) return;

    setCodeLoading(true);
    try {
      const res = await request('/easycomposer/sendEmailCode', {
        method: "POST",
        data: {
          phone: forgetPhone,
          email: forgetEmail,
          type: "forget_password"
        }
      });

      if (res?.data?.code === 200) {
        message.success(res.data.msg || '验证码发送成功！');
        startCountdown(setCodeTime);
      } else {
        message.error(res?.data?.msg || '获取验证码失败！');
      }
    } catch (error) {
      console.error('获取忘记密码验证码失败：', error);
      message.error('获取验证码失败，请稍后重试！');
    } finally {
      setCodeLoading(false);
    }
  }, [forgetPhone, forgetEmail]);

  /**
   * 处理重置密码操作
   */
  const handleResetPassword = useCallback(async () => {
    if (!validatePhone(forgetPhone)) return;
    if (!validateQQEmail(forgetEmail)) return;
    if (!captcha) {
      message.error('请输入验证码！');
      return;
    }
    if (!validatePassword(newPassword, '新密码')) return;
    if (newPassword !== newConfirmPassword) {
      message.error('两次密码输入不一致！');
      return;
    }

    setResetLoading(true);
    try {
      const res = await request('/easycomposer/resetPassword', {
        method: "POST",
        data: {
          phone: forgetPhone,
          newpassword: newPassword,
          codeforget: captcha
        }
      });

      if (res?.data?.code === 200) {
        message.success('密码重置成功！');
        closeForgetWindow();
        clearForgetForm();
      } else {
        message.error(res?.data?.msg || '重置密码失败！');
      }
    } catch (error) {
      console.error('重置密码失败：', error);
      message.error('重置密码失败，请稍后重试！');
    } finally {
      setResetLoading(false);
    }
  }, [forgetPhone, forgetEmail, captcha, newPassword, newConfirmPassword, closeForgetWindow]);

  /**
   * 注册验证码倒计时效果
   */
  useEffect(() => {
    if (registerCodeTime <= 0) return;
    const timer = setInterval(() => {
      setRegisterCodeTime(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [registerCodeTime]);

  /**
   * 忘记密码验证码倒计时效果
   */
  useEffect(() => {
    if (codeTime <= 0) return;
    const timer = setInterval(() => {
      setCodeTime(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [codeTime]);

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">系统登录/注册</h2>

        <Tabs
          defaultActiveKey="1"
          centered
          items={[
            {
              key: "1",
              label: "登录",
              children: (
                <>
                  <Input
                    placeholder="请输入手机号"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.trim())}
                    className="login-input"
                    maxLength={11}
                  />
                  <Input.Password
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-password"
                    onPressEnter={handleLogin}
                  />
                  <div style={{ textAlign: 'right', margin: '8px 0' }}>
                    <Button type="text" onClick={openForgetWindow} style={{ padding: 0 }}>
                      忘记密码？
                    </Button>
                  </div>
                  <div className="login-button-area">
                    <Button
                      type="primary"
                      onClick={handleLogin}
                      loading={loginLoading}
                      className="login-button"
                    >
                      登录
                    </Button>
                  </div>
                </>
              ),
            },
            {
              key: "2",
              label: "注册",
              children: (
                <>
                  <Input
                    placeholder="请输入手机号"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value.trim())}
                    className="login-input"
                    maxLength={11}
                  />
                  <Input
                    placeholder="请输入QQ邮箱号"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value.trim())}
                    className="login-input"
                  />
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    <Input
                      placeholder="请输入邮箱验证码"
                      value={registerCode}
                      onChange={(e) => setRegisterCode(e.target.value.trim())}
                      maxLength={6}
                      style={{ flex: 1 }}
                    />
                    <Button
                      type="primary"
                      onClick={getRegisterCode}
                      loading={registerCodeLoading}
                      disabled={registerCodeTime > 0}
                      style={{ width: 120 }}
                    >
                      {registerCodeTime > 0 ? `${registerCodeTime}s` : '获取验证码'}
                    </Button>
                  </div>
                  <Input.Password
                    placeholder="请设置密码（不少于6位）"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="login-input"
                  />
                  <Input.Password
                    placeholder="请确认密码"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    className="login-password"
                    onPressEnter={handleRegister}
                  />
                  <div className="login-button-area">
                    <Button
                      type="primary"
                      onClick={handleRegister}
                      loading={registerLoading}
                      className="login-button"
                    >
                      注册
                    </Button>
                  </div>
                </>
              ),
            },
          ]}
        />

        {onCancel && (
          <Button
            type="text"
            onClick={onCancel}
            style={{ marginTop: 16, width: '100%' }}
          >
            取消
          </Button>
        )}
      </div>

      {/* 忘记密码弹窗 */}
      <Modal
        title="重置密码"
        open={forgetWindow}
        onCancel={closeForgetWindow}
        footer={[
          <Button key="cancel" onClick={closeForgetWindow}>
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleResetPassword}
            loading={resetLoading}
          >
            确认重置
          </Button>,
        ]}
        destroyOnClose
      >
        <Input
          placeholder="请输入手机号"
          value={forgetPhone}
          onChange={(e) => setForgetPhone(e.target.value.trim())}
          style={{ marginBottom: 16 }}
          maxLength={11}
        />
        <Input
          placeholder="请输入接收验证码的QQ邮箱"
          value={forgetEmail}
          onChange={(e) => setForgetEmail(e.target.value.trim())}
          style={{ marginBottom: 16 }}
        />
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <Input
            placeholder="请输入邮箱验证码"
            value={captcha}
            onChange={(e) => setCaptcha(e.target.value.trim())}
            maxLength={6}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            onClick={getCaptcha}
            loading={codeLoading}
            disabled={codeTime > 0}
            style={{ width: 120 }}
          >
            {codeTime > 0 ? `${codeTime}s` : '获取验证码'}
          </Button>
        </div>
        <Input.Password
          placeholder="请设置新密码（不少于6位）"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <Input.Password
          placeholder="请确认新密码"
          value={newConfirmPassword}
          onChange={(e) => setNewConfirmPassword(e.target.value)}
          onPressEnter={handleResetPassword}
        />
      </Modal>
    </div>
  );
};

export default Login;
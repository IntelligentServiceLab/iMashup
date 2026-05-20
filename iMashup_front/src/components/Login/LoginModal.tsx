import React from 'react';
import { Modal } from 'antd';
import Login from './LoginForm';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onLoginSuccess: (phone: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({
  open,
  onClose,
  onLoginSuccess,
}) => {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={null}
      centered
      destroyOnClose
      maskClosable={false}
      width={440}
      styles={{
        content: {
          borderRadius: 24,
          padding: 24,
          background: 'rgba(255, 255, 255, 0.96)',
          boxShadow: '0 12px 40px rgba(31, 42, 68, 0.14)',
        },
        body: {
          padding: 0,
        },
        mask: {
          background: 'rgba(15, 23, 42, 0.18)',
          backdropFilter: 'blur(4px)',
        },
      }}
    >
      <Login onLoginSuccess={onLoginSuccess} onCancel={onClose}/>
    </Modal>
  );
};


export default LoginModal;
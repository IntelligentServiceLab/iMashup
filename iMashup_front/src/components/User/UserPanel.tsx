import { Drawer, Avatar, Button, Empty, Spin, Modal } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useState } from 'react';
import './userPanel.css';

type Props = {
  open: boolean;
  currentUser: string;
  onClose: () => void;
  onLogout: () => void;
  onImportFromDB: (recordId: string) => void;
  onDeleteRecord: (recordId: string) => void;
  exportRecords: any[];
  loading: boolean;
};

export default function UserPanel(props: Props) {
  const {
    open,
    currentUser,
    onClose,
    onLogout,
    onImportFromDB,
    onDeleteRecord,
    exportRecords,
    loading,
  } = props;

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  const handlePreview = (url: string) => {
    setPreviewImage(url);
    setPreviewVisible(true);
  };

  return (
    <>
      <Drawer title="历史记录" open={open} onClose={onClose} width={450}>
        <div className="user-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <Avatar size={50} icon={<UserOutlined />} style={{ backgroundColor: '#4285F4' }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{currentUser}</div>
              <div style={{ fontSize: 12, color: '#999' }}>已登录</div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>
              导出历史记录
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 30 }}>
                <Spin />
              </div>
            ) : exportRecords.length === 0 ? (
              <Empty description="暂无记录" style={{ padding: '20px 0' }} />
            ) : (
              <div>
                {exportRecords.map((item) => (
                  <div
                    key={item.recordId}
                    style={{
                      border: '1px solid #e8e8e8',
                      borderRadius: 8,
                      padding: '12px 14px',
                      marginBottom: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      background: '#fff',
                    }}
                  >
                    <div style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>
                      记录：{item.recordId}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button
                        size="small"
                        style={{ flex: 1, backgroundColor: '#1890ff', color: '#fff' }}
                        onClick={() => handlePreview(item.imageUrl)}
                      >
                        预览
                      </Button>
                      <Button
                        size="small"
                        type="primary"
                        style={{ flex: 1 }}
                        onClick={() => onImportFromDB(item.recordId)}
                      >
                        导入
                      </Button>
                      <Button
                        size="small"
                        danger
                        style={{ flex: 1 }}
                        onClick={() => onDeleteRecord(item.recordId)}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button danger block onClick={onLogout}>退出登录</Button>
        </div>
      </Drawer>

      <Modal
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={500}
        title="流程图预览"
      >
        <div style={{ textAlign: 'center' }}>
          <img src={previewImage} alt="预览" style={{ width: '100%', maxHeight: 400, objectFit: 'contain' }} />
        </div>
      </Modal>
    </>
  );
}
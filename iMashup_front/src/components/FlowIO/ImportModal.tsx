import { useEffect, useRef } from 'react';
import { Modal, Typography } from 'antd';
import './FlowIO.css';

const { Paragraph } = Typography;

type Props = {
  open: boolean;
  fileName: string;
  onFileChange: (file: File | null) => void;
  onOk: () => void;
  onCancel: () => void;
};

export default function ImportModal({
  open,
  fileName,
  onFileChange,
  onOk,
  onCancel,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [open]);

  const handleCancel = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onCancel();
  };
  return (
    <Modal
      title="导入文件"
      open={open}
      onOk={onOk}
      onCancel={handleCancel}
      okText="导入"
      cancelText="取消"
      className="workflow-modal"
    >
      <Paragraph style={{ marginBottom: 12 }}>
        请选择本地 XML 文件，用于恢复画布中的节点和连线。
      </Paragraph>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.xml"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          onFileChange(file);
        }}
      />

      <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
        当前文件：{fileName || '未选择文件'}
      </Paragraph>
    </Modal>
  );
}
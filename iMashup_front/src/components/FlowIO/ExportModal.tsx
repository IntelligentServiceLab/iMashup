import { Modal, Typography } from 'antd';

const { Paragraph } = Typography;

type Props = {
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
};

export default function ExportModal({
  open,
  onOk,
  onCancel,
}: Props) {
  return (
    <Modal
      title="导出 XML 文件"
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText="下载"
      cancelText="取消"
      className="workflow-modal"
    >
      <Paragraph style={{ marginBottom: 8 }}>
        将当前画布中的节点和连线导出为本地 XML 文件。
      </Paragraph>
      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        后续可以通过“导入 XML 文件”重新恢复到画布中。
      </Paragraph>
    </Modal>
  );
}
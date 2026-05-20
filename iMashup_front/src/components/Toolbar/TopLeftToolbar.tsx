import { Panel } from '@xyflow/react';
import { Button } from 'antd';
import { DownloadOutlined, UploadOutlined, RobotOutlined } from '@ant-design/icons';
// import './Toolbar.css';

type Props = {
  onExport: () => void;
  onImport: () => void;
  onRecommend: () => void;
};

export default function TopLeftToolbar({ onExport, onImport, onRecommend }: Props) {
  return (
    <Panel className="top-left" position="top-left">
      <div className="workflow-panel top-toolbar-left">
        <Button icon={<DownloadOutlined />} className="toolbar-btn" onClick={onExport}>
          导出
        </Button>

        <Button icon={<UploadOutlined />} className="toolbar-btn" onClick={onImport}>
          导入
        </Button>

        <div className="status-divider" />

        <Button icon={<RobotOutlined />} className="toolbar-btn" onClick={onRecommend}>
          iMashup
        </Button>
      </div>
    </Panel>
  );
}
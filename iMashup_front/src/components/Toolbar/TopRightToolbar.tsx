import { Panel } from '@xyflow/react';
import { Button } from 'antd';
import {
  SaveOutlined,
  UndoOutlined,
  PlusOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

type Props = {
  onSave: () => void;
  onRestore: () => void;
  onAddNode: () => void;
  onExecuteOpen: () => void;
};

export default function TopRightToolbar({
  onSave,
  onRestore,
  onAddNode,
  onExecuteOpen,
}: Props) {
  return (
    <Panel className="top-right" position="top-right">
      <div className="workflow-panel top-toolbar-right">

        <Button className="toolbar-btn" icon={<PlusOutlined />} onClick={onAddNode}>
          添加
        </Button>

        <Button className="toolbar-btn" icon={<SaveOutlined />} onClick={onSave}>
          保存
        </Button>

        <Button className="toolbar-btn" icon={<UndoOutlined />} onClick={onRestore}>
          撤回
        </Button>

        <div className="status-divider" />

        <Button
          className="toolbar-btn success-action"
          icon={<ThunderboltOutlined />}
          onClick={onExecuteOpen}
        >
          执行
        </Button>
      </div>
    </Panel>
  );
}
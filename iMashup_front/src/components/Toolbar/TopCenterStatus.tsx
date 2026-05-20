import { Panel } from '@xyflow/react';
import { Avatar } from 'antd';
import { UserOutlined, DeploymentUnitOutlined } from '@ant-design/icons';
import './Toolbar.css'

type Props = {
  currentUser: string;
  currentNodeCount: number;
  currentEdgeCount: number;
  onUserClick: () => void;
};

export default function TopCenterStatus({
  currentUser,
  currentNodeCount,
  currentEdgeCount,
  onUserClick,
}: Props) {
  return (
    <Panel className="top-center" position="top-center">
      <div className="workflow-panel top-center-status">
        <a
          className="brand-cluster brand-link"
          href="https://baidu.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="workflow-brand-icon">
            <DeploymentUnitOutlined />
          </div>
          <div className="brand-copy">
            <span className="brand-title">Workflow Studio</span>
            <span className="brand-subtitle">智能体节点编排工作台</span>
          </div>
        </a>

        <div className="status-divider" />

        <div className="user-badge" onClick={onUserClick} style={{ cursor: 'pointer' }}>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#4c84ff' }} />
          <div className="user-meta">
            <span className="user-name">{currentUser || '点击登录'}</span>
          </div>
        </div>

        <div className="status-chip-group">
          <div className="status-chip blue">
            <span className="status-chip-dot" />
            节点 {currentNodeCount}
          </div>
          <div className="status-chip purple">
            <span className="status-chip-dot" />
            连线 {currentEdgeCount}
          </div>
        </div>
      </div>
    </Panel>
  );
}
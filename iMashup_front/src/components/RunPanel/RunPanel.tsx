import { Drawer, Button, Input } from 'antd';
import './RunPanel.css';

const TextArea = Input.TextArea;

type RunItem = {
  key: string;
  name?: string;
  type?: string;
  text?: string;
  value?: {
    text?: string;
  };
};

type Props = {
  open: boolean;
  onClose: () => void;
  onExecute: () => void;
  inputItems: RunItem[];
  outputItems: RunItem[];
  updateItem: (key: string, value: string) => void;
  getHeight: (text: string | undefined) => number;
};

export default function RunDrawer({
  open,
  onClose,
  onExecute,
  inputItems,
  outputItems,
  updateItem,
  getHeight,
}: Props) {
  return (
    <Drawer
      title="试运行"
      onClose={onClose}
      open={open}
      className="workflow-drawer"
    >
      <div className="drawer-section-header">
        <h3 className="drawer-section-title">输入</h3>
        <Button className="toolbar-btn success-action" type="primary" onClick={onExecute}>
          执行
        </Button>
      </div>

      {inputItems.map((item, index) => (
        <div className="drawer-field-row" key={item.key || index}>
          <div className="drawer-field-meta">
            <div className="drawer-field-head">
              <span className="drawer-field-name">{item?.name}</span>
              {item?.type && <span className="drawer-field-type-badge">{item.type}</span>}
            </div>
          </div>
          <TextArea
            className="drawer-textarea"
            style={{ width: '100%', height: getHeight(item?.text) }}
            value={item?.text}
            onChange={(e) => updateItem(item.key, e.target.value)}
          />
        </div>
      ))}

      <div className="drawer-separator" />

      <div className="drawer-section-header drawer-section-header-output">
        <h3 className="drawer-section-title">输出结果</h3>
      </div>

      {outputItems.map((item, index) => (
        <div className="drawer-field-row" key={item.key || index}>
          <div className="drawer-field-meta">
            <div className="drawer-field-head">
              <span className="drawer-field-name">{item?.name}</span>
              {item?.type && <span className="drawer-field-type-badge">{item.type}</span>}
            </div>
          </div>
          <TextArea
            disabled
            className="drawer-textarea"
            style={{
              width: '100%',
              height: getHeight(item?.value?.text),
            }}
            value={item?.value?.text}
          />
        </div>
      ))}
    </Drawer>
  );
}
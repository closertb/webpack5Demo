import { useState } from 'react';
import ReactDOM from 'react-dom';
import { Button, Tooltip } from 'antd';
import { StepBackwardOutlined } from '@ant-design/icons'

const Example = () => {
  const [cn, setCn] = useState(5);
  return (
    <div>
      <div>
        <Button type="primary">start test</Button></div>
        <Tooltip title={`this is a toolTop test`}>
          <div style={{ marginTop: 30 }}>example page, the number {cn}</div>
        </Tooltip>
      <div>
      <StepBackwardOutlined />
      </div>
    </div>);
};

ReactDOM.render(
  <Example />,
  document.getElementById('app-root'),
);
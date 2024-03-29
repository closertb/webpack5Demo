import { useState } from 'react';
import ReactDOM from 'react-dom';
import { Button, Popover } from 'antd';
import { StepBackwardOutlined } from '@ant-design/icons'

const App = () => {
  const [cn, setCn] = useState(5);
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <div>
        <Button type="primary">start test</Button></div>
        <Popover content={<div><div>content number one</div><div>content number two</div></div>} title="this is a popover test">
          <div style={{ marginTop: 70 }} onClick={() => setVisible(!visible)}>home page, the value is {cn}</div>
        </Popover>
      <div>
      <StepBackwardOutlined />
      </div>
    </div>);
};

ReactDOM.render(
  <App />,
  document.getElementById('app-root'),
);
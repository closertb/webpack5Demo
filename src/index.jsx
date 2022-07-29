import { useState } from 'react';
import ReactDOM from 'react-dom';
import Antd from 'antd';
import { StepBackwardOutlined } from '@ant-design/icons'

console.log('sd');

const App = () => {
  const [cn, setCn] = useState(5);
  return (
    <div>
      <div><Antd.Button type="primary">start test</Antd.Button></div>
      cn value is {cn}
      <div><StepBackwardOutlined /></div>
    </div>);
};

ReactDOM.render(
  <App />,
  document.getElementById('app-root'),
);
import { useState } from 'react';
import ReactDOM from 'react-dom';
import antd from 'antd';
import { StepBackwardOutlined } from '@ant-design/icons'

console.log('sd');

const App = () => {
  const [cn, setCn] = useState(5);
  return (
    <div>
      <antd.Button type="primary">start test</antd.Button>
      cn value is {cn}
      <StepBackwardOutlined />
    </div>);
};

ReactDOM.render(
  <App />,
  document.getElementById('app-root'),
);
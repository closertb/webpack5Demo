import React from 'react';
import ReactDOM from 'react-dom';
import { StepBackwardOutlined } from '@ant-design/icons'

console.log('sd');

const App = () => {
  const [cn, setCn] = React.useState(5);
  return (<div>
  start test
  cn value is {cn}
  <StepBackwardOutlined />
</div>)
};

ReactDOM.render(
  <App />,
  document.getElementById('app-root'),
);
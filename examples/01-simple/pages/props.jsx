import React, { useState } from 'react';

export const HelloWorld = (props) => {
  const [count, setCount] = useState(props.count);

  const onClick = () => {
    setCount(count + 1);
  };

  return (
    <>
      <button onClick={onClick}>Clicked {count}</button>
    </>
  );
};

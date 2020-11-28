import { FaAmericanSignLanguageInterpreting } from 'react-icons/fa';
import React, { useState } from 'react';

export const HelloWorld = ({ typescript }) => {
  const [count, setCount] = useState(0);

  const onClick = () => {
    setCount(count + 1);
  };

  return (
    <>
      <FaAmericanSignLanguageInterpreting size={120} />
      <button onClick={onClick}>Clicked {count}</button>
      <p>This was a tsx file and uses {typescript}</p>
      <p>ts-node can be used to run without a tsc build step</p>
      <p>Nodemon will watch for tsx file changes</p>
      <p>
        Watchers such as node-dev and ts-node-dev will not pick up on tsx
        changes because the files aren't imported into your normal dependency
      </p>
    </>
  );
};

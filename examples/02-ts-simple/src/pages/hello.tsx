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
    </>
  );
};

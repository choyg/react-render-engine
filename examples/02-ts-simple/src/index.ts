import { createReactRenderer } from 'react-render-engine';
const express = require('express');

const bootstrap = async () => {
  const app = express();
  await createReactRenderer(app, {
    glob: __dirname + '/pages/**/*.js',
  });
  app.get('/', (req, res) => {
    res.render('hello', { typescript: 'typescript' });
  });

  app.listen(3000, () => {
    console.log('Listening on port 3000');
  });
};

bootstrap()
  .then(() => {})
  .catch((err) => console.error(err));

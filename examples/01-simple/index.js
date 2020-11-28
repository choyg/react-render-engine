const { createReactRenderer } = require('react-render-engine');
const express = require('express');

const bootstrap = async () => {
  const app = express();
  await createReactRenderer(app, {
    glob: __dirname + '/pages/**/*.jsx',
  });
  app.get('/', (req, res) => {
    res.render('hello');
  });

  app.get('/props', (req, res) => {
    res.render('props', { count: 300 });
  });

  app.listen(3000, () => {
    console.log('Listening on port 3000');
  });
};

bootstrap()
  .then()
  .catch((err) => console.error(err));

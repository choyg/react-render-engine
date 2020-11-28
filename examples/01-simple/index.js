const { createReactRenderer } = require('react-render-engine');
const express = require('express');

const bootstrap = async () => {
  const app = express();
  await createReactRenderer(app, {
    glob: '**/*.jsx',
    root: __dirname + '/pages',
  });
  app.get('/', (req, res) => {
    res.render('hello');
  });

  app.get('/props', (req, res) => {
    res.render('props', { count: 300 });
  });

  app.get('/nested/nested', (req, res) => {
    res.render('nested/nested');
  });

  app.get('/nested', (req, res) => {
    res.render('nested');
  });

  app.listen(3000, () => {
    console.log('Listening on port 3000');
  });
};

bootstrap()
  .then()
  .catch((err) => console.error(err));

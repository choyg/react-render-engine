const { createReactRenderer } = require('react-render-engine');
const express = require('express');

const bootstrap = async () => {
  const app = express();
  await createReactRenderer(app, {
    include: ['**.jsx'],
    pages: 'pages',
  });
  app.get('/', (req, res) => {
    res.render('hello.jsx');
  });

  app.listen(3000, () => {
    'Listening on port 3000';
  });
};

bootstrap();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_render_engine_1 = require("react-render-engine");
const express = require('express');
const bootstrap = async () => {
    const app = express();
    await react_render_engine_1.createReactRenderer(app, {
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
    .then(() => { })
    .catch((err) => console.error(err));
//# sourceMappingURL=index.js.map
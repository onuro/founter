const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const port = process.env.PORT || 3000;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    createServer((req, res) => {
        handle(req, parse(req.url, true), res);
    }).listen(port, () => {
        console.log(`> Ready on http://localhost:${port}`);
    });
});
const { createServer } = require('http');
const next = require('next');

const port = process.env.PORT || 3005;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    createServer(async (req, res) => {
        try {
            await handle(req, res);
        } catch (err) {
            console.error('Error handling request:', err);
            res.statusCode = 500;
            res.end('Internal Server Error');
        }
    }).listen(port, () => {
        console.log(`> Ready on http://localhost:${port}`);
    });
});
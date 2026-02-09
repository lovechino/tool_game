import express from 'express';

const app = express();
const port = 3001;

app.get('/', (req, res) => {
    res.send('Test server works!');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Test server running at http://localhost:${port}`);
});

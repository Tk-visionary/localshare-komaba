import app from './app.js';

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Server running (${process.env.NODE_ENV}) on ${port}`));
import express from 'express'
const app = express()

app.get('/api', (req, res) => {
  const path = `/api/item/item_id`;
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
  res.end(`Hello! Go to item: <a href="${path}">${path}</a>`);
});

app.get('/api/item/:slug', (req, res) => {
  const { slug } = req.params;
  res.end(`Item: ${slug}`);
});

const port = process.env.PORT || 13151 // the word money as its letter positions in the abc = 13 15 14 5 25
const host = 'localhost'
app.listen(port, host, () => {
  console.info(`Server listening \n at http://${host}:${port} \n and http://localhost:${port}`)
})

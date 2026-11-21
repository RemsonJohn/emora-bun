const http = require("node:http")
const fs = require("node:fs")
const path = require("node:path")
const root = __dirname
const mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".webp": "image/webp" }
http.createServer((req, res) => {
  let pathname
  try { pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname) } catch { res.writeHead(400).end(); return }
  const file = path.resolve(root, "." + (pathname === "/" ? "/index.html" : pathname))
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return }
  if (!mime[path.extname(file)]) { res.writeHead(404).end(); return }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end(); return }
    res.writeHead(200, { "Content-Type": mime[path.extname(file)], "Cache-Control": "no-store" })
    res.end(data)
  })
}).listen(5180, "127.0.0.1", () => console.log("Design review: http://127.0.0.1:5180"))

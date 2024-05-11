import * as functions from "@google-cloud/functions-framework";
import escapeHTML from "escape-html";

functions.http('helloHttp', (req, res) => {
  res.send(`Hello ${escapeHTML(req.query.name || req.body.name || 'World')}!`);
})


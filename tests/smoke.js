// Smoke test: every page loads with no console errors and no horizontal
// scrolling, at a phone viewport and a desktop viewport.
//
//   npm install --no-save playwright   (once; or use a global install)
//   node tests/smoke.js
//
// Serves the repo root itself, so there is nothing else to start.
var http = require('http');
var fs = require('fs');
var path = require('path');
var chromium = require('playwright').chromium;

var ROOT = path.join(__dirname, '..');
var TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg' };
var ROUTES = ['#/foods', '#/food/apple', '#/medicinal', '#/herb/psyllium',
  '#/recipes', '#/you', '#/weight', '#/settings', '#/sources'];
var VIEWPORTS = { phone: { width: 390, height: 844 }, desktop: { width: 1280, height: 800 } };

var server = http.createServer(function (req, res) {
  var file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (file.slice(-1) === '/') file += 'index.html';
  if (file.indexOf(ROOT) !== 0) { res.writeHead(403); return res.end(); }
  fs.readFile(file, function (err, body) {
    if (err) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(body);
  });
});

server.listen(0, async function () {
  var base = 'http://localhost:' + server.address().port + '/';
  var browser = await chromium.launch();
  var failures = [];
  for (var name in VIEWPORTS) {
    var phone = name === 'phone';
    var ctx = await browser.newContext({ viewport: VIEWPORTS[name], isMobile: phone, hasTouch: phone });
    var page = await ctx.newPage();
    var errors = [];
    page.on('console', function (m) { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', function (e) { errors.push(e.message); });
    for (var i = 0; i < ROUTES.length; i++) {
      errors.length = 0;
      await page.goto(base + ROUTES[i]);
      await page.waitForSelector('main#main > *');
      var overflow = await page.evaluate(function () {
        var d = document.documentElement;
        return d.scrollWidth > d.clientWidth ? d.scrollWidth + 'px > ' + d.clientWidth + 'px' : '';
      });
      var label = name + ' ' + ROUTES[i];
      if (errors.length) failures.push(label + ': console errors: ' + errors.join(' | '));
      if (overflow) failures.push(label + ': horizontal scroll ' + overflow);
      console.log((errors.length || overflow ? 'FAIL ' : 'ok   ') + label);
    }
    await ctx.close();
  }
  await browser.close();
  server.close();
  if (failures.length) {
    console.error('\n' + failures.join('\n'));
    process.exit(1);
  }
  console.log('\nAll pages load cleanly at both viewports.');
});

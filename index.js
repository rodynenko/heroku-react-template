const express = require("express");
const path = require("path");
const compression = require("compression");
const cors = require("cors");
const app = express();
const cheerio = require("cheerio");
const fs = require("fs");
const pageHead = require("./public/pageHead.json");

app.set('port', process.env.PORT || 3000);
app.use(compression({ threshold: 1024 }));
app.use(cors());

app.get('/*', function (req, res, next) {
	if (req.url.indexOf("/assets/") === 0) {
		res.setHeader("Cache-Control", "public, max-age=2592000");
		res.setHeader("Expires", new Date(Date.now() + 2592000000).toUTCString());
	}
	next();
});

app.use(express.static(__dirname + '/public/assets'));

app.use((req, res, next) => {
	if (req.path !== '/') {
		express.static(__dirname + '/public')(req, res, next);
		return;
	}

	next();
});

app.use((req, res, next) => {
	const { path } = req;
	const headTags = pageHead[path];
	const indexPath = __dirname + '/public/index.html';

	if (headTags) {
		// add tags to head, and send html
		fs.readFile(indexPath, { encoding: 'utf-8' }, (err, html) => {
			if (err) return next(err);
			const $ = cheerio.load(html);
			const head = $('head');

			if (headTags.title) {
				const title = head.find('title');

				if (title.length) {
					title.text(headTags.title);
				} else {
					head.append(`<title>${headTags.title}</title>`);
				}
			}

			if (headTags.description) {
				head.append(`<meta name="description" content="${headTags.description}" />`);
			}

			if (headTags.keywords) {
				head.append(`<meta name="keywords" content="${headTags.keywords}" />`);
			}

			res.send($.html());
		});
	} else {
		res.sendFile(indexPath);
	}
});

app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send('Something broke!');
});

app.listen(app.get('port'), () => {
	console.log('Node app is running on port ' + app.get('port'));
});

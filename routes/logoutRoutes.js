// Imports
const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));

router.get("/", (request, response, _) => {
	if(request.session) {
		request.session.destroy(() => {
			response.redirect("/login");
		});
	}
});

module.exports = router;
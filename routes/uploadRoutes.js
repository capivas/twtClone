// Imports
const express = require("express");
const router = express.Router();
const caminho = require("path");

router.get("/imagens/:local/:caminho", async (request, response, _) => {
	response.sendFile(caminho.join(__dirname, `../uploads/imagens/${request.params.local}/${request.params.caminho}`));
});

module.exports = router;
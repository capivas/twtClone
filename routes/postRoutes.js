// Imports
const status = require("../util/status");
const express = require("express");
const router = express.Router();

router.get("/:id", (request, response, {}) => {
	let payload = {
		tituloPagina: "Ver postagem",
		usuarioLogado: request.session.usuarioLogado,
		usuarioLogadoJs: JSON.stringify(request.session.usuarioLogado),
		idPost: request.params.id
	};

	response.status(status.STATUS_SUCCESS).render("paginaPost", payload);
});

module.exports = router;
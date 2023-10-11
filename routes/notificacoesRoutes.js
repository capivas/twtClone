// Imports
const status = require("../util/status");
const express = require("express");
const router = express.Router();

router.get("/", async (request, response, {}) => {
	let payload = {
		tituloPagina: "Notificações",
		usuarioLogado: request.session.usuarioLogado,
		usuarioLogadoJs: JSON.stringify(request.session.usuarioLogado),
	};

	response.status(status.STATUS_SUCCESS).render("paginaNotificacoes", payload);
});

module.exports = router;
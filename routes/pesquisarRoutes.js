// Imports
const status = require("../util/status");
const express = require("express");
const router = express.Router();

router.get("/", async (request, response, _) => {
	let payload = criarPayload(request.session.usuarioLogado);

	response.status(status.STATUS_SUCCESS).render("paginaPesquisar", payload);
});

router.get("/:tabSelecionada", async (request, response, _) => {
	let payload = criarPayload(request.session.usuarioLogado);
	payload.tabSelecionada = request.params.tabSelecionada;

	response.status(status.STATUS_SUCCESS).render("paginaPesquisar", payload);
});

function criarPayload(usuarioLogado) {
	return {
		tituloPagina: "Pesquisar",
		usuarioLogado: usuarioLogado,
		usuarioLogadoJs: JSON.stringify(usuarioLogado),
	};
}

module.exports = router;
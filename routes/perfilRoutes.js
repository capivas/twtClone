// Imports
const status = require("../util/status");
const express = require("express");
const router = express.Router();
const Usuario = require("../schemas/UsuarioSchema");

router.get("/", async (request, response, _) => {
	let payload = {
		tituloPagina: request.session.usuarioLogado.nomeUsuario,
		usuarioLogado: request.session.usuarioLogado,
		usuarioLogadoJs: JSON.stringify(request.session.usuarioLogado),
		usuarioPerfil: request.session.usuarioLogado
	};

	response.status(status.STATUS_SUCCESS).render("paginaPerfil", payload);
});

router.get("/:nomeUsuario", async (request, response, _) => {
	let payload = await getPayload(request.params.nomeUsuario, request.session.usuarioLogado);

	response.status(status.STATUS_SUCCESS).render("paginaPerfil", payload);
});

router.get("/:nomeUsuario/:acao", async (request, response, _) => {
	let payload = await getPayload(request.params.nomeUsuario, request.session.usuarioLogado);
	let render = '/';

	let acao = request.params.acao;
	switch (acao) {
		case "respostas":
			payload.tabSelecionada = "respostas";
			render = "paginaPerfil";
			break;
		case "seguindo":
			payload.tabSelecionada = "seguindo";
			render = "seguidores";
			break;
		case "seguidores":
			payload.tabSelecionada = "seguidores";
			render = "seguidores";
			break;
		default:
			return response.sendStatus(status.STATUS_NOT_FOUND);
	}
	return response.status(status.STATUS_SUCCESS).render(render, payload);
});

async function getPayload(nomeUsuario, usuarioLogado) {
	let usuario = await Usuario.findOne({ nomeUsuario: nomeUsuario }, { email: 0, senha: 0, updatedAt: 0 });
	if(usuario)
		return {
			tituloPagina: usuario.nomeUsuario,
			usuarioLogado: usuarioLogado,
			usuarioLogadoJs: JSON.stringify(usuarioLogado),
			usuarioPerfil: usuario
		};

	// Caso o usuário não tenha sido encontrado originalmente, será feita uma busca para verificar se o campo
	// 'nomeUsuario' não está preenchido com o ID do usuário.
	usuario = await Usuario.findById(nomeUsuario, { email: 0, senha: 0, updatedAt: 0 });
	if(usuario)
		return {
			tituloPagina: usuario.nomeUsuario,
			usuarioLogado: usuarioLogado,
			usuarioLogadoJs: JSON.stringify(usuarioLogado),
			usuarioPerfil: usuario
		};

	return {
		tituloPagina: "Usuário não encontrado",
		usuarioLogado: usuarioLogado,
		usuarioLogadoJs: JSON.stringify(usuarioLogado)
	};
}

module.exports = router;
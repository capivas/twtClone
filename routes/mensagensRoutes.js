// Imports
const status = require("../util/status");
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Usuario = require("../schemas/UsuarioSchema");
const Conversa = require("../schemas/ConversaSchema");

router.get("/", async (request, response, _) => {
	let payload = {
		tituloPagina: "Caixa de entrada",
		usuarioLogado: request.session.usuarioLogado,
		usuarioLogadoJs: JSON.stringify(request.session.usuarioLogado),
	};

	response.status(status.STATUS_SUCCESS).render("paginaCaixaEntrada", payload);
});

router.get("/nova", async (request, response, _) => {
	let payload = {
		tituloPagina: "Nova mensagem",
		usuarioLogado: request.session.usuarioLogado,
		usuarioLogadoJs: JSON.stringify(request.session.usuarioLogado),
	};

	response.status(status.STATUS_SUCCESS).render("paginaNovasMensagens", payload);
});

router.get("/:idConversa", async (request, response, _) => {
	let idUsuario = request.session.usuarioLogado._id;
	let idConversa = request.params.idConversa;

	let payload = {
		tituloPagina: 'Mensagens',
		usuarioLogado: request.session.usuarioLogado,
		usuarioLogadoJs: JSON.stringify(request.session.usuarioLogado)
	};

	let idValido = mongoose.isValidObjectId(idConversa);
	if(!idValido) {
		payload.mensagemErro = "Conversa não existe ou você não possui permissão para acessá-la.";
		return response.status(status.STATUS_SUCCESS).render("paginaMensagens", payload);
	}

	let conversa = await Conversa.findOne({ _id: idConversa, usuarios: { $elemMatch: { $eq: idUsuario } } } )
		.populate("usuarios");

	if(!conversa) {
		let usuarioCorrespondente = await Usuario.findById(idConversa);
		if(usuarioCorrespondente != null)
			conversa = await getConversaPelosIdsUsuarios(idUsuario, idConversa);
	}

	if(!conversa)
		payload.mensagemErro = "Conversa não existe ou você não possui permissão para acessá-la.";
	else
		payload.conversa = conversa;

	return response.status(status.STATUS_SUCCESS).render("paginaMensagens", payload);
});

function getConversaPelosIdsUsuarios(idUsuarioLogado, idUsuarioCorrespondente) {
	return Conversa.findOneAndUpdate({
		conversaEmGrupo: false,
		usuarios: {
			$size: 2,
			$all: [
				{ $elemMatch: { $eq: new mongoose.Types.ObjectId(idUsuarioLogado) } },
				{ $elemMatch: { $eq: new mongoose.Types.ObjectId(idUsuarioCorrespondente) } }
			]
		}
	}, {
		$setOnInsert: {
			usuarios: [idUsuarioLogado, idUsuarioCorrespondente]
		}
	}, {
		new: true,
		upsert: true
	}).populate("usuarios");
}

module.exports = router;
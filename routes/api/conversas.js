// Imports
const status = require("../../util/status");
const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const Conversa = require("../../schemas/ConversaSchema");
const Usuario = require("../../schemas/UsuarioSchema");
const Mensagem = require("../../schemas/MensagemSchema");

app.use(bodyParser.urlencoded({ extended: false }));

router.post("/", async (request, response, _) => {
	if(!request.body.usuarios) {
		console.log("Nenhum usuário enviado no request.");
		return response.sendStatus(status.STATUS_BAD_REQUEST);
	}

	let usuarios = JSON.parse(request.body.usuarios);
	if(usuarios.length == 0) {
		console.log("O array de usuários está vazio.");
		return response.sendStatus(status.STATUS_BAD_REQUEST);
	}

	usuarios.push(request.session.usuarioLogado);

	let dadosConversa = {
		usuarios: usuarios,
		conversaEmGrupo: true // usuarios.length > 2
	};

	Conversa.create(dadosConversa).then((resultado) => {
		return response.status(status.STATUS_CREATED).send(resultado);
	}).catch((erro) => {
		console.log(erro);
		return response.sendStatus(status.STATUS_BAD_REQUEST);
	});
});

router.get("/", async (request, response, _) => {
	Conversa.find({ usuarios: { $elemMatch: { $eq: request.session.usuarioLogado._id } } })
	.populate("usuarios")
	.populate("ultimaMensagem")
	.sort({ updatedAt: -1 })
	.then(async (resultados) => {
		if(request.query.apenasNaoLidas !== undefined && request.query.apenasNaoLidas == "true") {
			resultados = resultados.filter(resultado => {
				return resultado.ultimaMensagem != null && !resultado.ultimaMensagem.lidoPor.includes(request.session.usuarioLogado._id) && resultado.ultimaMensagem.remetente != request.session.usuarioLogado._id;
			});
		}

		resultados = await Usuario.populate(resultados, { path: "ultimaMensagem.remetente" });
		return response.status(status.STATUS_SUCCESS).send(resultados);
	}).catch((erro) => {
		console.log(erro);
		return response.sendStatus(status.STATUS_BAD_REQUEST);
	});
});

router.put("/:idConversa", async (request, response, _) => {
	Conversa.findByIdAndUpdate(request.params.idConversa, request.body)
	.then((resultados) => {
		return response.status(status.STATUS_NO_CONTENT).send(resultados);
	}).catch((erro) => {
		console.log(erro);
		return response.sendStatus(status.STATUS_BAD_REQUEST);
	});
});

router.get("/:idConversa", async (request, response, _) => {
	Conversa.findOne({ _id: request.params.idConversa })
	.populate("usuarios")
	.populate("ultimaMensagem")
	.then(async (resultados) => {
		resultados = await Usuario.populate(resultados, { path: "ultimaMensagem.remetente" });
		return response.status(status.STATUS_SUCCESS).send(resultados);
	}).catch((erro) => {
		console.log(erro);
		return response.sendStatus(status.STATUS_BAD_REQUEST);
	});
});

router.get("/:idConversa/mensagens", async (request, response, _) => {
	Mensagem.find({ conversa: request.params.idConversa })
	.populate("remetente")
	.then((resultados) => {
		return response.status(status.STATUS_SUCCESS).send(resultados);
	}).catch((erro) => {
		console.log(erro);
		return response.sendStatus(status.STATUS_BAD_REQUEST);
	});
});

router.put("/:idConversa/mensagens/marcarComoLidas", async (request, response, _) => {
	Mensagem.updateMany({ conversa: request.params.idConversa }, { $addToSet: { lidoPor: request.session.usuarioLogado._id } })
	.then(() => {
		return response.sendStatus(status.STATUS_NO_CONTENT);
	}).catch((erro) => {
		console.log(erro);
		return response.sendStatus(status.STATUS_BAD_REQUEST);
	});
});

module.exports = router;
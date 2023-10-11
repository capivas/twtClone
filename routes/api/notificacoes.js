// Imports
const status = require("../../util/status");
const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const Notificacao = require("../../schemas/NotificacaoSchema");

app.use(bodyParser.urlencoded({ extended: false }));

router.get("/", async (request, response, _) => {
	let objetoBusca = { usuarioNotificado: request.session.usuarioLogado._id, tipoNotificacao: { $ne: "novaMensagem" } };

	if(request.query.apenasNaoLidas !== undefined && request.query.apenasNaoLidas == 'true')
		objetoBusca.aberta = false;

	Notificacao.find(objetoBusca)
		.populate("usuarioNotificado")
		.populate("usuarioEnviou")
		.sort({ createdAt: -1 })
		.then(resultados => {
			response.status(status.STATUS_SUCCESS).send(resultados);
		}).catch(erro => {
			console.log("Erro ao buscar notificações:", erro);
			response.sendStatus(status.STATUS_BAD_REQUEST);
		});
});

router.get("/ultima", async (request, response, _) => {
	Notificacao.findOne({ usuarioNotificado: request.session.usuarioLogado._id })
	.populate("usuarioNotificado")
	.populate("usuarioEnviou")
	.sort({ createdAt: -1 })
	.then(resultados => {
		response.status(status.STATUS_SUCCESS).send(resultados);
	}).catch(erro => {
		console.log("Erro ao buscar notificações:", erro);
		response.sendStatus(status.STATUS_BAD_REQUEST);
	});
});

router.put("/:idNotificacao/marcarComoLida", async (request, response, _) => {
	Notificacao.findByIdAndUpdate(request.params.idNotificacao, { aberta: true })
	.then(() => {
		return response.sendStatus(status.STATUS_NO_CONTENT);
	}).catch(erro => {
		console.log("Erro ao marcar notificação como lida:", erro);
		return response.sendStatus(status.STATUS_BAD_REQUEST);
	});
});

router.put("/marcarComoLida", async (request, response, _) => {
	Notificacao.updateMany({ usuarioNotificado: request.session.usuarioLogado._id, tipoNotificacao: { $ne: "novaMensagem" } }, { aberta: true })
	.then(() => {
		return response.sendStatus(status.STATUS_NO_CONTENT);
	}).catch((erro) => {
		console.log("Erro ao marcar mensagens como lidas:", erro);
		return response.sendStatus(status.STATUS_BAD_REQUEST);
	})
});

module.exports = router;
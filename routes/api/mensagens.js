// Imports
const status = require("../../util/status");
const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const Conversa = require("../../schemas/ConversaSchema");
const Mensagem = require("../../schemas/MensagemSchema");
const Usuario = require("../../schemas/UsuarioSchema");
const Notificacao = require("../../schemas/NotificacaoSchema");

app.use(bodyParser.urlencoded({ extended: false }));

router.post("/", async (request, response, _) => {
	if(!request.body.conteudo || !request.body.idConversa) {
		console.log("Dados informados para criação de mensagem inválidos.")
		return response.sendStatus(status.STATUS_BAD_REQUEST);
	}

	let novaMensagem = {
		remetente: request.session.usuarioLogado,
		conteudo: request.body.conteudo,
		conversa: request.body.idConversa
	};

	Mensagem.create(novaMensagem).then(async (mensagem) => {
		mensagem = await mensagem.populate("remetente");
		mensagem = await mensagem.populate("conversa");
		mensagem = await Usuario.populate(mensagem, { path: "conversa.usuarios" });

		let conversa = await Conversa.findByIdAndUpdate(request.body.idConversa, { ultimaMensagem: mensagem })
			.catch((erro) => console.log("Erro ao atribuir última mensagem à conversa:", erro));

		criarNotificacoes(conversa, mensagem);
		return response.status(status.STATUS_CREATED).send(mensagem);
	}).catch(erro => {
		console.log(erro);
		return response.sendStatus(status.STATUS_BAD_REQUEST);
	});
});

function criarNotificacoes(conversa, mensagem) {
	conversa.usuarios.forEach(idUsuario => {
		if(idUsuario == mensagem.remetente._id.toString())
			return;

		Notificacao.inserirNotificacao(idUsuario, mensagem.remetente._id, "novaMensagem", mensagem.conversa._id);
	});
}

module.exports = router;
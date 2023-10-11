// Imports
const status = require("../../util/status");
const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const Usuario = require("../../schemas/UsuarioSchema");
const Notificacao = require("../../schemas/NotificacaoSchema");
require("../../schemas/PostSchema");
app.use(bodyParser.urlencoded({ extended: false }));

router.get("/", async (request, response, _) => {
	let objetoBusca = request.query;

	if(request.query.pesquisar !== undefined) {
		objetoBusca = {
			$or: [
				{ nomeUsuario: { $regex: request.query.pesquisar, $options: "i" } },
				{ nome: { $regex: request.query.pesquisar, $options: "i" } },
				{ sobrenome: { $regex: request.query.pesquisar, $options: "i" } }
			]
		}
	}

	Usuario.find(objetoBusca).then(resultados => {
		response.status(status.STATUS_SUCCESS).send(resultados);
	}).catch((erro) => {
		console.log(erro);
		response.sendStatus(status.STATUS_BAD_REQUEST);
	});
});

router.put("/:idUsuario/seguir", async (request, response, _) => {
	let idUsuario = request.params.idUsuario;
	let usuario = await Usuario.findById(idUsuario, { email: 0, senha: 0, updatedAt: 0 });
	if(usuario == null)
		return response.sendStatus(status.STATUS_NOT_FOUND);
	let estaSeguindo = usuario.seguidores && usuario.seguidores.includes(request.session.usuarioLogado._id);
	let option = estaSeguindo ? "$pull" : "$addToSet";

	try {
		request.session.usuarioLogado = await Usuario.findByIdAndUpdate(request.session.usuarioLogado._id, { [option]: { seguindo: idUsuario } }, { new: true });
		await Usuario.findByIdAndUpdate(idUsuario, { [option]: { seguidores: request.session.usuarioLogado._id } });

		if(!estaSeguindo)
			await Notificacao.inserirNotificacao(idUsuario, request.session.usuarioLogado._id, "seguir", request.session.usuarioLogado._id);

		return response.status(status.STATUS_SUCCESS).send(request.session.usuarioLogado);
	} catch (erro) {
		console.log(erro);
		return response.sendStatus(status.STATUS_BAD_REQUEST);
	}
});

router.get("/:idUsuario/seguidores", async (request, response, _) => {
	try {
		let resultado = await Usuario.findById(request.params.idUsuario, { email: 0, senha: 0, updatedAt: 0 })
			.populate("seguidores", "nome sobrenome nomeUsuario imagemPerfil seguindo seguidores");
		return response.status(status.STATUS_SUCCESS).send(await resultado);
	} catch (erro) {
		console.log(erro);
		return response.sendStatus(status.STATUS_BAD_REQUEST);
	}
});

router.get("/:idUsuario/seguindo", async (request, response, _) => {
	try {
		let resultado = await Usuario.findById(request.params.idUsuario, { email: 0, senha: 0, updatedAt: 0 })
			.populate("seguindo", "nome sobrenome nomeUsuario imagemPerfil seguindo seguidores");
		return response.status(status.STATUS_SUCCESS).send(await resultado);
	} catch (erro) {
		console.log(erro);
		return response.sendStatus(status.STATUS_BAD_REQUEST);
	}
});

router.post("/imagemPerfil", upload.single("imagemFormatada"), async (request, response, _) => {
	if(!request.file) {
		console.log("Nenhum arquivo enviado.");
		return response.sendStatus(status.STATUS_NOT_FOUND);
	}

	let caminhoArquivo = `/uploads/imagens/perfil/${request.file.filename}.png`;
	let caminhoArquivoTemp = request.file.path;
	let caminhoAlvo = path.join(__dirname, `../../${caminhoArquivo}`);

	fs.rename(caminhoArquivoTemp, caminhoAlvo, async (erro) => {
		if(erro != null) {
			console.log(erro);
			return response.sendStatus(status.STATUS_NOT_FOUND);
		}

		request.session.usuarioLogado = await Usuario.findByIdAndUpdate(request.session.usuarioLogado._id, { imagemPerfil: caminhoArquivo }, { new: true });
		return response.status(status.STATUS_NO_CONTENT).send(request.session.usuarioLogado);
	});
});

router.post("/imagemCapa", upload.single("imagemFormatada"), async (request, response, _) => {
	if(!request.file) {
		console.log("Nenhum arquivo enviado.");
		return response.sendStatus(status.STATUS_NOT_FOUND);
	}

	let caminhoArquivo = `/uploads/imagens/capa/${request.file.filename}.png`;
	let caminhoArquivoTemp = request.file.path;
	let caminhoAlvo = path.join(__dirname, `../../${caminhoArquivo}`);

	fs.rename(caminhoArquivoTemp, caminhoAlvo, async (erro) => {
		if(erro != null) {
			console.log(erro);
			return response.sendStatus(status.STATUS_NOT_FOUND);
		}

		request.session.usuarioLogado = await Usuario.findByIdAndUpdate(request.session.usuarioLogado._id, { imagemCapa: caminhoArquivo }, { new: true });
		return response.status(status.STATUS_NO_CONTENT).send(request.session.usuarioLogado);
	});
});

module.exports = router;
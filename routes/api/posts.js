// Imports
const status = require("../../util/status");
const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const Usuario = require("../../schemas/UsuarioSchema");
const Post = require("../../schemas/PostSchema");
const Notificacao = require("../../schemas/NotificacaoSchema");

app.use(bodyParser.urlencoded({ extended: false }));

router.get("/", async (request, response, _) => {
	let objetoBusca = request.query;

	let posts;
	if(objetoBusca) {
		if(objetoBusca.mostrarRespostas !== undefined) {
			let resposta = objetoBusca.mostrarRespostas == true || objetoBusca.mostrarRespostas == "true";
			objetoBusca.respondendo = { $exists: resposta };
			delete objetoBusca.mostrarRespostas;
		}

		if(objetoBusca.pesquisar !== undefined) {
			objetoBusca.conteudo = { $regex: objetoBusca.pesquisar, $options: "i" };
			delete objetoBusca.pesquisar;
		}

		if(objetoBusca.apenasSeguindo !== undefined) {
			let usuarioLogado = request.session.usuarioLogado;
			let seguindo = objetoBusca.apenasSeguindo == true || objetoBusca.apenasSeguindo == "true";
			if(seguindo) {
				let idsUsuariosMostrarPosts = [...usuarioLogado.seguindo, usuarioLogado._id];
				objetoBusca.postadoPor = { "$in": idsUsuariosMostrarPosts };
			}
			delete objetoBusca.apenasSeguindo;
		}
		posts = await getPosts(objetoBusca);
	} else
		posts = await getPosts({});

	if(posts == -1)
		return response.sendStatus(status.STATUS_BAD_REQUEST);

	return response.status(status.STATUS_SUCCESS).send(posts);
});

router.get("/:id", async (request, response, _) => {
	let idPost = request.params.id;

	let post = await getPosts({ _id: idPost });
	if(post == -1)
		return response.sendStatus(status.STATUS_BAD_REQUEST);
	post = post[0];

	let resultados = {
		post: post
	}

	if(post.respondendo !== undefined)
		resultados.respondendo = post.respondendo;
	resultados.respostas = await getPosts({ respondendo: idPost });

	return response.status(status.STATUS_SUCCESS).send(resultados);
});

router.post("/", async (request, response, _) => {
	if(!request.body.conteudo) {
		console.log("Nenhum conteúdo enviado.");
		return response.sendStatus(status.STATUS_BAD_REQUEST);
	}

	let dadosPost = {
		conteudo: request.body.conteudo,
		postadoPor: request.session.usuarioLogado
	}

	let respondendo = request.body.respondendo;
	if(respondendo)
		dadosPost.respondendo = respondendo;

	try {
		let novoPost = await Post.create(dadosPost);
		novoPost = await Usuario.populate(novoPost, {
			path: "postadoPor",
			select: "nome sobrenome nomeUsuario imagemPerfil"
		});
		novoPost = await Post.populate(novoPost, { path: "respondendo" });

		if(novoPost.respondendo !== undefined)
			await Notificacao.inserirNotificacao(novoPost.respondendo.postadoPor, request.session.usuarioLogado._id, "responder", novoPost._id);

		return response.status(status.STATUS_CREATED).send(novoPost);
	} catch (erro) {
		console.log(erro);
		return response.sendStatus(status.STATUS_BAD_REQUEST);
	}
});

router.put("/:id/curtir", async (request, response, _) => {
	let idPost = request.params.id;
	let idUsuario = request.session.usuarioLogado._id;

	let estaCurtido = request.session.usuarioLogado.curtidas && request.session.usuarioLogado.curtidas.includes(idPost);
	let option = estaCurtido ? "$pull" : "$addToSet";

	try {
		const usuarioAtualizado = await Usuario.findByIdAndUpdate(idUsuario, { [option]: { curtidas: idPost } }, { new: true });
		const postAtualizado = await Post.findByIdAndUpdate(idPost, { [option]: { curtidas: idUsuario } }, { new: true });

		request.session.usuarioLogado = usuarioAtualizado;

		if(!estaCurtido)
			await Notificacao.inserirNotificacao(postAtualizado.postadoPor, idUsuario, "curtir", postAtualizado._id);

		return response.status(status.STATUS_SUCCESS).send(postAtualizado);
	} catch (erro) {
		console.log(erro);
		return response.sendStatus(status.STATUS_BAD_REQUEST);
	}
});

router.post("/:id/compartilhar", async (request, response, _) => {
	let idPost = request.params.id;
	let idUsuario = request.session.usuarioLogado._id;

	try {
		let postDeletado = await Post.findOneAndDelete({
			postadoPor: idUsuario,
			conteudoCompartilhado: idPost
		});

		let option = postDeletado ? "$pull" : "$addToSet";

		let repost = postDeletado;
		if(repost == null)
			repost = await Post.create({ postadoPor: idUsuario, conteudoCompartilhado: idPost });

		const usuarioAtualizado = await Usuario.findByIdAndUpdate(idUsuario, { [option]: { compartilhamentos: repost._id } }, { new: true });
		const postAtualizado = await Post.findByIdAndUpdate(idPost, { [option]: { usuariosCompartilharam: idUsuario } }, { new: true });

		request.session.usuarioLogado = usuarioAtualizado;

		if(!postDeletado)
			await Notificacao.inserirNotificacao(postAtualizado.postadoPor, idUsuario, "compartilhar", postAtualizado._id);

		return response.status(status.STATUS_SUCCESS).send(postAtualizado);
	} catch(erro) {
		console.log(erro);
		return response.sendStatus(status.STATUS_BAD_REQUEST);
	}
});

router.delete("/:id", async (request, response, _) => {
	Post.findByIdAndDelete(request.params.id)
	.then((result) => {
		console.log(`Deletado (${new Date()}): `, result);
		response.sendStatus(status.STATUS_NO_CONTENT);
	}).catch((erro) => {
		console.log(erro);
		response.sendStatus(status.STATUS_BAD_REQUEST);
	});
});

router.put("/:id", async (request, response, _) => {
	try {
		if (request.body.fixado !== undefined) {
			// Caso esteja tentando fixar o mesmo post, o post será desafixado.
			let postFixado = await Post.findOneAndUpdate({ postadoPor: request.session.usuarioLogado._id, fixado: true }, { fixado: false });
			if(postFixado != null && postFixado.id == request.params.id)
				return response.sendStatus(status.STATUS_NO_CONTENT);
		}

		Post.findByIdAndUpdate(request.params.id, request.body)
		.then(() => {
			return response.sendStatus(status.STATUS_NO_CONTENT);
		});
	} catch (erro) {
		console.log(erro);
		response.sendStatus(status.STATUS_BAD_REQUEST);
	}
});

async function getPosts(filtro) {
	try {
		let resultados = await Post.find(filtro)
			.populate("postadoPor", "nome sobrenome nomeUsuario imagemPerfil")
			.populate("conteudoCompartilhado")
			.populate("respondendo")
			.sort({ "createdAt": -1 });

		resultados = await Usuario.populate(resultados, {
			path: "respondendo.postadoPor",
			select: "nome sobrenome nomeUsuario imagemPerfil"
		});

		return await Usuario.populate(resultados, {
			path: "conteudoCompartilhado.postadoPor",
			select: "nome sobrenome nomeUsuario imagemPerfil"
		});
	} catch (erro) {
		console.log(erro);
		return -1;
	}
}

module.exports = router;
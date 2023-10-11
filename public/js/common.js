const STATUS_NOT_FOUND = 404;
let cropper;
let timer;
let usuariosSelecionados = [];

$(document).ready(() => {
	atualizarInsigniaMensagens();
	atualizarInsigniaNotificacoes();
});

$("#textareaPost, #textareaResposta").keyup((event) => {
	let textbox = $(event.target);
	let textoInserido = textbox.val().trim();

	let isModal = textbox.parents(".modal").length == 1;

	let botaoEnviarPost = isModal ? $('#botaoEnviarResposta') : $('#botaoEnviarPost');
	if(botaoEnviarPost.length == 0)
		return console.log("Botão 'enviar' não encontrado.");

	if(textoInserido == '')
		botaoEnviarPost.prop("disabled", true);
	else
		botaoEnviarPost.prop("disabled", false);
});

$("#botaoEnviarPost, #botaoEnviarResposta").click((event) => {
	let botaoEnviarPost = $(event.target);

	let isModal = botaoEnviarPost.parents(".modal").length == 1;

	let textbox = isModal ? $("#textareaResposta") : $("#textareaPost");
	let textoInserido = textbox.val();

	let dados = { conteudo: textoInserido };

	if(isModal) {
		let idPostRespondido = botaoEnviarPost.data().id;
		if(idPostRespondido == null)
			return alert("O ID do post respondido está vazio.");
		dados.respondendo = idPostRespondido;
	}

	$.post("/api/posts", dados, (dadosPost) => {
		if(dadosPost.respondendo) {
			emitirNotificacao(dadosPost.respondendo.postadoPor);
			return location.reload();
		}

		let html = criarPostHtml(dadosPost);

		$(".containerPosts").prepend(html);
		textbox.val("");
		botaoEnviarPost.prop("disabled", true);
	});
});

const modalResposta = $("#modalResposta");
modalResposta.on("show.bs.modal", (event) => {
	let botao = $(event.relatedTarget);
	let idPost = getIdPostDoElemento(botao);
	$("#botaoEnviarResposta").data("id", idPost);

	$.get(`/api/posts/${idPost}`, (resultado) => {
		outputPosts(resultado.post, $("#containerPostOriginal"));
	});
});

modalResposta.on("hidden.bs.modal", () => {
	$("#textareaResposta").val("");
	$("#containerPostOriginal").html("");
});

$("#modalDeletarPost").on("show.bs.modal", (event) => {
	let botao = $(event.relatedTarget);
	let idPost = getIdPostDoElemento(botao);
	$("#botaoDeletarPost").data("id", idPost);
});

$("#botaoDeletarPost").click((event) => {
	let idPost = $(event.target).data("id");

	$.ajax({
		url: `/api/posts/${idPost}`,
		type: "DELETE",
		success: () => {
			location.reload();
		}
	});
});

$("#botaoCriarConversa").click(() => {
	let dados = JSON.stringify(usuariosSelecionados);

	$.post("/api/conversas", { usuarios: dados }, (conversa) => {
		if(!conversa || !conversa._id)
			return console.log("Erro ao tentar criar conversa.");
		window.location.href = `/mensagens/${conversa._id}`;
	})
});

function configurarModaisFixarDesafixar(idModal, idBotao) {
	$(idModal).on("show.bs.modal", (event) => {
		let botao = $(event.relatedTarget);
		let idPost = getIdPostDoElemento(botao);
		$(`${idBotao}`).data("id", idPost);
	});

	$(idBotao).click(async (event) => {
		let idPost = $(event.target).data("id");

		try {
			await $.ajax({
				url: `/api/posts/${idPost}`,
				type: "PUT",
				data: { fixado: true }
			});
			location.reload();
		} catch (erro) {
			console.log("Erro ao tentar realizar ação: ", erro);
		}
	});
}

configurarModaisFixarDesafixar("#modalFixarPost", "#botaoConfirmarFixarPost");
configurarModaisFixarDesafixar("#modalDesafixarPost", "#botaoConfirmarDesafixarPost");

function criarArquivoImagemChange(nomeClasse, nomeElementoImagem, proporcao, nomeClasseBotao, caminhoImagem) {
	$(nomeClasse).change(function() {
		if(this.files && this.files[0]) {
			let leitor = new FileReader();
			leitor.onload = (event) => {
				let elementoImagem = document.getElementById(nomeElementoImagem);
				elementoImagem.src = event.target.result;

				if(cropper !== undefined)
					cropper.destroy();

				cropper = new Cropper(elementoImagem, {
					aspectRatio: (proporcao == '1 / 1' ? 1 / 1 : 16 / 9),
					background: false
				});
			};

			leitor.readAsDataURL(this.files[0]);
		}
	});

	$(nomeClasseBotao).click(() => {
		let canvas = cropper.getCroppedCanvas();
		if(canvas == null)
			return alert("Nenhuma imagem encontrada.");

		canvas.toBlob((blob) => {
			let formData = new FormData();
			formData.append("imagemFormatada", blob);

			try {
				$.ajax({
					url: `/api/usuarios/${caminhoImagem}`,
					type: "POST",
					data: formData,
					processData: false,
					contentType: false
				});

				location.reload();
			} catch (erro) {
				console.log("Erro ao enviar imagem: " + erro);
			}
		});
	});
}

criarArquivoImagemChange("#arquivoImagem", "previewImagem", "1 / 1", "#botaoUploadImagem", "imagemPerfil");
criarArquivoImagemChange("#arquivoImagemCapa", "previewImagemCapa", "16 / 9", "#botaoUploadImagemCapa", "imagemCapa");

$(document).on("click", ".botaoCurtir", (event) => {
	let botao = $(event.target);
	let idPost = getIdPostDoElemento(botao);

	if(idPost === undefined) return;

	$.ajax({
		url: `/api/posts/${idPost}/curtir`,
		type: "PUT",
		success: (dadosPost) => {
			botao.find("span").text(dadosPost.curtidas.length || '');

			if(dadosPost.curtidas.includes(usuarioLogado._id)) {
				botao.addClass("botaoAtivo");
				emitirNotificacao(dadosPost.postadoPor);
			} else
				botao.removeClass("botaoAtivo");
		}
	});
});

$(document).on("click", ".botaoCompartilhar", (event) => {
	let botao = $(event.target);
	let idPost = getIdPostDoElemento(botao);

	if(idPost === undefined) return;

	$.ajax({
		url: `/api/posts/${idPost}/compartilhar`,
		type: "POST",
		success: (dadosPost) => {
			botao.find("span").text(dadosPost.usuariosCompartilharam.length || '');

			if(dadosPost.usuariosCompartilharam.includes(usuarioLogado._id)) {
				botao.addClass("botaoAtivo");
				emitirNotificacao(dadosPost.postadoPor);
			} else
				botao.removeClass("botaoAtivo");
		}
	});
});

$(document).on("click", ".post", (event) => {
	let element = $(event.target);
	let idPost = getIdPostDoElemento(element);

	if(idPost !== undefined && !element.is("button"))
		window.location.href = `/post/${idPost}`;
});

$(document).on("click", ".botaoSeguir", (event) => {
	let botao = $(event.target);
	let idUsuario = botao.data().user;

	$.ajax({
		url: `/api/usuarios/${idUsuario}/seguir`,
		type: "PUT",
		success: (dados, status, xhr) => {
			if(xhr.status == STATUS_NOT_FOUND)
				return alert("Usuário não encontrado.");

			let diferenca = 0;
			if(dados.seguindo && dados.seguindo.includes(idUsuario)) {
				botao.addClass("seguindo");
				botao.text("Seguindo");
				let usuarioAux = { _id: idUsuario };
				emitirNotificacao(usuarioAux);
				diferenca++;
			} else {
				botao.removeClass("seguindo");
				botao.text("Seguir");
				diferenca--;
			}

			let labelSeguidores = $("#valorSeguidores");
			if(labelSeguidores.length != 0) {
				let quantidadeAtualSeguidores = labelSeguidores.text();
				labelSeguidores.text(parseInt(quantidadeAtualSeguidores) + diferenca);
			}
		}
	});
});

$(document).on("click", ".notificacao.ativa", (event) => {
	let container = $(event.target);
	let idNotificacao = container.data().id;

	let href = container.attr("href");
	event.preventDefault();

	let callback = () => window.location = href;
	marcarNotificacaoComoLida(idNotificacao, callback);
});

let elementCaixaBuscaUsuario = $("#caixaBuscaUsuario");
elementCaixaBuscaUsuario.keydown((event) => {
	clearTimeout(timer);
	let caixaTexto = $(event.target);
	let valorPesquisa = caixaTexto.val();

	if(valorPesquisa == '' && (event.which == 8 || event.keyCode == 8)) {
		if(usuariosSelecionados.length > 0) {
			usuariosSelecionados.pop();
			atualizarUsuariosSelecionadosHtml();
			$(".containerResultados").html("");
			$("#botaoCriarConversa").prop("disabled", usuariosSelecionados.length <= 0);
		}
		return;
	}

	timer = setTimeout(() => {
		valorPesquisa = caixaTexto.val().trim();
		if(valorPesquisa == '')
			$(".containerResultados").html("");
		else
			buscarUsuarios(valorPesquisa);
	}, 1000);
});

function getIdPostDoElemento(element) {
	let isElementoRaiz = element.hasClass("post");
	let elementoRaiz = isElementoRaiz ? element : element.closest(".post");
	let idPost = elementoRaiz.data().id;

	if(idPost === undefined)
		return alert("IdPost undefined");
	return idPost;
}

function criarPostHtml(dadosPost, fonteDestaque = false) {
	if(dadosPost == null)
		return alert("O objeto do post é null.");

	let foiCompartilhado = dadosPost.conteudoCompartilhado !== undefined;
	let compartilhadoPor = foiCompartilhado ? dadosPost.postadoPor.nomeUsuario : null;

	let textoCompartilhadoPor = "";
	if(foiCompartilhado) {
		textoCompartilhadoPor = `
			<span>
				<i class="fas fa-retweet"></i>
				Compartilhado por <a href="/perfil/${compartilhadoPor}">@${compartilhadoPor}</a>
			</span>`
	}

	let textoRespondendo = "";
	if(dadosPost.respondendo && dadosPost.respondendo._id) {
		if(!dadosPost.respondendo._id)
			return alert("ID de post sendo respondido não encontrado.");
		else if(!dadosPost.respondendo.postadoPor._id)
			return alert("ID do usuário responsável pelo post sendo respondido não encontrado.");
		let nomeUsuarioPostRespondido = dadosPost.respondendo.postadoPor.nomeUsuario;
		textoRespondendo = `
			<div class="textoRespondendo">
				<i class="far fa-comment"></i>
				Respondendo a <a href="/post/${dadosPost.respondendo._id}">@${nomeUsuarioPostRespondido}</a>
			</div>`
	}

	dadosPost = foiCompartilhado ? dadosPost.conteudoCompartilhado : dadosPost;

	let postadoPor = dadosPost.postadoPor;
	if(postadoPor._id === undefined)
		return alert("Objeto Usuário não populado.");

	let nomeExibicao = `${postadoPor.nome} ${postadoPor.sobrenome}`;
	let dataPublicacao = diferencaTempo(new Date(), new Date(dadosPost.createdAt));

	let classeBotaoCurtidaAtivo = dadosPost.curtidas.includes(usuarioLogado._id) ? " botaoAtivo" : "";
	let classeBotaoCompartilharAtivo = dadosPost.usuariosCompartilharam.includes(usuarioLogado._id) ? " botaoAtivo" : "";
	let classeFonteDestaque = fonteDestaque ? " fonteDestaque" : "";

	let textoPostFixado = "";
	let botoes = "";
	if(dadosPost.postadoPor._id == usuarioLogado._id) {
		let classeBotaoFixarAtivo = "";
		let nomeModalFixar = "#modalFixarPost";
		if(dadosPost.fixado) {
			classeBotaoFixarAtivo = " botaoAtivo";
			textoPostFixado = `<i class="fa-solid fa-map-pin"></i> <span>Fixado</span>`;
			nomeModalFixar = "#modalDesafixarPost";
		}

		botoes = `
			<button class="botaoFixar${classeBotaoFixarAtivo}" data-id="${dadosPost._id}" data-toggle="modal" data-target="${nomeModalFixar}">
				<i class="fa-solid fa-map-pin"></i>
			</button>
			<button data-id="${dadosPost._id}" data-toggle="modal" data-target="#modalDeletarPost">
				<i class="fa-solid fa-xmark"></i>
			</button>`
	}

	return `
		<div class="post${classeFonteDestaque}" data-id="${dadosPost._id}">
			<div class="containerAcaoPost">
				${textoCompartilhadoPor}
			</div>
			<div class="containerConteudoPrincipal">
				<div class="containerImagemUsuario">
					<img src="${postadoPor.imagemPerfil}" alt="Imagem de perfil do usuário.">
				</div>
				<div class="containerConteudoPost">
					<div class="textoPostFixado">${textoPostFixado}</div>
					<div class="postHeader">
						<a href="/perfil/${postadoPor.nomeUsuario}" class="nomeExibicao">${nomeExibicao}</a>
						<span class="nomeUsuario">@${postadoPor.nomeUsuario}</span>
						<span class="dataPublicacao">${dataPublicacao}</span>
						${botoes}
					</div>
					${textoRespondendo}
					<div class="postBody">
						<span>${dadosPost.conteudo}</span>
					</div>

					<div class="postFooter">
						<div class="containerBotoesPost">
							<button class="botaoComentar" data-toggle="modal" data-target="#modalResposta">
								<i class="fa-solid fa-comment"></i>
							</button>
						</div>

						<div class="containerBotoesPost botaoVerde">
							<button class="botaoCompartilhar${classeBotaoCompartilharAtivo}">
								<i class="fa-solid fa-retweet"></i>
							</button>
						</div>

						<div class="containerBotoesPost botaoVermelho">
							<button class="botaoCurtir${classeBotaoCurtidaAtivo}">
								<i class='fa-solid fa-heart'></i>
								<span>${dadosPost.curtidas.length || ''}</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>`
}

function outputPosts(resultados, container) {
	container.html("");

	if(resultados && !Array.isArray(resultados)) {
		let html = criarPostHtml(resultados);
		container.append(html);
	} else if(resultados.length == 0)
		container.append("<span class='nenhumResultado'><h5>Nada para exibir aqui.</h5></span>");
	else {
		resultados.forEach(resultado => {
			let html = criarPostHtml(resultado);
			container.append(html);
		});
	}
}

function outputPostsComRespostas(resultados, container) {
	container.html("");

	if(resultados.respondendo !== undefined && resultados.respondendo._id !== undefined) {
		let html = criarPostHtml(resultados.respondendo);
		container.append(html);
	}

	let htmlPostPrincipal = criarPostHtml(resultados.post, true);
	container.append(htmlPostPrincipal);

	resultados.respostas.forEach(resultado => {
		let html = criarPostHtml(resultado);
		container.append(html);
	});
}

// Código adaptado de https://stackoverflow.com/questions/6108819/javascript-timestamp-to-relative-time.
function diferencaTempo(atual, anterior) {
	let msPorMinuto = 60 * 1000;
	let msPorHora = msPorMinuto * 60;
	let msPorDia = msPorHora * 24;
	let msPorMes = msPorDia * 30;
	let msPorAno = msPorDia * 365;

	let tempoDecorrido = atual - anterior;

	if (tempoDecorrido < msPorMinuto) {
		if ((tempoDecorrido / 1000) < 30)
			return 'Agora';
		return Math.round(tempoDecorrido / 1000) + ' segundos atrás';
	} else if (tempoDecorrido < msPorHora) {
		tempoDecorrido = Math.round(tempoDecorrido / msPorMinuto);
		return tempoDecorrido + (tempoDecorrido > 1 ? ' minutos atrás' : ' minuto atrás');
	} else if (tempoDecorrido < msPorDia) {
		tempoDecorrido = Math.round(tempoDecorrido / msPorHora);
		return tempoDecorrido + (tempoDecorrido > 1 ? ' horas atrás' : ' hora atrás');
	} else if (tempoDecorrido < msPorMes) {
		tempoDecorrido = Math.round(tempoDecorrido / msPorDia);
		return tempoDecorrido + (tempoDecorrido > 1 ? ' dias atrás' : ' dia atrás');
	} else if (tempoDecorrido < msPorAno) {
		tempoDecorrido = Math.round(tempoDecorrido / msPorMes);
		return tempoDecorrido + (tempoDecorrido > 1 ? ' meses atrás' : ' mês atrás');
	} else {
		tempoDecorrido = Math.round(tempoDecorrido / msPorAno);
		return tempoDecorrido + (tempoDecorrido > 1 ? ' anos atrás' : ' ano atrás');
	}
}

function outputUsuarios(resultados, container) {
	container.html("");

	if(resultados.length > 0) {
		resultados.forEach(resultado => {
			let html = criarUsuarioHtml(resultado, true);
			container.append(html);
		});
	} else
		container.append("<span class='nenhumResultado'><h5>Nenhum resultado encontrado.</h5></span>")
}

function criarUsuarioHtml(dadosUsuario, mostrarBotaoSeguir) {
	let nomeCompleto = dadosUsuario.nome + ' ' + dadosUsuario.sobrenome;

	let botaoSeguir = "";
	if(mostrarBotaoSeguir && usuarioLogado._id != dadosUsuario._id) {
		let estaSeguindo = usuarioLogado.seguindo && usuarioLogado.seguindo.includes(dadosUsuario._id);
		let classeBotaoSeguir = estaSeguindo ? "botaoSeguir seguindo" : "botaoSeguir";

		botaoSeguir = `
			<div class="containerBotaoSeguir">
				<button class="${classeBotaoSeguir}" data-user="${dadosUsuario._id}">${estaSeguindo ? "Seguindo" : "Seguir"}</button>
			</div>`
	}

	return `
		<div class="divUsuario">
			<div class="containerImagemUsuario">
				<img src="${dadosUsuario.imagemPerfil}" alt="Imagem de perfil">
			</div>
			<div class="containerDetalhesUsuario">
				<div class="usuarioHeader">
					<a href="/perfil/${dadosUsuario.nomeUsuario}">
						<span class="nomeExibicao">${nomeCompleto}</span>
						<span class="nomeUsuario"> @${dadosUsuario.nomeUsuario}</span>
					</a>
				</div>
			</div>
			${botaoSeguir}
		</div>`
}

function buscarUsuarios(valorBusca) {
	$.get("/api/usuarios", { pesquisar: valorBusca }, (resultados) => {
		outputUsuariosBuscaDisponiveis(resultados, $(".containerResultados"), $("#botaoCriarConversa"));
	});
}

function outputUsuariosBuscaDisponiveis(resultados, container, botao) {
	container.html("");

	if(resultados.length > 0) {
		resultados.forEach(resultado => {
			if(resultado._id == usuarioLogado._id || usuariosSelecionados.some(usuario => usuario._id == resultado._id))
				return;

			let html = criarUsuarioHtml(resultado, false);
			let elemento = $(html);
			elemento.click(() => selecionaUsuario(resultado, container, botao));

			container.append(elemento);
		});
	} else
		container.append("<span class='nenhumResultado'><h5>Nenhum resultado encontrado.</h5></span>");
}

function selecionaUsuario(usuario, container, botao) {
	usuariosSelecionados.push(usuario);
	atualizarUsuariosSelecionadosHtml();

	elementCaixaBuscaUsuario.val("").focus();
	container.html("");
	botao.prop("disabled", false);
}

function atualizarUsuariosSelecionadosHtml() {
	let elementos = [];

	usuariosSelecionados.forEach(usuarioSelecionado => {
		// let nome = `${usuarioSelecionado.nome} ${usuarioSelecionado.sobrenome}`;
		let elementoUsuario = $(`<span class="usuarioSelecionado">${usuarioSelecionado.nomeUsuario}</span>`);
		elementos.push(elementoUsuario);
	});

	$(".usuarioSelecionado").remove();
	$("#usuariosSelecionados").prepend(elementos);
}

function getTituloConversa(dadosConversa) {
	let tituloConversa = dadosConversa.tituloConversa;

	if(!tituloConversa) {
		let outrosUsuarios = getOutrosUsuariosNaConversa(dadosConversa.usuarios);
		let arrayNomesUsuarios = outrosUsuarios.map(usuario => usuario.nomeUsuario);
		tituloConversa = arrayNomesUsuarios.join(", ");
	}

	return tituloConversa;
}

function getOutrosUsuariosNaConversa(usuarios) {
	if(usuarios.length == 1)
		return usuarios;
	return usuarios.filter(usuario => usuario._id != usuarioLogado._id);
}

function mensagemRecebida(novaMensagem) {
	if($(`[data-room="${novaMensagem.conversa._id}"]`).length == 0)
		mostrarPopupMensagem(novaMensagem);
	else
		adicionarMensagemConversaHtml(novaMensagem);
	atualizarInsigniaMensagens();
}

function marcarNotificacaoComoLida(idNotificacao = null, callback = null) {
	if(callback == null)
		callback = () => location.reload();

	let url = idNotificacao != null ? `/api/notificacoes/${idNotificacao}/marcarComoLida` : `/api/notificacoes/marcarComoLida`;

	$.ajax({
		url: url,
		type: "PUT",
		success: () => callback()
	});
}

function atualizarInsignia(url, container) {
	$.get(url, { apenasNaoLidas: true }, (dados) => {
		let quantidadeResultados = dados.length;

		if(quantidadeResultados > 0)
			$(container).text(quantidadeResultados).addClass("ativa");
		else
			$(container).text("").removeClass("ativa");
	});
}

function atualizarInsigniaMensagens() {
	return atualizarInsignia("/api/conversas", "#insigniaMensagens");
}

function atualizarInsigniaNotificacoes() {
	return atualizarInsignia("/api/notificacoes", "#insigniaNotificacoes");
}

function outputListaDeNotificacoes(notificacoes, container) {
	if(notificacoes.length == 0)
		return container.append("<span class='nenhumResultado'>Nada para exibir aqui.</span>");

	notificacoes.forEach(notificacao => {
		let html = criarNotificacaoHtml(notificacao);
		container.append(html);
	});
}

function criarNotificacaoHtml(notificacao) {
	let usuarioEnviou = notificacao.usuarioEnviou;
	let textoNotificacao = getTextoNotificacao(notificacao);
	let url = getLinkNotificacao(notificacao);

	let nomeClasse = notificacao.aberta ? "" : " ativa";

	return `
		<a href="${url}" class="itemListaResultados notificacao${nomeClasse}" data-id="${notificacao._id}">
			<div class="containerImagensResultados">
				<img src="${usuarioEnviou.imagemPerfil}" alt="Imagem de perfil do usuário">
			</div>
			<div class="containerDetalhesResultados ellipsis">
				<span class="ellipsis">${textoNotificacao}</span>
			</div>
		</a>`;
}

function getTextoNotificacao(notificacao) {
	let usuarioEnviou = notificacao.usuarioEnviou;
	if(!usuarioEnviou.nomeUsuario)
		return alert("Usuário não preenchido corretamente.");

	let nomeUsuarioEnviou = usuarioEnviou.nomeUsuario;

	let textoNotificacao = `${nomeUsuarioEnviou}`;
	switch (notificacao.tipoNotificacao) {
		case "seguir":
			textoNotificacao += ` agora segue você`;
			break;
		case "responder":
			textoNotificacao += ` respondeu um de seus posts`;
			break;
		case "curtir":
			textoNotificacao += ` curtiu um de seus posts`;
			break;
		case "compartilhar":
			textoNotificacao += ` compartilhou um de seus posts`;
			break;
		default:
			return;
	}

	return `<span class="ellipsis">${textoNotificacao}</span>`;
}

function getLinkNotificacao(notificacao) {
	let url;
	switch (notificacao.tipoNotificacao) {
		case "seguir":
			url = `perfil/${notificacao.idEntidade}`;
			break;
		case "responder":
		case "curtir":
		case "compartilhar":
			url = `post/${notificacao.idEntidade}`;
			break;
		default:
			url = "#";
	}

	return url;
}

function mostrarPopupNotificacao(dados) {
	let html = criarNotificacaoHtml(dados);
	let elemento = $(html);
	elemento.hide().prependTo("#listaNotificacoes").slideDown("fast");

	setTimeout(() => {
		elemento.fadeOut(400);
	}, 5000);
}

function mostrarPopupMensagem(dados) {
	if(!dados.conversa.ultimaMensagem._id || dados.conversa.ultimaMensagem._id != dados._id)
		dados.conversa.ultimaMensagem = dados;

	let html = criarConversaHtml(dados.conversa);
	let elemento = $(html);
	elemento.hide().prependTo("#listaNotificacoes").slideDown("fast");

	setTimeout(() => {
		elemento.fadeOut(400);
	}, 5000);
}

function criarConversaHtml(dadosConversa) {
	let tituloConversa = getTituloConversa(dadosConversa);
	let imagem = getElementoImagemConversa(dadosConversa);
	let ultimaMensagem = getUltimaMensagem(dadosConversa.ultimaMensagem);

	let possuiUltimaMensagem = dadosConversa.ultimaMensagem !== undefined;
	let usuarioEnviou = possuiUltimaMensagem ? (dadosConversa.ultimaMensagem.remetente._id == usuarioLogado._id) : false;
	let classeAtivo = (!possuiUltimaMensagem || usuarioEnviou || dadosConversa.ultimaMensagem.lidoPor.includes(usuarioLogado._id)) ? "" : " ativa";

	return `
		<a href="/mensagens/${dadosConversa._id}" class="itemListaResultados${classeAtivo}">
			${imagem}
			<div class="containerDetalhesResultados ellipsis">
				<span class="headerConversa ellipsis">${tituloConversa}</span>
				<span class="subtextoConversa ellipsis">${ultimaMensagem}</span>
			</div>
		</a>`
}

function getUltimaMensagem(ultimaMensagem) {
	if(ultimaMensagem == null || ultimaMensagem._id == null)
		return "Nova conversa";

	let remetente = ultimaMensagem.remetente;
	return `${remetente.nomeUsuario}: ${ultimaMensagem.conteudo}`;
}

function getElementoImagemConversa(dadosConversa) {
	let outrosUsuariosNaConversa = getOutrosUsuariosNaConversa(dadosConversa.usuarios);

	let classeConversaEmGrupo = "";
	let imagemConversa = getElementoImagemConversaUsuario(outrosUsuariosNaConversa[0]);

	if(outrosUsuariosNaConversa.length > 1){
		classeConversaEmGrupo = " imagemConversaEmGrupo";
		imagemConversa += getElementoImagemConversaUsuario(outrosUsuariosNaConversa[1]);
	}

	return `<div class="containerImagensResultados${classeConversaEmGrupo}">${imagemConversa}</div>`
}

function getElementoImagemConversaUsuario(usuario) {
	if(!usuario || !usuario.imagemPerfil)
		return alert("Usuário informado na função é inválido.");

	return `<img src="${usuario.imagemPerfil}" alt="Imagem de perfil do usuário">`;
}
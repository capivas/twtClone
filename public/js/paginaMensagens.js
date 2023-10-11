let digitando = false;
let tempoUltimaVezDigitando = 0;

$(document).ready(() => {
	socket.emit("entrou na sala", idConversa);

	let containerDigitando = $(".containerDigitando");
	socket.on("digitando", () => containerDigitando.show());
	socket.on("parar de digitar", () => containerDigitando.hide());

	$.get(`/api/conversas/${idConversa}`, (dados) => {
		$("#nomeConversa").text(getTituloConversa(dados));
	});

	$.get(`/api/conversas/${idConversa}/mensagens`, (dados) => {
		let mensagens = [];
		let idUltimoRemetente = "";

		dados.forEach((mensagem, index) => {
			let html = criarMensagemHtml(mensagem, dados[index + 1], idUltimoRemetente);
			mensagens.push(html);
			idUltimoRemetente = mensagem.remetente._id;
		});

		let htmlMensagens = mensagens.join("");
		adicionarHtmlMensagensNaPagina(htmlMensagens);
		irParaFimPagina(false);
		marcarTodasMensagensComoLidas();

		$(".containerAguardandoCarregar").remove();
		$(".containerConversa").css("visibility", "visible");
	});
});

$("#botaoConfirmarAlterarNomeConversa").click(() => {
	let nomeConversa = $("#textboxNomeConversa").val().trim();

	$.ajax({
		url: `/api/conversas/${idConversa}`,
		type: "PUT",
		data: { tituloConversa: nomeConversa },
		success: (dados, status, xhr) => {
			if(xhr.status != 204)
				return alert("Não foi possível realizar alteração.")
			location.reload();
		}
	});
});

$(".botaoEnviarMensagem").click(() => {
	mensagemEnviada("mensagemEnviada");
});

let inputMensagem = $(".inputMensagem");

inputMensagem.keydown((event) => {
	atualizarDigitando();

	if(event.which === 13 && !event.shiftKey) {
		mensagemEnviada("mensagem enviada");
		return false;
	}
});

function atualizarDigitando() {
	if(!conectado)
		return;

	if(!digitando) {
		digitando = true;
		socket.emit("digitando", idConversa);
	}

	tempoUltimaVezDigitando = new Date().getTime();
	let tempoTimer = 3000;

	setTimeout(() => {
		let diferencaTempo = new Date().getTime() - tempoUltimaVezDigitando;
		if(diferencaTempo >= tempoTimer && digitando) {
			socket.emit("parar de digitar", idConversa);
			digitando = false;
		}
	}, tempoTimer);
}

function adicionarHtmlMensagensNaPagina(htmlMensagens) {
	$(".mensagensConversa").append(htmlMensagens);
}

function mensagemEnviada() {
	let conteudo = inputMensagem.val().trim();

	if(conteudo && conteudo !== '') {
		enviarMensagem(conteudo);
		inputMensagem.val("");

		socket.emit("parar de digitar", idConversa);
		digitando = false;
	}
}

function enviarMensagem(conteudo) {
	$.post("/api/mensagens", { conteudo: conteudo, idConversa: idConversa }, (dados, status, xhr) => {
		if(xhr.status != 201) {
			alert("Erro ao enviar mensagem.");
			inputMensagem.val(conteudo);
			return;
		}

		adicionarMensagemConversaHtml(dados);

		if(conectado)
			socket.emit("nova mensagem", dados);
	});
}

function adicionarMensagemConversaHtml(mensagem) {
	if(!mensagem || !mensagem._id)
		return alert("A mensagem informada é inválida.");

	let divMensagem = criarMensagemHtml(mensagem, null, "");

	adicionarHtmlMensagensNaPagina(divMensagem);
	irParaFimPagina(true);
}

function criarMensagemHtml(mensagem, proximaMensagem, idUltimoRemetente) {
	let remetente = mensagem.remetente;
	let nomeRemetente = remetente.nomeUsuario;
	let idRemetenteAtual = remetente._id;

	let idProximoRemetente = proximaMensagem ? proximaMensagem.remetente._id : "";

	// Remetentes diferentes, logo, é a primeira mensagem do usuário neste grupo de mensagens.
	let primeiraMensagem = (idUltimoRemetente != idRemetenteAtual);
	// Remetentes diferentes, logo, é a última mensagem do usuário neste grupo de mensagens.
	let ultimaMensagem = (idProximoRemetente != idRemetenteAtual);

	let mensagemUsuarioLogado = (mensagem.remetente._id == usuarioLogado._id);
	let nomeClasseLi = mensagemUsuarioLogado ? "remetente" : "recipiente";

	let elementoNome = "";
	if(primeiraMensagem) {
		nomeClasseLi += " primeira";

		if(!mensagemUsuarioLogado)
			elementoNome = `<span class="nomeRemetente">${nomeRemetente}</span>`;
	}

	let imagemPerfil = "";
	if(ultimaMensagem) {
		nomeClasseLi += " ultima";
		imagemPerfil = `<img src="${remetente.imagemPerfil}" alt="Imagem de perfil do usuário">`
	}

	let containerImagem = "";
	if(!mensagemUsuarioLogado) {
		containerImagem = `
			<div class="containerImagem">
				${imagemPerfil}
			</div>`
	}

	return `
		<li class="mensagem ${nomeClasseLi}">
			${containerImagem}
			<div class="containerMensagem">
				${elementoNome}
				<span class="corpoMensagem">
					${mensagem.conteudo}
				</span>
			</div>
		</li>`
}

function irParaFimPagina(animado) {
	let container = $(".mensagensConversa");
	let alturaScroll = container[0].scrollHeight;

	if(animado)
		container.animate({ scrollTop: alturaScroll }, "slow");
	else
		container.scrollTop(alturaScroll);
}

function marcarTodasMensagensComoLidas() {
	$.ajax({
		url: `/api/conversas/${idConversa}/mensagens/marcarComoLidas`,
		type: "PUT",
		success: () => atualizarInsigniaMensagens()
	});
}
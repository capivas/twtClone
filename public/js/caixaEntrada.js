$(document).ready(() => {
	$.get("/api/conversas", (dados, status, xhr) => {
		if(xhr.status == 400) {
			alert("Erro ao carregar mensagens.");
			return;
		}

		outputListaConversas(dados, $(".containerResultados"));
	});
});

function outputListaConversas(listaConversas, container) {
	if(listaConversas.length == 0) {
		return container.append("<span class='nenhumResultado'>Nada para exibir aqui</span>");
	}

	listaConversas.forEach(conversa => {
		let html = criarConversaHtml(conversa);
		container.append(html);
	});
}
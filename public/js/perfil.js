$(document).ready(() => {
	if(tabSelecionada != 'respostas')
		carregarPosts();
	else
		carregarRespostas();
});

function carregarPosts() {
	$.get("/api/posts", { postadoPor: idUsuarioPerfil, fixado: true }, (resultados) => {
		outputPostFixo(resultados, $(".containerPostFixo"));
	});

	$.get("/api/posts", { postadoPor: idUsuarioPerfil, mostrarRespostas: false, fixado: false }, (resultados) => {
		outputPosts(resultados, $(".containerPosts"));
	});
}

function carregarRespostas() {
	$.get("/api/posts", { postadoPor: idUsuarioPerfil, mostrarRespostas: true }, (resultados) => {
		outputPosts(resultados, $(".containerPosts"));
	});
}

function outputPostFixo(resultados, container) {
	if(resultados.length == 0)
		return container.hide();

	container.html("");

	resultados.forEach(resultado => {
		let html = criarPostHtml(resultado, true);
		container.append(html);
	});
}
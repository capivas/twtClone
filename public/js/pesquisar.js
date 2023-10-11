$("#caixaPesquisa").keydown((event) => {
	clearTimeout(timer);
	let caixaTexto = $(event.target);
	let valorPesquisa = caixaTexto.val();
	let tipoPesquisa = caixaTexto.data().search;

	timer = setTimeout(() => {
		valorPesquisa = caixaTexto.val().trim();
		if(valorPesquisa == '')
			$(".containerResultados").html("");
		else
			pesquisar(valorPesquisa, tipoPesquisa);
	}, 1000);
});

function pesquisar(valorPesquisa, tipoPesquisa) {
	let url = '/api/' + (tipoPesquisa == 'usuarios' ? 'usuarios' : 'posts');
	$.get(url, { pesquisar: valorPesquisa }, (resultados) => {
		if(tipoPesquisa == 'usuarios')
			outputUsuarios(resultados, $(".containerResultados"));
		else
			outputPosts(resultados, $(".containerResultados"));
	});
}
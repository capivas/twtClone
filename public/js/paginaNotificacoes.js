$(document).ready(() => {
	$.get("/api/notificacoes", (dados) => {
		outputListaDeNotificacoes(dados, $(".containerResultados"));
	});
});

$("#marcarNotificacoesComoLidas").click(() => {
	marcarNotificacaoComoLida();
});
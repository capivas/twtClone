let conectado = false;

let socket = io("http://localhost:3001");
socket.emit("setup", usuarioLogado);

socket.on("conectado", () => conectado = true);

socket.on("mensagem recebida", (dadosNovaMensagem) => {
	mensagemRecebida(dadosNovaMensagem);
});

socket.on("notificacao recebida", () => {
	$.get("/api/notificacoes/ultima", (dadosNotificacao) => {
		mostrarPopupNotificacao(dadosNotificacao);
		atualizarInsigniaNotificacoes();
	});
});

function emitirNotificacao(usuario) {
	if(usuario._id == usuarioLogado._id)
		return;

	socket.emit("notificacao recebida", usuario);
}
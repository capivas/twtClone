$(document).ready(() => {
	if(tabSelecionada != 'seguindo')
		carregarSeguidores();
	else
		carregarSeguindo();
});

function carregarSeguidores() {
	$.get(`/api/usuarios/${idUsuarioPerfil}/seguidores`, (resultados) => {
		outputUsuarios(resultados.seguidores, $(".containerResultados"));
	});
}

function carregarSeguindo() {
	$.get(`/api/usuarios/${idUsuarioPerfil}/seguindo`, (resultados) => {
		outputUsuarios(resultados.seguindo, $(".containerResultados"));
	});
}
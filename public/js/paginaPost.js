$(document).ready(() => {
	$.get("/api/posts/" + idPost, (resultados) => {
		outputPostsComRespostas(resultados, $(".containerPosts"));
	});
});
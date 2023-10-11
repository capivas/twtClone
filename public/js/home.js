$(document).ready(() => {
	$.get("/api/posts", { apenasSeguindo: true }, (resultados) => {
		outputPosts(resultados, $(".containerPosts"));
	});
});
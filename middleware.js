/**
 * Middleware que verifica se o usuário está autenticado e
 * redireciona para a página de login caso não esteja.
 * @param {Object} request - O objeto de requisição do Express.
 * @param {Object} response - O objeto de resposta do Express.
 * @param {Function} next - Função de callback para chamar o próximo middleware.
 * @returns {Object|void}
 */
exports.requireLogin = (request, response, next) => {
    if(request.session && request.session.usuarioLogado) {
        return next();
    }

    return response.redirect("/login");
};
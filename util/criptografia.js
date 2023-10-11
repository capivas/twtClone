const bcrypt = require("bcrypt");

/**
 * Função que criptografa a senha inserida pelo usuário para
 * ser salva de maneira mais segura no banco de dados.
 * @param {string} senha - A senha a ser criptografada.
 * @returns {Promise<string>} A senha criptografada.
 */
exports.cryptCriptografar = async function(senha) {
	return await bcrypt.hash(senha, 16);
};

/**
 * Função que compara a senha inserida pelo usuário e a senha
 * salva criptografada.
 * @param {string} senhaInserida - Senha inserida pelo usuário.
 * @param {string} senhaUsuario - Senha criptografada do usuário.
 * @returns {Promise<boolean>} Retorna true se as senhas são iguais, false caso contrário.
 */
exports.cryptComparar = async function(senhaInserida, senhaUsuario) {
	return await bcrypt.compare(senhaInserida, senhaUsuario);
};
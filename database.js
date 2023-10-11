const mongoose = require("mongoose");
const credenciais = require("./util/credenciais");

class Database {
	constructor(login, senha, link) {
		this.connect(login, senha, link);
	}

	async connect(login, senha, link) {
		await mongoose.connect(`mongodb+srv://${login}:${senha}${link}`)
			.then(() => {
				console.log("Conectado ao banco de dados.");
			}).catch((erro) => {
				console.log("Erro ao tentar se conectar no banco de dados:", erro);
			});
	}
}

module.exports = new Database(credenciais.loginDB, credenciais.senhaDB, credenciais.link);
// Imports
const status = require("../util/status");
const express = require("express");
const bodyParser = require("body-parser");
const Usuario = require("../schemas/UsuarioSchema");
const { cryptCriptografar } = require("../util/criptografia");

const app = express();
const router = express.Router();

app.set("view engine", "pug");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended: false }));

router.get("/", (request, response, _) => {
	let payload = {
		tituloPagina: "Registro"
	}

	response.status(status.STATUS_SUCCESS).render("registro", payload);
});

router.post("/", async (request, response, _) => {
	let payload = {
		tituloPagina: "Registro",
		dadosBody: request.body
	};

	// Dados preenchidos pelo usuário.
	let nome = request.body.nome.trim();
	let sobrenome = request.body.sobrenome.trim();
	let nomeUsuario = request.body.nomeUsuario.trim();
	let email = request.body.email.trim();
	let senha = request.body.senha;
	let senhaConfirmacao = request.body.senhaConfirmacao;

	// Validações para salvar os dados do usuário.
	if (senhaConfirmacao !== senha) {
		// Verifica se as senhas informadas são iguais.
		payload.mensagemErro = "As senhas informadas são diferentes.";
	} else if (!(nome && sobrenome && nomeUsuario && email && senha.trim())) {
		// Verifica se nenhum campo foi preenchido com espaços.
		payload.mensagemErro = "Todos os campos devem possuir um valor válido.";
	} else {
		// Verifica se já há algum usuário registrado com o nome de usuário e/ou e-mail informados.
		try {
			let usuario = await Usuario.findOne({
				$or: [
					{ nomeUsuario: nomeUsuario },
					{ email: email }
				]
			});

			if(usuario) {
				// Caso seja encontrado um usuário com o mesmo nome de usuário ou e-mail, será retornada uma mensagem de erro.
				if(usuario.nomeUsuario == nomeUsuario)
					payload.mensagemErro = "Já existe um usuário com este nome de usuário.";
				else if(usuario.email == email)
					payload.mensagemErro = "Já existe um usuário com este e-mail.";
			} else {
				// Caso todas as validações tenham ocorrido com sucesso, o usuário será criado.
				let dadosBody = payload.dadosBody;
				// Senha será criptografada para ser salva com segurança no banco de dados.
				dadosBody.senha = await cryptCriptografar(dadosBody.senha);

				// Após o usuário ser criado, será setado um "session.usuarioLogado" com o novo usuário.
				request.session.usuarioLogado = await Usuario.create(dadosBody);
				return response.redirect("/");
			}
		} catch (erro) {
			console.log(erro);
			payload.mensagemErro = "Algo deu errado, tente novamente mais tarde.";
		}
	}

	// Caso haja alguma mensagem de erro, o usuário será redirecionado para o formulário de registro com seus dados preenchidos da maneira que preencheu anteriormente.
	if(payload.mensagemErro)
		response.status(status.STATUS_SUCCESS).render("registro", payload);
});

module.exports = router;
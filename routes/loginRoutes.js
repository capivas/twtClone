// Imports
const status = require("../util/status");
const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const Usuario = require("../schemas/UsuarioSchema");
const { cryptComparar } = require("../util/criptografia");

app.set("view engine", "pug");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended: false }));

router.get("/", (request, response, _) => {
   let payload = {
      tituloPagina: "Login"
   }

   response.status(status.STATUS_SUCCESS).render("login", payload);
});

router.post("/", async (request, response, _) => {
   let payload = {
      tituloPagina: "Login",
      dadosBody: request.body
   };

   // Dados preenchidos pelo usuário.
   let loginUsuario = request.body.loginUsuario.trim();
   let loginSenha = request.body.loginSenha;

   // Validação para fazer o login.
   if(loginUsuario && loginSenha) {
      // Verifica se existe um usuário com o login/e-mail informado.
      let usuario = await Usuario.findOne({
         $or: [
            { nomeUsuario: loginUsuario },
            { email: loginUsuario }
         ],
      }).catch((erro) => {
         console.log(erro);
         payload.mensagemErro = "Algo deu errado, tente novamente mais tarde.";
      });

      if(!usuario) {
         // Mensagem de erro caso o usuário não exista.
         payload.mensagemErro = "Usuário não encontrado.";
      } else {
         // Comparação entre a senha inserida e a senha real do usuário.
         let senhaCorreta = await cryptComparar(loginSenha, usuario.senha);
         if(senhaCorreta === true) {
            // Caso a senha esteja correta, o usuário será logado.
            request.session.usuarioLogado = usuario;
            return response.redirect("/");
         }
         // Mensagem de erro caso a senha esteja incorreta.
         payload.mensagemErro = "Senha incorreta.";
      }
   } else {
      // Mensagem de erro caso algum campo tenha sido preenchido com espaços.
      payload.mensagemErro = "Todos os campos devem possuir um valor válido.";
   }

   // Caso haja alguma mensagem de erro, o usuário será redirecionado para o formulário de registro.
   if(payload.mensagemErro)
      response.status(status.STATUS_SUCCESS).render("login", payload);
});

module.exports = router;
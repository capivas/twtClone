// Imports
require("./database");

const status = require("./util/status");
const express = require("express");
const middleware = require("./middleware");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");

// Criando servidor
const app = express();
const port = 3001;

const server = app.listen(port, () => {
    console.log(`Ouvindo na porta ${port}`);
});
const io = require("socket.io")(server, { pingTimeout: 60000 });

// Definindo views
app.set("view engine", "pug");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
    secret: "defenestrar",
    resave: true,
    saveUninitialized: false
}));

// Routes
const loginRoute = require("./routes/loginRoutes");
app.use("/login", loginRoute);
const registroRoute = require("./routes/registroRoutes");
app.use("/registro", registroRoute);
const logoutRoute = require("./routes/logoutRoutes");
app.use("/logout", logoutRoute);
const postRoute = require("./routes/postRoutes");
app.use("/post", middleware.requireLogin, postRoute);
const perfilRoute = require("./routes/perfilRoutes");
app.use("/perfil", middleware.requireLogin, perfilRoute);
const uploadRoute = require("./routes/uploadRoutes");
app.use("/uploads", uploadRoute);
const pesquisarRoute = require("./routes/pesquisarRoutes");
app.use("/pesquisar", middleware.requireLogin, pesquisarRoute);
const mensagensRoute = require("./routes/mensagensRoutes");
app.use("/mensagens", middleware.requireLogin, mensagensRoute);
const notificacoesRoute = require("./routes/notificacoesRoutes");
app.use("/notificacoes", middleware.requireLogin, notificacoesRoute)

// API Routes
const postsApiRoute = require("./routes/api/posts");
app.use("/api/posts", postsApiRoute);
const usuarioApiRoute = require("./routes/api/usuarios");
app.use("/api/usuarios", usuarioApiRoute);
const conversasApiRoute = require("./routes/api/conversas");
app.use("/api/conversas", conversasApiRoute);
const mensagensApiRoute = require("./routes/api/mensagens");
app.use("/api/mensagens", mensagensApiRoute);
const notificacoesApiRoute = require("./routes/api/notificacoes");
app.use("/api/notificacoes", notificacoesApiRoute);

app.get("/", middleware.requireLogin, (request, response, _) => {
    const { senha, email, createdAt, updatedAt, ...usuarioLogadoJs} = request.session.usuarioLogado;
    const usuarioLogadoJson = JSON.stringify(usuarioLogadoJs);

    let payload = {
        tituloPagina: "Página Inicial",
        usuarioLogado: request.session.usuarioLogado,
        usuarioLogadoJs: usuarioLogadoJson
    };
    response.status(status.STATUS_SUCCESS).render("home", payload);
});

io.on("connection", (socket) => {
    socket.on("setup", (dadosUsuario) => {
        socket.join(dadosUsuario._id);
        socket.emit("conectado");
    });

    socket.on("entrou na sala", (idConversa) => socket.join(idConversa));
    socket.on("digitando", (idConversa) => socket.in(idConversa).emit("digitando"));
    socket.on("parar de digitar", (idConversa) => socket.in(idConversa).emit("parar de digitar"));
    socket.on("notificacao recebida", (idUsuario) => socket.in(idUsuario).emit("notificacao recebida"));

    socket.on("nova mensagem", (dadosNovaMensagem) => {
        let conversa = dadosNovaMensagem.conversa;

        if(!conversa.usuarios)
            return console.log("Usuários do chat não estão definidos.");

        conversa.usuarios.forEach(usuario => {
            if(usuario._id == dadosNovaMensagem.remetente._id)
                return;

            socket.in(usuario._id).emit("mensagem recebida", dadosNovaMensagem);
        });
    });
});
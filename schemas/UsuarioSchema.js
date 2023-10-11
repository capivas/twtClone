const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UsuarioSchema = new Schema({
	nome: {
		type: String,
		required: true,
		trim: true
	},
	sobrenome: {
		type: String,
		required: true,
		trim: true
	},
	nomeUsuario: {
		type: String,
		required: true,
		trim: true,
		unique: true
	},
	email: {
		type: String,
		required: true,
		trim: true,
		unique: true
	},
	senha: {
		type: String,
		required: true
	},
	imagemPerfil: {
		type: String,
		default: "/images/imagemPerfil.png"
	},
	imagemCapa: {
		type: String
	},
	curtidas: [{
		type: Schema.Types.ObjectId,
		ref: 'Post'
	}],
	compartilhamentos: [{
		type: Schema.Types.ObjectId,
		ref: 'Post'
	}],
	seguindo: [{
		type: Schema.Types.ObjectId,
		ref: 'Usuario'
	}],
	seguidores: [{
		type: Schema.Types.ObjectId,
		ref: 'Usuario'
	}]
}, { timestamps: true });

module.exports = mongoose.model("Usuario", UsuarioSchema);
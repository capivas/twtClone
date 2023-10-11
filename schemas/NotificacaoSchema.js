const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const NotificacaoSchema = new Schema({
	usuarioNotificado: {
		type: Schema.Types.ObjectId,
		ref: 'Usuario'
	}, usuarioEnviou: {
		type: Schema.Types.ObjectId,
		ref: 'Usuario'
	}, tipoNotificacao: String,
	aberta: {
		type: Boolean,
		default: false
	}, idEntidade: Schema.Types.ObjectId
}, { timestamps: true });

NotificacaoSchema.statics.inserirNotificacao =  async (usuarioNotificado, usuarioEnviou, tipoNotificacao, idEntidade) => {
	let dados = {
		usuarioNotificado: usuarioNotificado,
		usuarioEnviou: usuarioEnviou,
		tipoNotificacao: tipoNotificacao,
		idEntidade: idEntidade
	};

	try {
		await Notificacao.deleteOne(dados);
		return Notificacao.create(dados);
	} catch (erro) {
		console.log("Erro ao tentar inserir Notificação: ", erro);
	}
}

let Notificacao = mongoose.model("Notificacao", NotificacaoSchema);
module.exports = Notificacao;
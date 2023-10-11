const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const MensagemSchema = new Schema({
	remetente: {
		type: Schema.Types.ObjectId,
		ref: 'Usuario'
	}, conteudo: {
		type: String,
		trim: true
	}, conversa: {
		type: Schema.Types.ObjectId,
		ref: 'Conversa'
	}, lidoPor: [{
		type: Schema.Types.ObjectId,
		ref: 'Usuario'
	}]
}, { timestamps: true });

module.exports = mongoose.model("Mensagem", MensagemSchema);
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ConversaSchema = new Schema({
	tituloConversa: {
		type: String,
		trim: true
	}, conversaEmGrupo: {
		type: Boolean,
		default: false
	}, usuarios: [{
		type: Schema.Types.ObjectId,
		ref: "Usuario"
	}], ultimaMensagem: {
		type: Schema.Types.ObjectId,
		ref: "Mensagem"
	}
}, { timestamps: true });

module.exports = mongoose.model("Conversa", ConversaSchema);
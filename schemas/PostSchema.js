const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PostSchema = new Schema({
	conteudo: {
		type: String,
		trim: true
	},
	postadoPor: {
		type: Schema.Types.ObjectId,
		ref: 'Usuario',
		required: true
	},
	fixado: {
		type: Boolean,
		required: true,
		default: false
	},
	curtidas: [{
		type: Schema.Types.ObjectId,
		ref: 'Usuario'
	}],
	usuariosCompartilharam: [{
		type: Schema.Types.ObjectId,
		ref: 'Usuario'
	}],
	conteudoCompartilhado: {
		type: Schema.Types.ObjectId,
		ref: 'Post'
	},
	respondendo: {
		type: Schema.Types.ObjectId,
		ref: 'Post'
	}
}, {
	timestamps: true,
	toObject: { virtuals: true },
	toJSON: { virtuals: true }
});

module.exports = mongoose.model("Post", PostSchema);
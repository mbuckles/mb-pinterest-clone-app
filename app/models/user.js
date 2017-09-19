var mongoose = require('mongoose');
const bcrypt = require('bcrypt');
var Schema = mongoose.Schema;
var randtoken = require('rand-token');

var UserSchema = new Schema({
    local:  {
      username: String,
      password: String,
      city: String,
      state: String
    },
    facebook: {
      id: String,
      token: String,
      name: String,
      email: String
    },
    google: {
      id: String,
      token: String,
      name: String,
      email: String
    },
    twitter: {
      id: String,
      token: String,
      username: String,
      displayName: String
    },
    token: {
		type: Schema.Types.ObjectId,
		ref: 'Token',
		default: null
	}
});

var tokenSchema = mongoose.Schema({
	value: String,
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	},
	expireAt: {
		type: Date,
		expires: 60,
		default: Date.now
	}
});

UserSchema.methods.generateToken = function(){
	var token = new Token();
	token.value = randtoken.generate(32);
	token.user = this._id;
	this.token = token._id;
	this.save(function(err){
		if(err)
			throw err;
		token.save(function(err){
			if(err)
				throw err;
		});
	});
}

//Password encrcryption
UserSchema.methods.generateHash = function(password){
  return bcrypt.hashSync(password, bcrypt.genSaltSync(9));
}

UserSchema.methods.validPassword = function(password){
  return bcrypt.compareSync(password, this.local.password);
}

var User = mongoose.model('User', UserSchema);
var Token = mongoose.model('Token', tokenSchema);
var Models = { User: User, Token: Token };

module.exports = User;

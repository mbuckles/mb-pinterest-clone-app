var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LinkPinSchema = new Schema({
     userGoogle:  {
       id: String,
       token: String,
       name: String,
       email: String
     },
     userFacebook:  {
       id: String,
       token: String,
       name: String,
       email: String
     },
     userTwitter: {
       id: String,
       token: String,
       username: String,
       displayName: String
     },
     twitter: {
       id: String,
       token: String,
       username: String,
       displayName: String
     },
    user: {
      type: Schema.ObjectId,
      ref: 'user'
    },
    name: String,
    url:String,
    snippet: String,
    thumbnail: String,
    context: String
});
var LinkPin = mongoose.model('LinkPin', LinkPinSchema);
module.exports = LinkPin;

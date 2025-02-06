import mongoose, { model, Model, Schema } from "mongoose";

const users = new Schema({
    username : {type: String, unique: true},
    password : {type: String, required: true}
})

export const User = mongoose.model('Users', users);
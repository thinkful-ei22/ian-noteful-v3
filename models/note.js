'use strict';

const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: String,
},
{
    timestamps: true
});

noteSchema.set('toObject', {
    virtuals: true,     // include built-in virtual `id`
    versionKey: false,  // remove `__v` version key
    transform: (doc, ret) => {
      delete ret._id; // delete `_id`
    }
  });

noteSchema.set('timestamps', true);

noteSchema.methods.serialize = function() {
    return {
      id: this._id,
      title: this.title,
      content: this.content
    };
  };

module.exports = mongoose.model('Note', noteSchema);
'use strict';

const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: String,
},
{
    timestamps: true
});

// Add `createdAt` and `updatedAt` fields
noteSchema.set('timestamps', true);

module.exports = mongoose.model('Note', noteSchema);
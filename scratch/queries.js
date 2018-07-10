'use strict';

const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');

const Note = require('../models/note');


//GET ALL with search term
mongoose.connect(MONGODB_URI)
  .then(() => {
    const searchTerm = 'government';
    let filter = {};

    if (searchTerm) {
      filter.title = { $regex: searchTerm };
    }

    return Note.find(filter).sort({ updatedAt: 'desc' });
  })    
  .then(results => {
    console.log(results);
  })
  .then(() => {
    return mongoose.disconnect()
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });


//GET by ID
  mongoose.connect(MONGODB_URI)
    NOTE
    .findById(req.params.id)
    .then(note =>res.json(note.serialize()))
    .catch(err => {
        console.error(err);
        res.status(500).json({message: 'Internal server error'})
  });


  const requiredFields = ['name', 'borough', 'cuisine'];
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`
      console.error(message);
      return res.status(400).send(message);
    }
  }

//POST create a new note
  mongoose.connect(MONGODB_URI)
  NOTE
    .create({
      title: req.body.title,
      content: req.body.content})
    .then(
      note => res.status(201).json(note.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error'});
    });

//PUT find and update a note
if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = (
      `Request path id (${req.params.id}) and request body id ` +
      `(${req.body.id}) must match`);
    console.error(message);
    // we return here to break out of this function
    return res.status(400).json({message: message});
  }

  const toUpdate = {};
  const updateableFields = ['title', 'content'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  NOTE
    .findByIdAndUpdate(req.params.id, {$set: toUpdate})
    .then(note => res.json(note).status(204).end())
    .catch(err => res.json(err).status(500).json({message: 'Internal server error'}));

//DELETE
NOTE
    .findByIdAndRemove(req.params.id)
    .then(() => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Internal server error'}));

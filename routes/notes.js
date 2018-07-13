'use strict';

const express = require('express');
const mongoose = require('mongoose');

const Note = require('../models/note');
const router = express.Router();

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  const { searchTerm } = req.query;
  const { folderId } = req.query;
  let filter = {};

  if (searchTerm) {
    filter.title = { $regex: searchTerm };
  }
  if (folderId){
    filter.folderId = folderId;
  }
  Note
    .find(filter)
    .sort({ updatedAt: 'desc' })
    .then(notes => {
      res.json({
        notes: notes.map((note) => note.serialize())
      })
    })
    .catch(err => next(err));
});



/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  Note
    .findById(req.params.id)
    .then(result => {
      if(result){
        res.json(result.serialize()).status(200);
      }
      else{
        next();
      }
    })
    .catch(err => next(err));
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const requiredFields = ["title", "content"];
  for (let i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }
  if (req.body.title === '' || req.body.content === ''){
    const message = `Missing title in request body`;
    console.error(message);
    return res.status(400).send(message);
  }
  
  //pretty sure this means that you have to include a valid
  //folderID in order to have successful post....
  //want it to be okay to not include folderId
  if(req.body.folderId && !(mongoose.Types.ObjectId.isValid(req.body.folderId))){
    const message = `Not a valid folder...`;
    console.error(message);
    return res.status(404).send(message);
  }

  Note
    .create({
      title: req.body.title,
      content: req.body.content,
      folderId: req.body.folderId
  })
    .then(note => res.location(`${req.originalUrl}/${note.id}`).status(201).json(note.serialize()))
    .catch(err => next(err));
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  if (!(req.params.id === req.body.id)) {
    const message =
      `Request path id (${req.params.id}) and request body id ` +
      `(${req.body.id}) must match`;
    console.error(message);
    return res.status(400).json({ message: message });
  }
  if (req.body.title === '' || req.body.content === ''){
    const message = `Missing title in request body`;
    console.error(message);
    return res.status(400).send(message);
  }
  
  if(req.body.folderId && !(mongoose.Types.ObjectId.isValid(req.body.folderId))){
    const message = `Not a valid folder...`;
    console.error(message);
    return res.status(404).send(message);
  }

  const toUpdate = {};
  const updateableFields = ["title", "content", "folderId"];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  Note
    .findByIdAndUpdate(req.params.id, { $set: toUpdate }, { new: true })
    .then((note) => {
      return res.location(`${req.originalUrl}`).json(note).status(200)
    })
    .catch(err => next(err));
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  Note
  .findByIdAndRemove(req.params.id)
  .then(() => res.status(204).end())
  .catch(err => next(err));
});

module.exports = router;
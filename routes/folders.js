'use strict';

const express = require('express');
const mongoose = require('mongoose');

const Folder = require('../models/folder');
const router = express.Router();

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
    Folder
        .find()
        .sort({ name: 'asc'})
        .then((folders) => {
            res.json(folders)
        })
        .catch(err => next(err));
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
    if(!(mongoose.Types.ObjectId.isValid(req.params.id))) {
        const message = `these are not the droids you are looking for`;
        console.error(message);
        return res.status(404).send(message);
    }
    Folder
        .findById(req.params.id)
        .then((result) => {
            if(result){
                res.json(result).status(200);
              }
            else{
                const message = `that folder doesnt exist....yet`;
                console.error(message);
                return res.status(404).send(message);
            }
        })
        .catch(err => next(err));
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
    if (req.body.name === ''){
        const message = `cant post blank folder name`;
        console.error(message);
        return res.status(400).send(message);
    }
    if (!("name" in req.body)) {
        const message = `Missing name in request body you dolt`;
        console.error(message);
        return res.status(400).send(message);
    }
    Folder
        .create({
            name: req.body.name
        })
        .then((folder) => {
            res.location(`${req.originalUrl}/${folder.id}`).status(201).json(folder)
        })
        .catch(err => {
            if(err.code === 11000) {
                err = new Error('This folder name already exists dummy');
                err.status = 400;
            }
            next(err);
        });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
    if(!(mongoose.Types.ObjectId.isValid(req.params.id))) {
        const message = `these are not the droids you are looking for`;
        console.error(message);
        return res.status(404).send(message);
    }
    if (req.body.name === ''){
        const message = `cant post blank folder name`;
        console.error(message);
        return res.status(400).send(message);
    }
    if (!("name" in req.body)) {
        const message = `Missing name in request body you dolt`;
        console.error(message);
        return res.status(400).send(message);
    }
    let folderUpdate = { name: req.body.name };

    Folder
        .findByIdAndUpdate(req.params.id, { $set: folderUpdate}, {new: true })
        .then((folder) => {
            res.location(`${req.originalUrl}/${req.params.id}`).status(200).json(folder)
        })
        .catch(err => {
            if (err.code === 11000) {
              err = new Error('The folder name already exists');
              err.status = 400;
            }
            next(err);
        });
});


/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
    if(!(mongoose.Types.ObjectId.isValid(req.params.id))) {
        const message = `these are not the droids you are looking for`;
        console.error(message);
        return res.status(404).send(message);
    }
    Folder
        .findByIdAndRemove(req.params.id)
        .then(() => res.status(204).end())
        .catch(err => next(err));
});




module.exports = router;
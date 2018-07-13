'use strict';

const express = require('express');
const mongoose = require('mongoose');

const Tag = require('../models/tag');
const router = express.Router();

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
    const { searchTerm } = req.query;
    let filter = {};

    if (searchTerm) {
        filter.title = { $regex: searchTerm };
    }
    Tag
        .find(filter)
        .sort({ name: 'asc' })
        .then((tags) => {
            res.json(tags).status(200)
        })
        .catch(err => next(err));
})

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
    if(!(mongoose.Types.ObjectId.isValid(req.params.id))) {
        const message = `these are not the droids you are looking for (invalid ID)`;
        console.error(message);
        return res.status(404).send(message);
    }
    Tag
        .findById(req.params.id)
        .then((result) => {
            if(result){
                res.json(result).status(200);
              }
            else{
                const message = `that tag doesnt exist....yet`;
                console.error(message);
                return res.status(404).send(message);
            }
        })
        .catch(err => next(err));
})

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
    Tag
        .create({
            name: req.body.name
        })
        .then((tag) => {
            res.location(`${req.originalUrl}/${tag.id}`).status(201).json(tag)
        })
        .catch(err => {
            if(err.code === 11000) {
                err = new Error('This folder name already exists dummy');
                err.status = 400;
            }
            next(err);
        });
})

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
    if(!(mongoose.Types.ObjectId.isValid(req.params.id))) {
        const message = `these are not the droids you are looking for (invalid id)`;
        console.error(message);
        return res.status(404).send(message);
    }
    if (req.body.name === ''){
        const message = `cant post blank tag name`;
        console.error(message);
        return res.status(400).send(message);
    }
    if (!("name" in req.body)) {
        const message = `Missing name in request body you dolt`;
        console.error(message);
        return res.status(400).send(message);
    }
    let tagUpdate = { name: req.body.name };

    Tag
        .findByIdAndUpdate(req.params.id, { $set: tagUpdate }, { new: true })
        .then((tag) => {
            res.location(`${req.originalUrl}/${req.params.id}`).status(200).json(tag)
        })
        .catch(err => {
            if (err.code === 11000) {
              err = new Error('The tag name already exists');
              err.status = 400;
            }
            next(err);
        });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
    if(!(mongoose.Types.ObjectId.isValid(req.params.id))) {
        const message = `these are not the droids you are looking for (invalid ID)`;
        console.error(message);
        return res.status(404).send(message);
    }
    Tag
        .findByIdAndRemove(req.params.id)
        .then(() => res.status(204).end())
        .catch(err => next(err));
});

module.exports = router;
'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');
const Note = require('../models/note');
const Folder = require('../models/folder');
const seedNotes = require('../db/seed/notes');
const seedFolders = require('../db/seed/folders');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Notes Endpoints', () => {
    //basic set up for test environment
    //we set up the connection to our test db
    //drop everything then drop again, seed the db
    //then drop it after the test, then disconnect 
    //after all the tests are complete
    before(function () {
        return mongoose.connect(TEST_MONGODB_URI, { useNewUrlParser: true })
          .then(() => mongoose.connection.db.dropDatabase());
      });
    
      beforeEach(function () {
        return Promise.all([
            Note.insertMany(seedNotes),
            Folder.insertMany(seedFolders)
        ]) 
      });
    
      afterEach(function () {
        return mongoose.connection.db.dropDatabase();
      });
    
      after(function () {
        return mongoose.disconnect();
      });

      describe('GET /api/notes', function() {
          it('should return an array with the correct number of notes', function () {
              return Promise.all([
                  Note.find(),
                  chai.request(app).get('/api/notes')
              ])
                .then(([data, res]) => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('array');
                    expect(res.body).to.have.length(data.length);
                });
          });
          it('should return a list with the correct right fields', function () {
            return Promise.all([
              Note.find().sort({ updatedAt: 'desc' }),
              chai.request(app).get('/api/notes')
            ])
              .then(([data, res]) => {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.a('array');
                expect(res.body).to.have.length(data.length);
                res.body.forEach(function (item, i) {
                  expect(item).to.be.a('object');
                  expect(item).to.have.keys('id', 'title', 'content', 'tags', 'createdAt', 'updatedAt', 'folderId');
                });
              });
          });
          it('should return correct results for a folderid search', function() {
              let data;
              return Folder.findOne()
                .then((_data) => {
                    data = _data;
                    return Promise.all([
                        Note.find({ folderId: data.id }),
                        chai.request(app).get(`/api/notes?folderId=${data.id}`)
                    ]);
                })
                .then(([data, res]) => {
                    expect(res).to.be.json;
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.a('array');
                    expect(res.body).to.have.length(data.length);
                });
          });
      });

      describe('GET /api/notes/:id', function() {
          it('should return the correct note', function() {
              let data;
              return Note.findOne()
                .then((_data) => {
                    data = _data;
                    return chai.request(app).get(`/api/notes/${data.id}`);
                })
                .then((res) => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res).to.be.a('object');
                    expect(res.body).to.have.keys('id', 'title', 'tags', 'content', 'folderId', 'createdAt', 'updatedAt');
                    expect(res.body.id).to.equal(data.id);
                    expect(res.body.title).to.equal(data.title);
                    expect(res.body.content).to.equal(data.content);
                    expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
                    expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
                });
          });
          it('should return a 404 when given a valid but bogus ID', function() {
              let id = '000000000000000000000020';
              return chai.request(app).get(`/api/notes/${id}`)
                .then((res) => {
                    expect(res).to.have.status(404);
                    expect(res).to.be.json;
                    expect(res).to.be.a('object');
                });
          });
      });

      describe('POST /api/notes', function() {
          it('should create and return a new item when provided right data', function() {
              const newItem = {
                  'title': 'the best article ever!',
                  'content': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...',
                  'folderId': '111111111111111111111102'
              };

              let res;
              return chai.request(app)
                .post('/api/notes')
                .send(newItem)
                .then((_res) => {
                    res = _res;
                    expect(res).to.have.status(201);
                    expect(res).to.be.json;
                    expect(res).to.have.header('location');
                    expect(res.body).to.be.a('object');
                    expect(res.body).to.have.keys('id', 'title', 'content', 'tags', 'folderId', 'createdAt', 'updatedAt');
                    return Note.findById(res.body.id);
                })
                .then(data => {
                    expect(res.body.id).to.equal(data.id);
                    expect(res.body.title).to.equal(data.title);
                    expect(res.body.content).to.equal(data.content);
                    expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
                    expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
                });
          });
          it('should return a 400 error if try to post without title or content', function() {
              let badNewnew = {
                  'title': '',
                  'content': ''
              };
              return chai.request(app).post('/api/notes').send(badNewnew)
              .then((res) => {
                  expect(res).to.have.status(400);
                  expect(res).to.be.html;
              });
          });
      });

      describe('PUT /api/notes/:id', function() {
          it('should update the correct note and return the new note', function(){
            let data;
            const updateInfo = {
                'title': 'updated title!',
                'content': 'new content!!!!'
            };
            return Note.findOne()
                .then((_data) => {
                    data = _data;
                    updateInfo.id = data.id;
                    return chai.request(app).put(`/api/notes/${data.id}`).send(updateInfo)
                })
                .then((res) => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res).to.be.a('object');
                    expect(res.body).to.have.keys('id', 'title', 'content', 'tags', 'folderId', 'createdAt', 'updatedAt');
                    expect(res.body.id).to.equal(data.id);
                    expect(res.body.title).to.equal(updateInfo.title);
                    expect(res.body.content).to.equal(updateInfo.content);
                });
          })
          it('should throw a 400 error if you try to update note to a blank title or content', function() {
              const badUpdate = {
                  'title': '',
                  'content': ''
              };
              let data;
              return Note.findOne()
                .then((_data) => {
                    data = _data;
                    badUpdate.id = data.id;
                    return chai.request(app).put(`/api/notes/${data.id}`).send(badUpdate)
                })
                .then((res) => {
                    expect(res).to.have.status(400);
                    expect(res).to.be.html;
                });
          });
      });

      describe('DELETE /api/notes/:id', function() {
          it('should delete the correct note given an ID', function() {
              let data;
              return Note.findOne()
              .then((_data) => {
                  data = _data;
                  return chai.request(app).delete(`/api/notes/${data.id}`)
              })
              .then((res) => {
                  expect(res).to.have.status(204);
                  return Note.findById(data.id)
              })
              .then((res) => {
                  expect(res).to.be.null;
              });
          });
          it('should return 500 if given a bogus ID', function() {
              let badId = '';
              return chai.request(app).delete(`/api/notes/${badId}`)
              .then((res) => {
                expect(res).to.have.status(404);
              });
          });
      });
});


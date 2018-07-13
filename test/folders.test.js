'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');
const Folder = require('../models/folder');
const seedFolders = require('../db/seed/folders');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Folders Endpoints', () => {
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
        return Folder.insertMany(seedFolders);
      });
    
      afterEach(function () {
        return mongoose.connection.db.dropDatabase();
      });
    
      after(function () {
        return mongoose.disconnect();
      });

    describe('GET /api/folders', function() {
        it('should have same res from api as the db', function () {
            return Promise.all([
                Folder.find(),
                chai.request(app).get('/api/folders')
            ])
              .then(([data, res]) => {
                  expect(res).to.have.status(200);
                  expect(res).to.be.json;
                  expect(res.body).to.be.a('array');
                  expect(res.body).to.have.length(data.length);
              });
        });
    });

    describe('GET /api/folders/:id', function() {
        it('should return the correct folder', function() {
            let data;
            return Folder.findOne()
              .then((_data) => {
                  data = _data;
                  return chai.request(app).get(`/api/folders/${data.id}`);
              })
              .then((res) => {
                  expect(res).to.have.status(200);
                  expect(res).to.be.json;
                  expect(res).to.be.a('object');
                  expect(res.body).to.have.keys('name', 'id', 'createdAt', 'updatedAt');
                  expect(res.body.id).to.equal(data.id);
                  expect(res.body.name).to.equal(data.name);
                  expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
                  expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
              });
        });
        it('should return a 404 when given a bogus ID', function() {
            let id = '000000000000000000000020';
            return chai.request(app).get(`/api/folders/${id}`)
              .then((res) => {
                  expect(res).to.have.status(404);
                  expect(res).to.be.a('object');
              });
        });
    });

    describe('POST /api/folders', function() {
        it('should create and return a new folder when provided right data', function() {
            const newFolder = {
                'name': 'the newest folder!'
            };

            let res;
            return chai.request(app)
              .post('/api/folders')
              .send(newFolder)
              .then((_res) => {
                  res = _res;
                  expect(res).to.have.status(201);
                  expect(res).to.be.json;
                  expect(res).to.have.header('location');
                  expect(res.body).to.be.a('object');
                  expect(res.body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');
                  return Folder.findById(res.body.id);
              })
              .then(data => {
                  expect(res.body.id).to.equal(data.id);
                  expect(res.body.name).to.equal(data.name);
                  expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
                  expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
              });
        });
        it('should return a 400 error if try to post without a name', function() {
            let badNewnew = {
                'name': '',
            };
            return chai.request(app).post('/api/folders').send(badNewnew)
            .then((res) => {
                expect(res).to.have.status(400);
                expect(res).to.be.html;
            });
        });
    });

    describe('PUT /api/folders/:id', function() {
        it('should update the correct folder and return the new folder', function(){
          let data;
          const updateInfo = {
              'name': 'updated name!',
          };
          return Folder.findOne()
              .then((_data) => {
                  data = _data;
                  updateInfo.id = data.id;
                  return chai.request(app).put(`/api/folders/${data.id}`).send(updateInfo)
              })
              .then((res) => {
                  expect(res).to.have.status(200);
                  expect(res).to.be.json;
                  expect(res).to.be.a('object');
                  expect(res.body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');
                  expect(res.body.id).to.equal(data.id);
                  expect(res.body.name).to.equal(updateInfo.name);
              });
        })
        it('should throw a 400 error if you try to update folder to a blank name or content', function() {
            const badUpdate = {
                'name': '',
            };
            let data;
            return Folder.findOne()
              .then((_data) => {
                  data = _data;
                  badUpdate.id = data.id;
                  return chai.request(app).put(`/api/folders/${data.id}`).send(badUpdate)
              })
              .then((res) => {
                  expect(res).to.have.status(400);
                  expect(res).to.be.html;
              });
        });
    });
    
    describe('DELETE /api/folders/:id', function() {
        it('should delete the correct folder given an ID', function() {
            let data;
            return Folder.findOne()
            .then((_data) => {
                data = _data;
                return chai.request(app).delete(`/api/folders/${data.id}`)
            })
            .then((res) => {
                expect(res).to.have.status(204);
                return Folder.findById(data.id)
            })
            .then((res) => {
                expect(res).to.be.null;
            });
        });
        it('should return 500 if given a bogus ID', function() {
            let badId = '';
            return chai.request(app).delete(`/api/folders/${badId}`)
            .then((res) => {
              expect(res).to.have.status(404);
            });
        });
    });





    });
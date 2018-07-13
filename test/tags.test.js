'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');
const Tag = require('../models/tag');
const seedTags = require('../db/seed/tags');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Tags Endpoints', () => {
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
        return Tag.insertMany(seedTags);
      });
    
      afterEach(function () {
        return mongoose.connection.db.dropDatabase();
      });
    
      after(function () {
        return mongoose.disconnect();
      });

      describe('GET /api/tags', function() {
        it('should have same res from api as the db', function () {
            return Promise.all([
                Tag.find(),
                chai.request(app).get('/api/tags')
            ])
              .then(([data, res]) => {
                  expect(res).to.have.status(200);
                  expect(res).to.be.json;
                  expect(res.body).to.be.a('array');
                  expect(res.body).to.have.length(data.length);
              });
        });
    });

    describe('GET /api/tags/:id', function() {
        it('should return the correct tag', function() {
            let data;
            return Tag.findOne()
              .then((_data) => {
                  data = _data;
                  return chai.request(app).get(`/api/tags/${data.id}`);
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
            return chai.request(app).get(`/api/tags/${id}`)
              .then((res) => {
                  expect(res).to.have.status(404);
                  expect(res).to.be.a('object');
              });
        });
    });

    describe('POST /api/tags', function() {
        it('should create and return a new tag when provided right data', function() {
            const newTag = {
                'name': 'the newest tag!'
            };

            let res;
            return chai.request(app)
              .post('/api/tags')
              .send(newTag)
              .then((_res) => {
                  res = _res;
                  expect(res).to.have.status(201);
                  expect(res).to.be.json;
                  expect(res).to.have.header('location');
                  expect(res.body).to.be.a('object');
                  expect(res.body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');
                  return Tag.findById(res.body.id);
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
            return chai.request(app).post('/api/tags').send(badNewnew)
            .then((res) => {
                expect(res).to.have.status(400);
                expect(res).to.be.html;
            });
        });
    });

    describe('PUT /api/tags/:id', function() {
        it('should update the correct tag and return the new tag', function(){
          let data;
          const updateInfo = {
              'name': 'updated name!',
          };
          return Tag.findOne()
              .then((_data) => {
                  data = _data;
                  updateInfo.id = data.id;
                  return chai.request(app).put(`/api/tags/${data.id}`).send(updateInfo)
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
        it('should throw a 400 error if you try to update tag to a blank name or content', function() {
            const badUpdate = {
                'name': '',
            };
            let data;
            return Tag.findOne()
              .then((_data) => {
                  data = _data;
                  badUpdate.id = data.id;
                  return chai.request(app).put(`/api/tags/${data.id}`).send(badUpdate)
              })
              .then((res) => {
                  expect(res).to.have.status(400);
                  expect(res).to.be.html;
              });
        });
    });
    
    describe('DELETE /api/tags/:id', function() {
        it('should delete the correct tag given an ID', function() {
            let data;
            return Tag.findOne()
            .then((_data) => {
                data = _data;
                return chai.request(app).delete(`/api/tags/${data.id}`)
            })
            .then((res) => {
                expect(res).to.have.status(204);
                return Tag.findById(data.id)
            })
            .then((res) => {
                expect(res).to.be.null;
            });
        });
        it('should return 500 if given a bogus ID', function() {
            let badId = '';
            return chai.request(app).delete(`/api/tags/${badId}`)
            .then((res) => {
              expect(res).to.have.status(404);
            });
        });
    });

});
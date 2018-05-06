'use strict';

/**
 *
 * @author Ruben Aegerter
 */

const expect = require('chai').expect;
const {spawn} = require('child_process');
const {alexaRequestBuilder, googleActionRequestBuilder, send, addUserData, getUserData, removeUser, removeUserData} = require('jovo-framework').Jester;

describe('LAUNCH', function () {
    for (let req of [alexaRequestBuilder, googleActionRequestBuilder]) {
        it('should jump into LaunchIntent for ' + req.type(), function (done) {
            send(req.launch())
                .then((res) => {
                    expect(res.isAsk(['Hey?', 'Hello?', 'Good Morning?'], 'Hello World?')).to.equal(true);
                    done();
                })
        })
    }

});

describe.only('START WORKOUT FOR ALEXA', function () {
    for (let req of [googleActionRequestBuilder]) {
        it('should start a new workout and save the data in a db.json file', function (done) {
            this.timeout(5000);
            send(req.launch())
                .then(() => send(req.intent('TestIntent')))
                .then(() => send(req.intent('YesIntent')))
                .then((res) => {
                    expect(res.isTell('YES')).to.equal(true);
                    done();
                })
        });
    }
});

describe('FINISH WORKOUT', function () {
    it('should finish the workout after 4 rounds', function (done) {
        this.timeout(10000);
        send(googleActionRequestBuilder.intent('TestIntent'))
            .then(send(googleActionRequestBuilder.intent('YesIntent')))
            .then((res) => {
                expect(res.isTell('YES')).to.equal(true);
                done();
            })
            .catch((err) => {
                done(err);
            })
    })
});

describe('HelpIntent', function () {
    // TODO if this fails then user has no HelpIntent defined, which is essential for certification
    it('should successfully go into HelpIntent', function (done) {
        this.timeout(5000);
        send(alexaRequestBuilder.intent('HelpIntent'))
            .then((res) => {
                expect(res.isTell('I\'m happy to help.')).to.equal(true);
                done();
            })
            .catch((err) => {
                if (err.code === 'ESOCKETTIMEDOUT') {
                    done(new Error('You have to define a HelpIntent'));
                }
            })
    });
});

describe('Unhandled', function () {
    it('should go into Unhandled when requestIntent is defined as Unhandled', function (done) {
        this.timeout(5000);
        send(alexaRequestBuilder.intent('Unhandled'))
            .then((res) => {
                expect(res.isTell('I can\'t help you with that.')).to.equal(true);
                done();
            })
            .catch((err) => {
                if (err.code === 'ESOCKETTIMEDOUT') {
                    done(new Error('You have to define a UnhandledIntent'));
                }
            })
    });
});
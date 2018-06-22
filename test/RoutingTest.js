'use strict';

/**
 *
 * @author Ruben Aegerter
 */

// Configuration
const {app} = require('../app/app');
const expect = require('chai').expect;
const getPlatformRequestBuilder = require('jovo-framework').util.getPlatformRequestBuilder;
const {send, addUserData, addUser, removeUserData, removeUser, getUserData, removeSessionAttributes, setDbPath} = require('jovo-framework').TestSuite;
setDbPath(app.config.db.localDbFilename);

describe('REQUEST', function () {
    describe('LAUNCH', function () {
        for (let rb of getPlatformRequestBuilder()) {
            it('should jump into LaunchIntent for ' + rb.type(), function (done) {
                send(rb.launch())
                    .then((res) => {
                        expect(res.isAsk(['Hey?', 'Hello?', 'Good Morning?'], 'Hello World?')).to.equal(true);
                        done();
                    })
            })
        }
    });

    describe('INTENT', function () {
        for (let rb of getPlatformRequestBuilder()) {
            it('should send a default intent for ' + rb.type(), function (done) {
                send(rb.intent())
                    .then((res) => {
                        expect(res.isTell('I\'m happy to help you.')).to.equal(true);
                        done();
                    })
            });
            it('should save the launch intent in a variable for later usage for ' + rb.type(), function (done) {
                let intent = rb.intent();
                send(intent)
                    .then((res) => {
                        expect(res.isTell('I\'m happy to help you.')).to.equal(true);
                        done();
                    })
            });
            it('should successfully change the intent name and add slots by passing them as parameters for ' + rb.type(), function (done) {
                send(rb.intent('TestForSlotIntent', {name: 'John'}))
                    .then((res) => {
                        expect(res.isTell('Hey John!')).to.equal(true);
                        done();
                    });

            });
            it('should successfully change the intent name and add slots by calling the respective functions for ' + rb.type(), function (done) {
                send(rb.intent().setIntentName('TestForSlotIntent').addInput('name', 'John'))
                    .then((res) => {
                        expect(res.isTell('Hey John!')).to.equal(true);
                        done();
                    })
            });
            it('should set session attribute for ' + rb.type(), function (done) {
                send(rb.intent('TestSessionAttributesIntent').setSessionAttribute('STATE', 'TestSessionAttributesState'))
                    .then((res) => {
                        expect(res.isAsk('Am I in a state?')).to.equal(true);
                        done();
                    });
            });
            it('should delete all session attributes, if the session is new for ' + rb.type(), function (done) {
                send(rb.intent('TestSessionAttributesIntent').setState('TestSessionAttributesState'))
                    .then(() => send(rb.launch()))
                    .then((res) => {
                        expect(res.hasSessionAttributes()).to.equal(false);
                        done();
                    })
            });
            it('should set state for ' + rb.type(), function (done) {
                send(rb.intent('TestSessionAttributesIntent').setState('TestSessionAttributesState'))
                    .then((res) => {
                        expect(res.isAsk('Am I in a state?')).to.equal(true);
                        done();
                    });
            });
            it('should check, if session is new for ' + rb.type(), function (done) {
                send(rb.intent().setSessionNew())
                    .then((res) => {
                        expect(getUserData(rb.intent().getUserId(), 'new')).to.equal(true);
                        done();
                    });
            });
            it.skip('should take an own request object for ' + rb.type(), function (done) {
                send(require('./recordings/Hello/AlexaSkill/01_req_LAUNCH'))
                    .then((res) => {
                        expect(res.isAsk(['Hey?', 'Hello?', 'Good Morning?'], 'Hello World?')).to.equal(true);
                        done();
                    })
            });
        }
    });

    describe('END', function () {
        for (let rb of getPlatformRequestBuilder()) {
            it('should send an EndRequest for ' + rb.type(), function (done) {
                send(rb.end())
                    .then((res) => {
                        expect(res.isTell('Session ended.')).to.equal(true);
                        done();
                    })
            })
        }
    });

    describe('ALEXA SPECIFICS', function () {
        for (let rb of getPlatformRequestBuilder('AlexaSkill')) {
            describe('AUDIO', function () {
                it('should successfully send an AudioPlayer directive for ' + rb.type(), function (done) {
                    send(rb.audioPlayerRequest())
                        .then((res) => {
                            expect(res.getShouldEndSession()).to.equal(true);
                            done();
                        });
                });
                it('should successfully change the default directive for ' + rb.type(), function (done) {
                    send(rb.audioPlayerRequest('AudioPlayer.PlaybackStopped'))
                        .then((res) => {
                            expect(res.getShouldEndSession()).to.equal(true);
                            done();
                        })
                });
                it('should send a StopIntent for ' + rb.type(), function (done) {
                    send(rb.intent('AMAZON.StopIntent'))
                        .then((res) => {
                            expect(res.isTell('Audio stopped.')).to.equal(true);
                            done();
                        })
                })
            });
            describe('ERROR', function () {
                it('should send an error for ' + rb.type(), function (done) {
                    send(rb.errorRequest())
                        .then((res) => {
                            expect(res.isTell('Session ended.')).to.equal(true);
                            done();
                        })
                })
            });
            describe('SKILL EVENT REQUEST', function () {
                it('should just send a default skill event request for ' + rb.type(), function (done) {
                    send(rb.skillEventRequest())
                        .then((res) => {
                            //expect(res.isTell('Skill Event fired!')).to.equal(true);
                            done();
                        })
                })
            });
            describe('DISPLAY REQUEST', function () {
                it('should just send a default display request for ' + rb.type(), function (done) {
                    send(rb.displayRequest())
                        .then((res) => {
                            done();
                        })
                })
            })
        }
    });
});

describe('USER DATA', function () {
    describe('ADD USER DATA', function () {
        it('should add user data and get it successfully', function () {
            addUserData('1234', 'key', 'value');
            expect(getUserData('1234', 'key') === 'value').to.equal(true);
            removeUser();
        });
        it('should add multiple users without altering data for other users', function () {
            addUserData('123', 'data', 'data');
            addUserData('1234', 'key', 'value');
            expect(getUserData('123', 'key')).to.be.undefined;
        })
    });

    describe('USER_ID', function () {
        for (let rb of getPlatformRequestBuilder()) {
            it('should set user id for ' + rb.type(), function() {
                let req = rb.intent().setUserId('1234');
                expect(req.getUserId()).to.equal('1234');
            });
            it('should send an intent with a set user id for ' + rb.type(), function(done) {
                removeUser();
                let req = rb.intent().setUserId('1234');
                addUserData('1234', 'key', 'value');
                send(req)
                    .then(() => {
                        expect(getUserData('1234')).to.not.be.undefined;
                        expect(getUserData('123')).to.be.undefined;
                        done();
                    });
            });
        }
    })
});

describe('RESPONSE', function () {
    describe('Session Attributes', function () {
        for (let rb of getPlatformRequestBuilder()) {
            it('should include session attribute in response for ' + rb.type(), function (done) {
                send(rb.intent('TestSessionAttributesIntent'))
                    .then((res) => {
                        expect(res.hasSessionAttribute('STATE', 'TestSessionAttributesState')).to.equal(true);
                        done();
                    });
            });
            it('should automatically set session attributes for the next intent for ' + rb.type(), function (done) {
                send(rb.intent('TestSessionAttributesIntent'))
                    .then(() => send(rb.intent('TestUnhandledIntent')))
                    .then((res) => {
                        expect(res.isTell('Unhandled in a state.')).to.equal(true);
                        done();
                    })
            });
        }
    });
});

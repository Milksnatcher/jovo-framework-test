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
        for (let requestBuilder of getPlatformRequestBuilder('GoogleActionDialogFlow', 'AlexaSkill')) {
            it('should jump into LaunchIntent for ' + requestBuilder.type(), function (done) {
                send(requestBuilder.launch())
                    .then((res) => {
                        expect(res.isAsk(['Hey?', 'Hello?', 'Good Morning?'], 'Hello World?')).to.equal(true);
                        done();
                    })
            })
        }
    });

    describe('INTENT', function () {
        for (let requestBuilder of getPlatformRequestBuilder('GoogleActionDialogFlow', 'AlexaSkill')) {
            it('should send a default intent for ' + requestBuilder.type(), function (done) {
                send(requestBuilder.intent())
                    .then((res) => {
                        expect(res.isTell('I\'m happy to help you.')).to.equal(true);
                        done();
                    })
            });
            it('should save the launch intent in a variable for later usage for ' + requestBuilder.type(), function(done) {
                let intent = requestBuilder.intent();
                send(intent)
                    .then((res) => {
                        expect(res.isTell('I\'m happy to help you.')).to.equal(true);
                        done();
                    })
            });
            it('should successfully change the intent name and add slots by passing them as parameters for ' + requestBuilder.type(), function (done) {
                send(requestBuilder.intent('TestForSlotIntent', {name: 'John'}))
                    .then((res) => {
                        expect(res.isTell('Hey John!')).to.equal(true);
                        done();
                    });

            });
            it('should successfully change the intent name and add slots by calling the respective functions for ' + requestBuilder.type(), function (done) {
                send(requestBuilder.intent().setIntentName('TestForSlotIntent').addInput('name', 'John'))
                    .then((res) => {
                        expect(res.isTell('Hey John!')).to.equal(true);
                        done();
                    })
            });
            it('should set session attribute for ' + requestBuilder.type(), function (done) {
                send(requestBuilder.intent('TestSessionAttributesIntent').setSessionAttribute('STATE', 'TestSessionAttributesState'))
                    .then((res) => {
                        expect(res.isTell('I\'m in a state.')).to.equal(true);
                        done();
                    });
            });
            it('should delete all session attributes, if the session is new for ' + requestBuilder.type(), function(done) {
                send(requestBuilder.intent('TestSessionAttributesIntent').setState('TestSessionAttributesState'))
                    .then(() => send(requestBuilder.launch()))
                    .then((res) => {
                        expect(res.hasSessionAttributes()).to.equal(false);
                        done();
                    })
            });
            it('should set state for ' + requestBuilder.type(), function (done) {
                send(requestBuilder.intent('TestSessionAttributesIntent').setState('TestSessionAttributesState'))
                    .then((res) => {
                        expect(res.isTell('I\'m in a state.')).to.equal(true);
                        done();
                    });
            });
            it('should check, if session is new for ' + requestBuilder.type(), function (done) {
                send(requestBuilder.intent().setSessionNew())
                    .then((res) => {
                        expect(getUserData(requestBuilder.intent().getUserId(), 'new')).to.equal(true);
                        done();
                    });
            });
            it('should set user id for ' + requestBuilder.type(), function () {
                let req = requestBuilder.intent().setUserId('1234');
                expect(req.getUserId()).to.equal('1234');
            });
            it('should take an own request object for ' + requestBuilder.type(), function (done) {
                send(require('./recordings/Hello/AlexaSkill/01_req_LAUNCH'))
                    .then((res) => {
                        expect(res.isAsk(['Hey?', 'Hello?', 'Good Morning?'], 'Hello World?')).to.equal(true);
                        done();
                    })
            });
        }
    });

    describe('END', function () {
        for (let requestBuilder of getPlatformRequestBuilder('GoogleActionDialogFlow', 'AlexaSkill')) {
            it('should send an EndRequest for ' + requestBuilder.type(), function (done) {
                send(requestBuilder.end())
                    .then((res) => {
                        expect(res.isTell('Session ended.')).to.equal(true);
                        done();
                    })
            })
        }
    });

    describe('ALEXA SPECIFICS', function () {
        for (let requestBuilder of getPlatformRequestBuilder('AlexaSkill')) {
            describe('AUDIO', function () {
                it('should successfully send an AudioPlayer directive for ' + requestBuilder.type(), function (done) {
                    send(requestBuilder.audioPlayerRequest())
                        .then((res) => {
                            expect(res.getShouldEndSession()).to.equal(true);
                            done();
                        });
                });
                it.skip('should successfully change the default directive for ' + requestBuilder.type(), function (done) {
                    send(requestBuilder.audioPlayerRequest('PlaybackStopped'))
                        .then((res) => {
                            expect(res.getShouldEndSession()).to.equal(true);
                            send(requestBuilder.audioPlayerRequest().setType('AudioPlayer.PlaybackStopped'))
                                .then((res) => {
                                    expect(res.getShouldEndSession()).to.equal(true);
                                    done();
                                });
                        })
                });
                it('should send a StopIntent for ' + requestBuilder.type(), function (done) {
                    send(requestBuilder.intent('AMAZON.StopIntent'))
                        .then((res) => {
                            expect(res.isTell('Audio stopped.')).to.equal(true);
                            done();
                        })
                })
            });
            describe('ERROR', function () {
                it('should send an error for ' + requestBuilder.type(), function(done) {
                    send(requestBuilder.errorRequest())
                        .then((res) => {
                            expect(res.isTell('Session ended.')).to.equal(true);
                            done();
                        })
                })
            });
            describe('SKILL EVENT REQUEST', function() {
                it('should just send a default skill event request for ' + requestBuilder.type(), function(done) {
                    send(requestBuilder.skillEventRequest())
                        .then((res) => {
                            //expect(res.isTell('Skill Event fired!')).to.equal(true);
                            done();
                        })
                })
            });
            describe('DISPLAY REQUEST', function() {
                it('should just send a default display request for ' + requestBuilder.type(), function(done) {
                    send(requestBuilder.displayRequest())
                        .then((res) => {
                            done();
                        })
                })
            })
        }
    });
});

describe('USER DATA', function() {
    describe('ADD USER DATA', function() {
        it('should add user data and get it successfully', function() {
            addUserData('1234', 'key', 'value');
            expect(getUserData('1234', 'key') === 'value').to.equal(true);
            removeUser();
        });
        it('should add multiple users without altering data for other users', function() {
            addUserData('1234', 'key', 'value');
            addUserData('123');
            expect(getUserData('123', 'hello') === undefined).to.equal(true);
        })
    })
});

describe('RESPONSE', function () {
    describe('Session Attributes', function () {
        for (let requestBuilder of getPlatformRequestBuilder('GoogleActionDialogFlow', 'AlexaSkill')) {
            it('should include session attribute in response for ' + requestBuilder.type(), function (done) {
                send(requestBuilder.intent('TestSessionAttributesIntent'))
                    .then((res) => {
                        expect(res.hasSessionAttribute('STATE', 'TestSessionAttributesState')).to.equal(true);
                        done();
                    });
            });
            it('should automatically set session attributes for the next intent for ' + requestBuilder.type(), function (done) {
                send(requestBuilder.intent('TestSessionAttributesIntent'))
                    .then(() => send(requestBuilder.intent('TestUnhandledIntent')))
                    .then((res) => {
                        expect(res.isTell('Unhandled in a state.')).to.equal(true);
                        done();
                    })
            });
        }
    });
});

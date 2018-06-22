'use strict';

// =================================================================================
// App Configuration
// =================================================================================

const {App} = require('jovo-framework');

const config = {
    logging: true,
    intentMap: {
        "AMAZON.PauseIntent": "AudioPauseIntent",
        "AMAZON.NextIntent": "AudioNextIntent",
        'AMAZON.ResumeIntent': 'AudioResumeIntent',
        "AMAZON.YesIntent": "YesIntent",
        "AMAZON.NoIntent": "NoIntent",
        "AMAZON.CancelIntent": "AudioCancelIntent",
        "AMAZON.StopIntent": "AudioStopIntent"
    },
    db: {
        type: 'file',
        localDbFilename: 'test_db'
    }

};

const app = new App(config);

// =================================================================================
// App Logic
// =================================================================================

app.setHandler({
    'NEW_SESSION': function () {
        this.user().data.new = true;
    },

    'LAUNCH': function () {
        let speech = this.speechBuilder()
            .addText(['Hey?', 'Hello?', 'Good Morning?']);
        let reprompt = 'Hello World?';
        this.ask(speech, reprompt);
    },

    'END': function() {
        this.tell('Session ended.');
    },

    'HelpIntent': function () {
        this.tell('I\'m happy to help you.');
    },

    'TestForSlotIntent': function (name) {
        this.tell(`Hey ${name.key}!`);
    },

    'TestSessionAttributesIntent': function () {
        this.toStateIntent('TestSessionAttributesState', 'TestSessionAttributesIntent');
    },

    'TestSessionAttributesState': {
        'TestSessionAttributesIntent': function () {
            this.ask('Am I in a state?');
        },
        'Unhandled': function() {
            this.tell('Unhandled in a state.');
        }
    },

    'AudioStopIntent': function() {
        this.tell('Audio stopped.');
    },

    'ON_EVENT': {
        'AlexaSkillEvent.SkillDisabled': function () {
            this.endSession();
        },
    },

    'ON_ELEMENT_SELECTED': {
        "token": function () {
            this.endSession();
        }
    },

    "Unhandled": function () {
        this.tell('Unhandled');
    },


    'AUDIOPLAYER': {
        'AudioPlayer.PlaybackStarted': function () {
            this.tell('Playback Started.')
        },

        'AudioPlayer.PlaybackNearlyFinished': function () {
            console.log('AudioPlayer.PlaybackNearlyFinished');
            this.endSession();
        },

        'AudioPlayer.PlaybackFinished': function () {
            console.log('AudioPlayer.PlaybackFinished');
            this.endSession();
        },

        'AudioPlayer.PlaybackStopped': function () {
            console.log('AudioPlayer.PlaybackStopped');
            this.endSession();
        },
    },
});

module.exports.app = app;

'use strict';

// =================================================================================
// App Configuration
// =================================================================================

const {App} = require('jovo-framework');

const config = {
    logging: true,
    intentMap: {
        "AMAZON.PauseIntent": "CancelWorkoutIntent",
        "AMAZON.NextIntent": "NextExerciseIntent",
        'AMAZON.ResumeIntent': 'ResumeIntent',
        "AMAZON.YesIntent": "YesIntent",
        "AMAZON.NoIntent": "NoIntent",
        "AMAZON.CancelIntent": "CancelWorkoutIntent",
        "AMAZON.StopIntent": "CancelWorkoutIntent"
    },
};

const app = new App(config);

const countdownSound = "https://www.jovo.tech/audio/6ccwIA0o-sampleaudio-04mb.mp3";
const workoutSound = "https://www.jovo.tech/audio/6ccwIA0o-sampleaudio-04mb.mp3";
const restSound = "https://www.jovo.tech/audio/6ccwIA0o-sampleaudio-04mb.mp3";

const workouts = {
    Venus: {
        title: "Venus",
        exercises: [{exercise: "50 Pushups"}, {exercise: "20 Situps"}, {exercise: "50 Squads"}],
        rounds: 4
    },

    Ares: {
        title: "Ares",
        exercises: [{exercise: "7 Pullups"}, {exercise: "7 Situps"}, {exercise: "40 meter sprint twice"}, {rest: "60 seconds"}],
        rounds: 5
    }
};

// =================================================================================
// App Logic
// =================================================================================

app.setHandler({
    'LAUNCH': function() {
        let speech = this.speechBuilder()
            .addText(['Hey?', 'Hello?', 'Good Morning?']);
        let reprompt = 'Hello World?';
        console.log('LAUNCH');
        this.ask(speech, reprompt);
    },

    'ON_EVENT': {
        'AlexaSkillEvent.SkillDisabled': function() {
            this.endSession();
        },
    },

    'ON_ELEMENT_SELECTED': {
        "token": function() {
            this.endSession();
        }
    },

    'TestIntent': function () {
        this.toStateIntent('TestState', 'Hello');
    },

    'TestState': {
        'Hello': function() {
            this.followUpState('TestState').ask('Hello World?');
        },
        'YesIntent': function() {
            this.tell('YES');
        }
    },

    "EnterWorkoutIntent": function(workout) {
        this.toIntent("StartWorkoutIntent", workout);
    },

    "StartWorkoutIntent": function(workout) {
        this.user().data.rounds = 0;
        this.user().data.exercise = 0;
        if(!workouts[workout.key]) {
            this.tell('This workout doesn\'t exist.');
            return;
        }
        this.user().data.workout = workouts[workout.key];
        this.alexaSkill().audioPlayer().setOffsetInMilliseconds(0)
            .play(workoutSound, "token")
            .tell(this.speech.addText(`Starting with the workout ${workout.key}. `
                + `Get ready. The first exercise will be ${this.user().data.workout.exercises[this.user().data.exercise++ % this.user().data.workout.exercises.length].exercise}.`)
                .addAudio(countdownSound));
    },

    "NextExerciseIntent": function(exercise) {
        if(!(this.user().data.workout)) {
            this.toIntent("LAUNCH");
        }
        let nextExercise = this.user().data.workout.exercises[this.user().data.exercise++ % this.user().data.workout.exercises.length];
        let speech = "";

        if(this.user().data.exercise % this.user().data.workout.exercises.length === 0) {
            this.user().data.rounds++;
        }
        if(this.user().data.rounds >= this.user().data.workout.rounds) {
            this.toStateIntent("FinishWorkoutState", "FinishWorkoutIntent");
            return;
        }

        if(nextExercise.rest) {
            speech = `Rest for ${nextExercise.rest}.`;
            this.alexaSkill().audioPlayer()
                .play(restSound, "token")
                .tell(speech);
        } else if(nextExercise.exercise) {
            speech = `Coming to the next exercise: ${nextExercise.exercise}.`;
            this.tell(speech);
        }
    },

    "CancelWorkoutIntent": function(workout) {
        let speech = "Are you sure to cancel the workout? There are no excuses.";
        let reprompt = "Do you want to cancel the workout?";
        this.followUpState("CancelWorkoutState").ask(speech, reprompt);
    },

    "CancelWorkoutState": {
        "YesIntent": function() {
            this.user().data.exercise = 0;
            this.user().data.rounds = 0;
            this.alexaSkill().audioPlayer().stop().tell("You cancelled your current workout. I hope you feel bad.");
        },

        "NoIntent": function() {
            this.tell("Continuing with your workout.");
        },

        "Unhandled": function() {
            this.followUpState("CancelWorkoutState").ask("Do you want to cancel your current workout?", "");
        }
    },

    "FinishWorkoutIntent": function(workout) {
        if(this.user().data.rounds !== this.user().data.workout.rounds) {
            this.tell(`You haven't done ${this.user().data.workout.rounds} rounds yet.`);
        } else {
            let speech = "Are you sure to finish your workout?";
            let reprompt = "Do you want to finish your workout?";
            this.followUpState("FinishWorkoutState").ask(speech, reprompt);
        }
    },

    "FinishWorkoutState": {
        "FinishWorkoutIntent": function() {
            let workout = this.user().data.workout.title;
            this.user().data.exercise = 0;
            this.user().data.rounds = 0;
            this.user().data.workout = {};
            this.alexaSkill().audioPlayer().stop().tell(`You successfully finished ${workout}.`);
        },

        "YesIntent": function() {
            this.user().data.exercise = 0;
            this.user().data.rounds = 0;
            this.user().data.workout = {};
            this.alexaSkill().audioPlayer().stop().tell("Great job!");
        },

        "NoIntent": function() {
            this.tell("Continuing with your workout.");
        },

        "Unhandled": function() {
            this.followUpState("FinishWorkoutState").ask("Do you want to finish your current workout?", "");
        }
    },


    'AUDIOPLAYER': {
        'AudioPlayer.PlaybackStarted': function() {
            this.user().data.key = 'value';
            console.log('AudioPlayer.PlaybackStarted');
            this.endSession();
        },

        'AudioPlayer.PlaybackNearlyFinished': function() {
            console.log('AudioPlayer.PlaybackNearlyFinished');
            this.endSession();
        },

        'AudioPlayer.PlaybackFinished': function() {
            console.log('AudioPlayer.PlaybackFinished');
            this.endSession();
        },

        'AudioPlayer.PlaybackStopped': function() {
            console.log('AudioPlayer.PlaybackStopped');
            this.endSession();
        },
    },
});

module.exports.app = app;

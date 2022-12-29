import sgfutils from "./utils";

const SET_PREFIX = 'villes';

const db = [
    {key:'france-paris-nord', value: {}},
    {key:'france-paris-est', value: {}},
    {key:'france-paris-sud', value: {}},
    {key:'france-paris-ouest', value: {}},
    {key:'france-lyon-nord', value: {}},
    {key:'france-lyon-est', value: {}},
    {key:'france-lyon-sud', value: {}},
    {key:'france-lyon-ouest', value: {}},
    {key:'france-toulouse', value: {}},
    {key:'france-toulouse', value: {}},
    {key:'france-toulouse', value: {}},
    {key:'france-toulouse', value: {}},
    {key:'finland-helsinki-nord', value: {}},
    {key:'finland-helsinki-est', value: {}},
    {key:'finland-helsinki-sud', value: {}},
    {key:'finland-helsinki-ouest', value: {}},
    {key:'finland-espoo-nord', value: {}},
    {key:'finland-espoo-est', value: {}},
    {key:'finland-espoo-sud', value: {}},
    {key:'finland-espoo-ouest', value: {}},
    {key:'finland-vantaa', value: {}},
    {key:'finland-vantaa', value: {}},
    {key:'finland-vantaa', value: {}},
    {key:'finland-vantaa', value: {}}
];
export default {

    getDB: function() {
        return db;
    },

    getLessonKeys: function(setName) {
        return [
            'france-paris-nord',
            'france-paris-est',
            'france-paris-sud',
            'france-paris-ouest',
            'france-lyon-nord',
            'france-lyon-est',
            'france-lyon-sud',
            'france-lyon-ouest',
            'france-toulouse',
            'france-toulouse',
            'france-toulouse',
            'france-toulouse',
            'finland-helsinki-nord',
            'finland-helsinki-est',
            'finland-helsinki-sud',
            'finland-helsinki-ouest',
            'finland-espoo-nord',
            'finland-espoo-est',
            'finland-espoo-sud',
            'finland-espoo-ouest',
            'finland-vantaa',
            'finland-vantaa',
            'finland-vantaa',
            'finland-vantaa'
        ];
    },

    getLessonProgressForKeys: function(keys) {
        return this.getDB().filter(dbEntry => keys.some( oneSearchedKey => dbEntry.key === oneSearchedKey));
    },

    getLessonProgressForKeyPrefixes: function(keyPrefixes) {
        return this.getDB().filter(dbEntry => keyPrefixes.some( oneSearchedKey => dbEntry.key.indexOf(oneSearchedKey) === 0));
    },

    startOver: function() {

    },

    requestOtherMove: function() {

    },

    success: function(moveSignature) {

    },

    error: function(moveSignature) {

    },

    madeMove: function(moveSignature, previousMoveSignature) { //
        // loop on countries

        // show ALL existing countries

        // user chooses a country

        // if chosen country not in DB -> "not in lesson" (add error?) -> start over error, startOver
        // if chosen country was just visited (and other options exist) -> "do you know any other one?" -> re-choose a country requestOtherMove
        // otherwise, go to cities
        // // remove last visited city if any other option exists
        // // choose city with worst WR
        // // if leaf -> success -> back to loop start
        // // if not leaf -> go to directions
        // // // show ALL existing directions
        // // // user chooses a direction
        // // // if chosen direction not in DB -> "not in lesson" (add error?)  -> start over serror, tartOver
        // // // if chosen direction was just visited (and other options exist) -> "do you know any other one?" -> re-choose a direction requestOtherMove
        // // // if leaf -> success -> back to loop start
        // // // otherwise go to next move

    },

    debugShowProgress: function() {
      console.log('progress: ',this.getDB());
    },

    test: function() {
        this.debugShowProgress();
        // loop on countries

        // show ALL existing countries

        // user chooses a country
        this.madeMove();

        // if chosen country not in DB -> "not in lesson" (add error?) -> start over
        // if chosen country was just visited (and other options exist) -> "do you know any other one?" -> re-choose a country
        // otherwise, go to cities
        // // remove last visited city if any other option exists
        // // choose city with worst WR
        // // if leaf -> success -> back to loop start success, startOver
        // // if not leaf -> go to directions
        // // // show ALL existing directions
        // // // user chooses a direction
        // // // if chosen direction not in DB -> "not in lesson" (add error?)  -> start over
        // // // if chosen direction was just visited (and other options exist) -> "do you know any other one?" -> re-choose a direction
        // // // if leaf -> success -> back to loop start success, startOver
        // // // otherwise go to next move

    }
};

/**
*Created by darula
 * 20:35
 */

var Firebase= (function () {
    let instance;

    function createInstance() {
        return {
            apiKey: "AIzaSyDUFt49735p3vc8Q7gGCaitreadfEUXi6Q",
            authDomain: "geezusdarula.firebaseapp.com",
            databaseURL: "https://geezusdarula.firebaseio.com",
            projectId: "geezusdarula",
            storageBucket: "geezusdarula.appspot.com",
            messagingSenderId: "461964498281",
            appId: "1:461964498281:web:d13d5de4bf42ca7ecb59f8",
            measurementId: "G-G1ZSV7JY1G"
        };
    }

    return {
        getInstance: function () {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        }
    };
})();

let firebaseApp = firebase.initializeApp(Firebase.getInstance());
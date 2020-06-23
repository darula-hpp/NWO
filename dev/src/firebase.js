/**
*Created by darula
 * 20:35
 */

var Firebase= (function () {
    let instance;

    function createInstance() {
        return {
            apiKey: "AIzaSyCaGfvc08Z3ILPFwMB09phkF_dVgBmq12g",
            authDomain: "vcast-1c14c.firebaseapp.com",
            databaseURL: "https://vcast-1c14c.firebaseio.com",
            projectId: "vcast-1c14c",
            storageBucket: "vcast-1c14c.appspot.com",
            messagingSenderId: "167097156264",
            appId: "1:167097156264:web:8b64aca0fbb33778b1f89d",
            measurementId: "G-33L81ZTP7V"
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
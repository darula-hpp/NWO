/**
 *Created by daRula
 * 10:16
 * 29/03/20
 */

function AuthManager()
{
    this.user = null;
    AuthManager.UID = null;
    AuthManager.USER_IMAGE = null;
    AuthManager.EMAIL = null;

    AuthManager.prototype.init = function()
    {
        firebaseApp.auth().onAuthStateChanged((user)=> {
            if (user)
            {
                this.user = user;
                console.log('you are logged in as: ', user);
                AuthManager.UID = user.uid;
                AuthManager.USER_IMAGE = user.photoURL;
                AuthManager.EMAIL = user.email;
                $('#loginModal').remove();
                let photourl = user.photoURL;
                console.log('photo urlf', photourl);
                if(AuthManager.EMAIL === "olebogeng350@gmail.com")
                {
                    upload.init();
                }

                let user_data = {
                    display_name:user.displayName,
                    email:user.email,
                    photo_url:photourl
                };

                $('#prof_image_space').html(`
                <img style="max-height: 35px; cursor: pointer" id="side_menu" src="${photourl}" class="img img-circle img-responsive img-thumbnail rounded dropdown-toggle clickable" data-toggle="dropdown" aria-haspopup="true" >

        <ul class="dropdown-menu" id="side_menu_dropdown" aria-labelledby="side_menu">
            <li id="btn_discover"><a href="discover">Discover</a><ion-icon style="color: #a4a4a4;float: right; cursor: pointer" name="people-outline"></ion-icon></li>
            <li id="logout_btn" style="cursor: pointer">Logout<ion-icon style="color: #a4a4a4; float: right; cursor: pointer" name="log-out-outline"></ion-icon></li>
        </ul>`);
                user_manager.saveUserDetails(user_data);
                $('#logout_btn').on('click', ()=>{
                    auth_manager.signOut();
                })

            } else
            {
                // No user is signed in.
                console.log('No user is signed in!!');
                $('#loginModal').modal({
                    backdrop: 'static',
                    keyboard: false
                });

                setTimeout(()=>{
                    $('.modal-backdrop').remove()
                }, 1000);


                $('#glogin').click(()=>{
                    auth_manager.signInWithGoogle();
                })

            }

        });
    };

    AuthManager.prototype.isSignedIn = function()
    {
        let user = firebaseApp.auth().currentUser;
        console.log('is signed in!!', !!user);

        return !!user;
        //return this.user !== null;
    };


    AuthManager.prototype.signInWithGoogle = function ()
    {
        let provider = new firebase.auth.GoogleAuthProvider();


        firebaseApp.auth().signInWithPopup(provider).then((result)=> {
            // This gives you a Google Access Token. You can use it to access the Google API.
            let token = result.credential.accessToken;
            // The signed-in user info.
            let user = result.user;
            window.location.reload();
            // ...
        }).catch((error)=> {
            // Handle Errors here.
            let errorCode = error.code;
            let errorMessage = error.message;
            // The email of the user's account used.
            let email = error.email;
            // The firebase.auth.AuthCredential type that was used.
            let credential = error.credential;
            // ...
        });
    };

    AuthManager.prototype.signOut = function () {
        firebaseApp.auth().signOut().then(()=> {
            // Sign-out successful.
            window.location.reload();
        }).catch((error)=> {
            // An error happened.
        });
    };

}

/**
 *Created by darula
 *Created on 23/06/2020
 *Time: 11:42
 */

function Upload()
{
    Upload.prototype.init = function ()
    {
        if(AuthManager.EMAIL === "olebogeng350@gmail.com")
        {
            $('#main_container').html(Upload.getUploadForm());
        }

        $('#login_space').html(VCastUiManager.renderLoginModal());
        $('#upload_film').on('click', ()=>{
            upload.upload();
        })
    }

    Upload.prototype.upload = function()
    {
        let title = $('#title').val();
        let inspiration = $('#inspiration').val();
        if(title === "" || inspiration === "")
        {
            VCastUiManager.swalInfor("Fields Missing", "All fields are required");
            return;
        }


        let file = document.getElementById("video_file").files[0];
        let file_type;
        let name;

        try {
            name = file.name;
            file_type = file.type;
        } catch (e) {
            VCastUiManager.swalInfor("No file Selected", "Please upload the film.");
            return false;
        }

        if (file_type !== "video/mp4") {
            VCastUiManager.swalInfor("Please upload an MP4 File");
            return false;
        }

        let path = `nwo/season1/${name}`;

        upload.uploadFile(path, file, Upload.progressHandler, (downloadUrl)=>{
            let data = {
                time: new Date().getTime(),
                video_url: downloadUrl,
                path: path,
                inspiration: inspiration,
                title: title,
                UID: AuthManager.UID
            }



            try {
                firebaseApp.database().ref(`nwo/season1`).push(data);
                VCastUiManager.swalSuccess("Successfully uploaded film!")
            } catch (e) {
                VCastUiManager.swalInfor("Could not upload film, please retry!")
            }
            Upload.resetUploadModal("upload_file_modal");


        });
    }

    Upload.getUploadForm = function ()
    {
        return `<form>

    <div class="form-group">
        <label for="title">Enter Film Title</label>
        <input type="text" class="form-control" id="title">
    </div>
    
        <div class="form-group">
        <label for="inspiration">Inspiration</label>
        <textarea class="form-control" placeholder="Type the Inspiration" id="inspiration" rows="3"></textarea>
    </div>
    
        <div class="form-group">
        <label for="video_file">Upload Video (MP4)</label>
        <input type="file" class="form-control-file" id="video_file">
    </div>
    </form>

    <hr>

    <button type="submit" class="btn btn-success mb-2" id="upload_film">Create Profile</button>
    <div class="progress" id="upload_progress" style="display: none;" >
        <div id="upload_progress_bar" class="progress-bar progress-bar-success" role="progressbar"  aria-valuenow="1" aria-valuemin="0" aria-valuemax="100"></div>
</div>
<div style="margin-top: 50px;"></div>`
    }




    Upload.prototype.uploadFile = function (path, blob, progressHandler, completeHandler)
    {
        let uploadTask = firebaseApp.storage().ref().child(path).put(blob);

        // Register three observers:
        // 1. 'state_changed' observer, called any time the state changes
        // 2. Error observer, called on failure
        // 3. Completion observer, called on successful completion
        uploadTask.on('state_changed', function(snapshot){
            // Observe state change events such as progress, pause, and resume
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
            let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
            switch (snapshot.state) {
                case firebase.storage.TaskState.PAUSED: // or 'paused'
                    console.log('Upload is paused');
                    break;
                case firebase.storage.TaskState.RUNNING: // or 'running'
                    console.log('Upload is running');
                    break;
            }

            progressHandler(progress);
        }, function(error) {
            // Handle unsuccessful uploads
        }, function() {
            // Handle successful uploads on complete
            // For instance, get the download URL: https://firebasestorage.googleapis.com/...
            uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL)
            {
                console.log('File available at', downloadURL);
                completeHandler(downloadURL)
            });
        });

    }


    Upload.progressHandler = function(progress)
    {
        $('#upload_progress').show();
        $('#upload_btn').hide();
        let width = `${progress}%`;
        $('#upload_progress_bar').css("width", width);
    }

    Upload.resetUploadModal = function(modal_id)
    {
        $('#upload_progress').hide();
        $('#upload_btn').show();
        $('#video_file').val('');
        $('#' + modal_id).fadeOut();
    }
}/**
 * Created by darula
 * Created 05/04/2020
 *15:34
 */

function UserManager()
{
    UserManager.prototype.saveUserDetails = function (data)
    {

        function setLocally()
        {
            localStorage.setItem("email", data.email);
            localStorage.setItem("display_name", data.display_name);
            localStorage.setItem("photo_url", data.photo_url);
        }
        let update = false;
        //Get the items from localstorage
        let email = localStorage.getItem("email");
        let display_name = localStorage.getItem("display_name");
        let photo_url = localStorage.getItem("photo_url");
        if(!email || !display_name || !photo_url)
        {
            update = true;
            setLocally();
            console.log("all empty");
        }

        else if(email != data.email || display_name != data.display_name || photo_url != data.photo_url)
        {
            update = true;
            console.log("changed");
            setLocally();
        }

        if(update)
        {
            try
            {
                firebaseApp.database().ref(`users/${AuthManager.UID}/details`).set(data)
            }

            catch (e)
            {
                console.log("Could not save user details", e.message);
            }
        }
    };

    UserManager.prototype.getUserDetails = function (uid)
    {
        try
        {
            firebaseApp.database().ref(`users/${uid}/details`).once('value', (snapshot)=>{

            })
        }

        catch (e)
        {
            console.log("Details do not exist")
        }
    }
}/**
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

let firebaseApp = firebase.initializeApp(Firebase.getInstance());/**
 *Created by darula
 *Created on 23/06/2020
 *Time: 11:53
 */

auth_manager = new AuthManager();
user_manager = new UserManager();
upload = new Upload();
auth_manager.init();


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

    AuthManager.prototype.init =  function()
    {
        firebaseApp.auth().onAuthStateChanged((user)=> {
            if (user)
            {
                this.user = user;
                console.log('you are logged in as: ', user);
                AuthManager.UID = user.uid;
                AuthManager.USER_IMAGE = user.photoURL;
                $('#loginModal').remove();
                let photourl = user.photoURL;
                console.log('photo urlf', photourl);

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


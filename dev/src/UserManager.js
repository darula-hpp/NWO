/**
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
}
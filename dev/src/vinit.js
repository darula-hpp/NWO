/**
 *Created by darula
 *Created on 23/06/2020
 *Time: 11:53
 */

auth_manager = new AuthManager();
user_manager = new UserManager();
upload = new Upload();

stream = new Stream();
upload.init();
stream.init();


//vcast_player = new VCastPlayer(the_env);

(function()
{
    auth_manager.init();

})();


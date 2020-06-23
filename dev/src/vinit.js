/**
 *Created by darula
 *Created on 23/06/2020
 *Time: 11:53
 */

auth_manager = new AuthManager();
user_manager = new UserManager();
upload = new Upload();

series = new Series();
upload.init();
series.init();


//vcast_player = new VCastPlayer(the_env);

(function()
{
    auth_manager.init();

})();


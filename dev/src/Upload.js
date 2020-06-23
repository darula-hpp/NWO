/**
 *Created by darula
 *Created on 23/06/2020
 *Time: 11:42
 */

function Upload()
{
    Upload.prototype.init = function ()
    {
        $('#main_container').html(`Hello World`);
        $('#login_space').html(VCastUiManager.renderLoginModal());
    }
}
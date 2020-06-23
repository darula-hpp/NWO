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
        alert("Will upload");
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
}
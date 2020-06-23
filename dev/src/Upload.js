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
                $('#title').val('');
                $('#inspiration').val('');

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
}
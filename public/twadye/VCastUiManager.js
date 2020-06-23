function VCastUiManager()
{
    VCastUiManager.displayVideoEditingOptions = function ()
    {
        return `
        <style>
            div.select {
                display: inline-block;
                margin: 0 0 1em 0;
            }

            p.small {
                font-size: 0.7em;
            }

            label {
                width: 12em;
                display: inline-block;
            }
        </style>
        <section id="vcasta" style="position: absolute; bottom:0;right:20px; display: none">
        <div id="vcast_controls">
                    <div class="select">
                <span for="audioSource">Audio input source: </span><select id="audioSource"></select>
            </div>

            <div class="select">
                <span for="audioOutput">Audio output destination: </span><select id="audioOutput"></select>
            </div>

            <div class="select">
                <span for="videoSource">Video source: </span><select id="videoSource"></select>
            </div>
        </div>


            <div style="" id="start_stop_btns" onclick="$('#start_stop').toggle(300)">
                <span id="btnStart" class="glyphicon glyphicon-play-circle start_stop clickable" style="color:#5fba46; font-size: 25px; cursor: pointer;"></span>
                <span id="btnStop" class="glyphicon glyphicon-stop start_stop clickable" style="font-size: 25px; color: #ff7667; cursor: pointer"></span>
            </div>

            <video id="vcast_source" playsinline autoplay></video>
                    <video id="vid2" style="display: none"></video>
            <div style="display: none" id="lower_menu">
                <span data-toggle="modal" data-target="#save_vcast_modal" onclick="setTimeout(()=>{$('.modal-backdrop').remove()}, 1000);" style="color: grey;" class="glyphicon glyphicon-upload clickable"></span>
                <span style="color: #3ea44c; " id="vcast_replay" class="glyphicon glyphicon-repeat clickable"></span>
                <span style="color: #ff7667; " id="vcast_delete" class="glyphicon glyphicon-trash clickable"></span>
            </div>


        </section>`
    };

    VCastUiManager.swalConfirm = function(text, fail_text, callback)
    {
        Swal.fire({
                title: "Are you sure?",
                text: `${text}`,
                type: "warning",
                icon:"info",
                dangerMode: true,
                showCancelButton: true,
                confirmButtonColor: '#DD6B55',
                confirmButtonText: 'Yes, I am sure!',
                cancelButtonText: "No, cancel it!",
                closeOnConfirm: false,
                closeOnCancel: false
            }).then((result)=>{
            if (result.value)
            {
                callback();

            } else
            {
                Swal.fire("Cancelled", `${fail_text} :)`, "error");
            }
        })
    };

    VCastUiManager.swalSuccess = function(message)
    {
        Swal.fire({
            title: "Success!",
            text: message,
            timer: 2500,
            icon:"success",
            type: "success",
            showConfirmButton: true
        });
    };



    VCastUiManager.swalWarning = function(message)
    {
        Swal.fire({
            title: "Ow ow!",
            text: message,
            timer: 2500,
            icon: "warning",
            showConfirmButton: true
        });
    };

    VCastUiManager.swalInfor = function(title, message)
    {
        Swal.fire({
            title:title,
            icon:"info",
            type:"success",
            text:message,
            timer: 2500,
        })
    };


    /**
     *
     * @returns {string}
     */
    VCastUiManager.renderLoginModal = function ()
    {
        return `
                <div class="modal fade" id="loginModal" style="z-index: 1000">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-title"><span class="small"><img width="100" src="../static/images/logo_transparent3.png" class="img-responsive"></span></div>
                    </div>

                    <div class="modal-body">
                        <p>Google Login</p>
                        <div id="glogin">
                        <img style="margin-left: auto; margin-right: auto;display: block;cursor: pointer" src="../static/images/google-signin.png" alt="Google Sign In">
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    };

    VCastUiManager.addIcon= function(element_id, append = false)
    {
        if(append === true)
        {
            $(`#${element_id}`).append(`<div id="ftco-loader"  class="show fullscreen d-flex justify-content-center"><svg class="circular" width="48px" height="48px"><circle class="path-bg" cx="24" cy="24" r="22" fill="none" stroke-width="4" stroke="#eeeeee"/><circle class="path" cx="24" cy="24" r="22" fill="none" stroke-width="4" stroke-miterlimit="10" stroke="#F96D00"/></svg></div>`)
        }


        else
        {
            $(`#${element_id}`).html(`<div id="ftco-loader" style="justify-content: center" class="show fullscreen"><svg class="circular" width="48px" height="48px"><circle class="path-bg" cx="24" cy="24" r="22" fill="none" stroke-width="4" stroke="#eeeeee"/><circle class="path" cx="24" cy="24" r="22" fill="none" stroke-width="4" stroke-miterlimit="10" stroke="#F96D00"/></svg></div>`)
        }
    }

    /**
     *
     */
    VCastUiManager.removeLoadingIcon = function()
    {
        $('#ftco-loader').remove();
    }

    VCastUiManager.renderSaveModal = function ()
    {
        return `
        <div class="modal fade" id="save_vcast_modal" style="z-index:1000">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <button class="close" data-dismiss="modal">&times;</button>
                        <div class="modal-title"><h2>Save VCast</h2></div>
                    </div>

                    <div class="modal-body">
                       
                       <div class="form-group">
                       <label>Title</label>
                       <input type="text" id="vcast_title" class="form-control" placeholder="Type Title">
                        </div>
                        <div id="share_urls"></div>

                    </div>

                    <div class="modal-footer" id="save_status">
                        <button class="btn btn-success" id="vcast_upload" style="float: left">Save</button>
                        <button class="btn btn-default btn-xs" data-dismiss="modal">Close</button>
                        
                    </div>
                   
                </div>
            </div>
        </div>
        `
    };

    VCastUiManager.getChatBody = function ()
    {
        return `
                    <div class="msg_box" style="display: none; z-index: 2000">
                <div class="msg_head"><span id="user_header">Chat</span>
                    <div class="close">x</div>
                </div>
                <div class="msg_wrap">
                    <div class="msg_body">
                        <div id="msg_start"></div>
                        <!--<div class="msg_a">This is from A\t</div>
                        <div class="msg_b">This is from B, and its amazingly kool nah... i know it even i liked it :)</div>
                        <div class="msg_a">Wow, Thats great to hear from you man </div>-->
                        <div class="msg_push">
                        </div>
                        <div id="audio_upload_status"></div>
                    </div>
                    <div class="msg_footer">
                    <span id="typing_space_alert"></span>
                    <textarea id="chat_area" class="msg_input" style="width:190px;" rows="2"></textarea>
                    <div id="msg_tools" style="right:10px; bottom:14px; position: absolute; flex-direction: column">
                    <ion-icon id="text_send_btn" style="color: #147efb; font-size: 20px;" name="send-sharp"></ion-icon>
                    <ion-icon id="record_audio_btn" style="color: #a4a4a4; font-size: 20px;" name="mic-circle-outline"></ion-icon>
                    <ion-icon id="stop_record_btn" style="color: #f27469; font-size: 20px; display: none" name="mic-off-outline"></ion-icon>
                    <!--<ion-icon id="upload_chat_image" style="color: #6c757d; font-size: 20px;" name="image"></ion-icon>-->
                    </div>
                    
                    </div>
                </div>
            </div>
        `
    }
}



vcast_ui_manager = new VCastUiManager();
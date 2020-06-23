/**
 * Created by Darula
 * 15/04/2020
 * 22:28
 */

function ActionsManager()
{
    this.undo_button = null;
    this.redo_button = null;
    /**
     * TODO: Turn the parameters into a dictionary and initialize accordingly
     * @param undo_id
     * @param redo_id
     */
    ActionsManager.prototype.init = function(undo_id, redo_id)
    {
        $('#more_tools').show();
        this.undo_button = document.querySelector(`#${undo_id}`)
        this.redo_button = document.querySelector(`#${redo_id}`);
    }

    /**
     * Initialize the undo and redo buttons,
     * @param undoCallBack
     * @param redoCallBack
     */
    ActionsManager.prototype.initRedoUndo = function (undoCallBack, redoCallBack)
    {
        actions_manager.undo_button.addEventListener('click', (e)=>{
            undoCallBack();
        })

        actions_manager.redo_button.addEventListener('click', (e)=>{
            redoCallBack();
        })
    }

}
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

let mediaRecorder;

function Chat()
{
    Chat.ENV = "test";
    Chat.ScrollTopBeforeChat = $(window).scrollTop();
    Chat.MESSAGE_TYPES = Object.freeze({"TEXT":"text", "RECORDING":"recording"});
    Chat.recorded_blob = null;
    Chat.lesson_id = null;

    Chat.prototype.init = function()
    {
        setInterval(()=>{
            Chat.clearTypingText();
        }, 5000);


        Chat.recordAudio();
        //file_upload_manager.init("upload_file_modal", "upload_chat_image", group_chat.uploadChatFile);

    };
    Chat.prototype.subscribeToMessages =function (env, user_id, lesson_id)
    {
        console.log('subscribed & uid is', user_id);
        console.log('subscribed & lesson 9d is', lesson_id);
        Chat.lesson_id = lesson_id;
        $('#chat_area').on('keypress', (e)=>{
            Chat.sendMessage(e, lesson_id, env, user_id)
        });

        $('#text_send_btn').click((e)=>{
            Chat.buttonSend(e, env, lesson_id, user_id);
        });

        group_chat.subscribeToTyping(env, user_id, lesson_id);
        group_chat.renderFromHistory(lesson_id, env, user_id);
        Chat.clearTypingText();

        Chat.ENV = env;
        Chat.lesson_id = lesson_id;
        Chat.user_id = user_id;
        let latest = firebaseApp.database().ref(`lessons/${env}/${lesson_id}/chat`);
        latest.limitToLast(1).on('child_added', function(snapshot)
        {
            try
            {
                console.log(snapshot.val());
                let data = snapshot.val();
                if(user_id != data.sender_id) //Draw if the publisher is not the subscriber
                {
                    Chat.renderMessage(data, user_id);
                    Chat.newMessage();
                    Chat.clearTypingText(); //clear that someone is typing
                }
            }

            catch (e) {
                console.log("They might not be a message yet");
            }


        });
    };


    Chat.prototype.uploadChatFile = function(blob)
    {
        console.log('file is', blob);
    }


    Chat.newMessage = function(){

        let elem = $('#message_badge');

        let current_count = elem.text();
        let update = parseInt(current_count) + 1;

        if(!$('.msg_body').is(":visible")) //Only update when the element is not visible
        {
            elem.show();
            elem.text(update);
            console.log('element not visible');
            NotificationManager.showNotification("New Message", `You have ${update} message(s)`, "message");
        }

    };



    Chat.sendMessage = function (e, lesson_id, env, user_id)
    {
        console.log('lesson_id', lesson_id);
        console.log('env', env);

        if (e.keyCode == 13 && !e.shiftKey) {
            e.preventDefault();
            Chat.send(env, lesson_id, user_id)
        }

        else
        {
            group_chat.publishTyping(user_id, lesson_id, env);
        }
    };

    Chat.buttonSend = function(e, env, lesson_id, user_id)
    {
        e.preventDefault();
        Chat.send(env, lesson_id, user_id)
    };

    Chat.recordAudio = function()
    {
        let gumStream; 						//stream from getUserMedia()
        let rec; 							//Recorder.js object
        let input; 							//MediaStreamAudioSourceNode we'll be recording

        // shim for AudioContext when it's not avb.
        let AudioContext = window.AudioContext || window.webkitAudioContext;
        let audioContext; //audio context to help us record

        let start = document.getElementById('record_audio_btn');
        let stop = document.getElementById('stop_record_btn');
        let start_ = $('#record_audio_btn');
        let stop_ = $('#stop_record_btn');

        start.addEventListener('click', startRecording);
        stop.addEventListener('click', stopRecording);

        function startRecording() {
            console.log("recordButton clicked");

            /*
                Simple constraints object, for more advanced audio features see
                https://addpipe.com/blog/audio-constraints-getusermedia/
            */

            let constraints = { audio: true, video:false };

            /*
               Disable the record button until we get a success or fail from getUserMedia()
           */

            start_.hide();
            stop_.show();

            /*
                We're using the standard promise based getUserMedia()
                https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
            */

            navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
                console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

                /*
                    create an audio context after getUserMedia is called
                    sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
                    the sampleRate defaults to the one set in your OS for your playback device
                */
                audioContext = new AudioContext();

                //update the format

                /*  assign to gumStream for later use  */
                gumStream = stream;

                /* use the stream */
                input = audioContext.createMediaStreamSource(stream);

                /*
                    Create the Recorder object and configure to record mono sound (1 channel)
                    Recording 2 channels  will double the file size
                */
                rec = new Recorder(input,{numChannels:1})

                //start the recording process
                rec.record();

                console.log("Recording started");

            }).catch(function(err) {
                //enable the record button if getUserMedia() fails
                start_.show();
                stop_.hide();
            });
        }

        function stopRecording() {
            console.log("stopButton clicked");

            //disable the stop button, enable the record too allow for new recordings
            stop_.hide();
            start_.show();

            //tell the recorder to stop the recording
            rec.stop();

            //stop microphone access
            gumStream.getAudioTracks()[0].stop();

            //create the wav blob and pass it on to createDownloadLink
            rec.exportWAV(Chat.confirmUpload);
        }





    };

    /**
     *
     * @param env
     * @param lesson_id
     * @param user_id
     * @param type
     */
    Chat.send = function(env, lesson_id, user_id, type = null)
    {
        let msg = $('.msg_input').val();
        let color = Chat.stringToHslColor(AuthManager.UID);
        console.log('here1');
        type = type === null ? Chat.MESSAGE_TYPES.TEXT : type;


        $('.msg_input').val('');
        if(msg!='')
        {
            let data = {
                message:msg
            };
            console.log('here2');
            $(`<div class="msg_b" style="background-color: ${color}">${msg}</div>`).insertBefore('.msg_push');
            $('#msg_start').html('');
            try
            {
                firebaseApp.database().ref(`lessons/${env}/${Chat.lesson_id}/chat`).push({
                    time: new Date().getTime(),
                    data:data,
                    sender_id:AuthManager.UID,
                    type:type
                });
            }

            catch (e)
            {
                console.log(e.message);
                VCastUiManager.swalWarning("Failed to send message, check connection");
                console.log('couldnt send');
            }


        }
        $('.msg_body').scrollTop($('.msg_body')[0].scrollHeight);
    };

    Chat.sendAudioMsg = function(env, url)
    {
        let color = Chat.stringToHslColor(AuthManager.UID);
        let data = {
            url:url
        };
        try
        {
            firebaseApp.database().ref(`lessons/${env}/${Chat.lesson_id}/chat`).push({
                time: new Date().getTime(),
                data:data,
                sender_id:AuthManager.UID,
                type:Chat.MESSAGE_TYPES.RECORDING
            });
            Swal.fire("Done!","Recording uploaded","success");

            $(`<div class="msg_b" style="background-color: ${color}">
                    <audio controls style="width:150px; height:20px;">
                      <source src="${url}" type="audio/wav">
                    Your browser does not support the audio element.
                    </audio>
                    </div>`).insertBefore('.msg_push');
        }

        catch (e)
        {
            console.log(e.message);
            Swal.fire("Failed", `Failed to upload`, "error");
            console.log('couldnt send');
        }

        $('.msg_body').scrollTop($('.msg_body')[0].scrollHeight);
        $('#audio_upload_status').html('');
    };

    Chat.stringToHslColor = function(str)
    {
        let s = 90;//Math.floor(Math.random() * 101);
        let l = 40;Math.floor(Math.random() * 101);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }

        let h = hash % 360;
        return 'hsl('+h+', '+s+'%, '+l+'%)';

    };

    Chat.renderMessage = function (data, user_id)
    {
        let color = Chat.stringToHslColor(data.sender_id);

        let type = data.type;
        let displayable = ``;
        let time = data.time;
        let the_date = new Date(time);
        let year = the_date.getFullYear();
        let month = (the_date.getMonth() + 1).toString();
        let day = the_date.getDate().toString();
        let hours = the_date.getHours().toString();
        let minutes = the_date.getMinutes().toString();
        minutes = minutes.length === 1 ? `0${minutes}` : minutes;
        month = month.length === 1 ? `0${month}` : month;
        hours = hours.length === 1 ? `0${hours}` : hours;
        day = day.length === 1 ? `0${day}` : day;
        let str = `${day}/${month}/${year} at ${hours}:${minutes}`;
        switch (type)
        {
            case Chat.MESSAGE_TYPES.TEXT:
                displayable = data.data.message;
                break;
            case Chat.MESSAGE_TYPES.RECORDING:
                let url = data.data.url;
                displayable = `
                <audio controls style="width:150px; height:20px;">
                      <source src="${url}" type="audio/wav">
                    Your browser does not support the audio element.
                    </audio>
                `;
                break;

        }
        if(data.sender_id == user_id)
        {
            $(`<div class="msg_b" style="background-color: ${color}" onclick="$('#' + ${time}).toggle(300);" ><span id="${time}" style="display: none;">${str}<br></span>${displayable}</div>`).insertBefore('.msg_push');
        }

        else
        {
            $(`<div class="msg_a" style="background-color: ${color}" onclick="$('#' + ${time}).toggle(300);" ><span id="${time}" style="display: none;">${str}<br></span>${displayable}</div>`).insertBefore('.msg_push');
        }

        $('.msg_body').scrollTop($('.msg_body')[0].scrollHeight);
    };


    /**
     * Render messages from history
     * @param lesson_id
     * @param env
     * @param user_id
     */
    Chat.prototype.renderFromHistory = function (lesson_id, env, user_id)
    {
        firebaseApp.database().ref(`lessons/${env}/${lesson_id}/chat`).once('value',  (snapshot)=>
        {
            try
            {
                let msgs = snapshot.val();
                let keys = Object.keys(msgs);
                keys.forEach((key, index)=>{
                    let data = msgs[key];
                    Chat.renderMessage(data, user_id);
                })
            }

            catch (e)
            {
                console.log("No messages");
            }
        });
        $('.msg_body').scrollTop($('.msg_body')[0].scrollHeight);
        Chat.clearTypingText();
    };

    Chat.clearTypingText = function()
    {
        $('#typing_space_alert').text('');
    };

    Chat.prototype.publishTyping = function(user_id, lesson_id, env)
    {
        try
        {
            firebaseApp.database().ref(`lessons/${env}/${lesson_id}/typing`).set({
                time: new Date().getTime(),
                typer_id:user_id,
            });
        }

        catch (e)
        {
            console.log('Somewone typing failed to publish', e.message)
        }

    };

    Chat.confirmUpload = function(blob)
    {

        function progressHandler(progress)
        {
            $('#audio_upload_status').html(`
                    <div class="progress">
            <div class="progress-bar progress-bar-success" role="progressbar" style="width: ${progress}%" aria-valuenow="1" aria-valuemin="0" aria-valuemax="100"></div>
        </div>`)
        }
        Swal.fire({
                title: "Upload Recording?",
                text: `Upload this recording`,
                type: "success",
                dangerMode: false,
                showCancelButton: true,
                confirmButtonColor: '#53d769',
                confirmButtonText: 'Upload',
                cancelButtonText: "Delete",
                closeOnConfirm: false,
                closeOnCancel: false
            }).then((result)=>{
            if (result.value)
            {
                let file_name = new Date().getTime() + ".wav";
                let path = `vsessions/${Chat.ENV}/${Chat.lesson_id}/recordings/${file_name}`;
                vcast_manager.uploadFile(path, blob, progressHandler, (downloadUrl)=>{
                    Chat.sendAudioMsg(Chat.ENV, downloadUrl);
                });
                Swal.fire({
                    title:`Progress`,
                    icon:"success",
                    type:"success",
                    text:'File uploading',
                    timer: 1000,
                })

            } else
            {
                Swal.fire("Cancelled", `You cancelled`, "error");
            }
        })
    };

    Chat.prototype.subscribeToTyping = function (env, user_id, lesson_id)
    {

        try
        {
            firebaseApp.database().ref(`lessons/${env}/${lesson_id}/typing`).on('value', (snapshot)=>{
                //TODO State who is typing
                let infor = snapshot.val();
                if(infor.typer_id == user_id)
                {
                    console.log("You are typing")
                }

                else
                {
                    $('#typing_space_alert').text('Someone is typing...');
                }

            })
        }

        catch (e)
        {
            console.log('Someone typing failed to be retried')
        }

    }
}



group_chat = new Chat();/**
 * Created by daRula
 * 01/04/20
 **09:43
 **/

function Config()
{
    Config.prototype.init = function ()
    {
        config.fixVideoCallWidth();
    };

    Config.prototype.fixVideoCallWidth = function ()
    {

    }
}

config = new Config();/**
 **Created by darula
 * 05/04/2020
 * 10:09
 */

function DeviceManager()
{
    DeviceManager.CONNECTED_DEVICES = [];
    DeviceManager.SMALLEST_WIDTH = $(window).width();
    DeviceManager.DEVICE_WIDTHS = [];
    DeviceManager.prototype.updateDeviceInformation = function (path, user_id, connected)
    {
        let width = $(window).width();
        try
        {
            let data = {
                device_width:width,
                user_id:user_id,
                connected:connected
            };
            firebaseApp.database().ref(path).set(data)
        }

        catch (e)
        {
            console.log("Could not publish device information")
        }
    };

    DeviceManager.prototype.subscribeToDeviceInformation = function (path, callback)
    {
        firebaseApp.database().ref(path).on('value', (snapshot)=>{
            try
            {
                callback(snapshot)
            }

            catch (e)
            {
                console.log("no connected devices yet")
            }
        })
    };

    DeviceManager.updateConnectedDevices = function(user_id, device_width, add = true)
    {
        $('#connected_status').show();
        if(add)
        {
            if(user_id != AuthManager.UID)
            {
                VCastUiManager.swalInfor("Connected", "Someone just connected");
            }
            if(!DeviceManager.CONNECTED_DEVICES.includes(user_id))
            {
                DeviceManager.CONNECTED_DEVICES.push(user_id);
            }

            if(!DeviceManager.DEVICE_WIDTHS.includes(device_width))
            {
                DeviceManager.DEVICE_WIDTHS.push(device_width);
            }
        }

        else
        {
            /*if(user_id != AuthManager.UID && AuthManager.UID)
            {
                //VCastUiManager.swalInfor("Disconnected", "Someone just left");
            }*/
            const index = DeviceManager.CONNECTED_DEVICES.indexOf(user_id);
            if (index > -1)
            {
                DeviceManager.CONNECTED_DEVICES.splice(index, 1);
            }

            const dev_width_index = DeviceManager.DEVICE_WIDTHS.indexOf(device_width);
            if(dev_width_index > -1)
            {
                DeviceManager.DEVICE_WIDTHS.splice(dev_width_index, 1);
            }
        }
        let num_connected = DeviceManager.CONNECTED_DEVICES.length;
        $('#connected_status').text(`${num_connected} Connected`);

        DeviceManager.drawSmallWidthMargin();
    };


    DeviceManager.prototype.getAllConnectedDevices = function (path, callback)
    {
        firebaseApp.database().ref(path).once('value', (snapshot)=>{
            try
            {
                callback(snapshot)
            }

            catch (e)
            {
                console.log("no connected devices yet")
            }
        })
    };

    DeviceManager.drawSmallWidthMargin = function ()
    {
        $('#bounding_box_').remove();

        let min_width = Math.min(...DeviceManager.DEVICE_WIDTHS);
        let left = min_width  + "px";
        let shader_width = ($(window).width() - min_width) + "px";
        let height = document.getElementById("drawCanvas").height + "px";


        $('body').append(`<div title="You may not write here because the device connected is smaller" id="bounding_box_" style="position: absolute; top:41px; left:${left}; width: ${shader_width}; height: ${height}; background-color: rgba(165,165,165,0.8);"></div>`)
    }
}/**
 **Created by daRula
 * created on 14:07
 **/


function DraggableElement()
{

    DraggableElement.prototype.init = function(container_id, item_id)
    {
        let active = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;
        console.log("draggable init called");
        let item = `#${item_id}`
        let cont = `#${container_id}`;
        let dragItem = document.querySelector(item);
        let container = document.querySelector(cont);
        let initial_offset = container.offsetTop - container.clientHeight;
        console.log('offset top initial is: ', initial_offset);

        /*$(window).scroll(function()
        {
            $(cont).css({
                "top": ($(window).scrollTop()) + initial_offset + "px",
                "left": ($(window).scrollLeft()) + "px"
            });
        });*/

        container.addEventListener("touchstart", dragStart, false);
        container.addEventListener("touchend", dragEnd, false);
        container.addEventListener("touchmove", drag, false);

        container.addEventListener("mousedown", dragStart, false);
        container.addEventListener("mouseup", dragEnd, false);
        container.addEventListener("mousemove", drag, false);

        function dragStart(e) {
            console.log('in start dragging!!');
            if (e.type === "touchstart") {
                initialX = e.touches[0].clientX - xOffset;
                initialY = e.touches[0].clientY - yOffset;
            } else {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
            }

            if (e.target) {
                active = true;
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;

            active = false;
        }

        function drag(e) {
            console.log("in drag")
            if (active) {
                console.log("drag is axctive");

                e.preventDefault();

                if (e.type === "touchmove") {
                    currentX = e.touches[0].clientX - initialX;
                    currentY = e.touches[0].clientY - initialY;
                } else {
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                }

                xOffset = currentX;
                yOffset = currentY;

                setTranslate(currentX, currentY, dragItem);
            }
        }

        function setTranslate(xPos, yPos, el) {
            el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
        }
    }
}






/**
 *Created by daRula
 * 29/03/19
 * 0858
 */

function FileManager()
{

}

file_manager = new FileManager();function FileUploadManager()
{
    FileUploadManager.MAX_FILE_SIZE = 10000000; //MAX is 10mb for now
    FileUploadManager.ALLOWED_FILE_TYPES = ["application/pdf", "application/vnd.oasis.opendocument.presentation"]; //Append new file types as required
    FileUploadManager.ALLOWED_IMAGES = ["image/png", "image/jpg", "image/jpeg"];
    FileUploadManager.ALLOWED_VIDEOS = ["video/mp4"];
    /**
     * Initialize the file uploader
     */
    FileUploadManager.prototype.init = function (modal_id, upload_btn_id, uploadCallback)
    {
        /**
         * Add  click listeners to the modals
         */
            // Get the modal
        let modal = $('#'+modal_id);

        // Get the button that opens the modal
        let btn = document.getElementById(upload_btn_id);

        // Get the <span> element that closes the modal
        let span = document.getElementById("close_modal_span");

        // When the user clicks the button, open the modal
        btn.onclick = function() {
            modal.css("display", "block")
        };

        // When the user clicks on <span> (x), close the modal
        span.onclick = function() {

            //modal.css("display", "none");
            modal.fadeOut()
        };

        let upload_button = $('#upload_btn');
        upload_button.on('click', (e)=>{
            e.preventDefault();
            file_upload_manager.uploadFile(uploadCallback);
        })
    };

    FileUploadManager.prototype.uploadFile = function (uploadCallback)
    {
        let file = document.getElementById("vcast_file").files[0];

        if(FileUploadManager.verifyFile(file))
        {
            uploadCallback(file);
        }
    };

    FileUploadManager.progressHandler = function(progress)
    {
        $('#upload_progress').show();
        $('#upload_btn').hide();
        let width = `${progress}%`;
        $('#upload_progress_bar').css("width", width);
    }

    FileUploadManager.resetUploadModal = function(modal_id)
    {
        $('#upload_progress').hide();
        $('#upload_btn').show();
        $('#vcast_file').val('');
        $('#' + modal_id).fadeOut();
    }

    /**
     * Verify a selected file
     * @param file
     * @returns {boolean}
     */
    FileUploadManager.verifyFile = function (file)
    {
        let file_type;
        let formats = FileUploadManager.ALLOWED_IMAGES.concat(FileUploadManager.ALLOWED_VIDEOS).concat(FileUploadManager.ALLOWED_FILE_TYPES);

        let file_size;
        try
        {
             file_type = file.type;
             file_size = file.size;
        }

        catch (e)
        {
            VCastUiManager.swalWarning("Please select a file.");
            return false;
        }
        console.log('File type is', file_type);

        if(!file)
        {
            VCastUiManager.swalWarning("Please select a file.");
            return false;
        }
        if(!formats.includes(file_type))
        {
            VCastUiManager.swalWarning("Please upload a valid file");
            return false;
        }

        if(file_size > FileUploadManager.MAX_FILE_SIZE)
        {
            VCastUiManager.swalWarning("File is too big");
            return false;
        }

        return true;
    }
}

/**
 *Created by daRula
 */

function IntroManager()
{
    IntroManager.startBeforeSession = function ()
    {
        let viewed_before_session = localStorage.getItem("before_session");
        if(!viewed_before_session)
        {
            localStorage.setItem("before_session", "true");
            javascript:introJs().start();
        }
    };

    IntroManager.startAfterSession = function ()
    {
        let viewed_after_session = localStorage.getItem("after_session");
        if(!viewed_after_session)
        {
            localStorage.setItem("after_session", "true");
            javascript:introJs().start();
        }
    }
}/**
 *Created by daRula
 * Created on 11:23
 * 04/04/2020
 */

function NotificationManager()
{
    NotificationManager.prototype.init =function()
    {
        NotificationManager.request();
    }


    NotificationManager.request = function ()
    {
        if (window.Notification && Notification.permission !== "granted") //Ask only when we not granted
        {
            Notification.requestPermission().then((permission) => {
                if (!('permission' in Notification)) {
                    Notification.permission = permission;
                }
            }).catch((e) => {
                console.log('an error occured', e.message);
            })
        }

    };

    NotificationManager.showNotification = function (title, message, tag) {
        if (window.Notification && Notification.permission === "granted")
        {
            let notification = new Notification(title, {
                body: message
            });

            /*navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, {
                    body: message,
                    tag: tag,
                    vibrate: [200, 100, 200, 100, 200, 100, 400]
                }).then(() => {
                    console.log("Notification shown")
                }).catch((e) => {
                    console.log("Could not show notification!", e.message)
                });
            });*/
        }
    };

    NotificationManager.checkNotificationPromise = function () {
        try {
            Notification.requestPermission().then();
        } catch (e) {
            return false;
        }

        return true;

    };
}
/*
*Created by daRula
* Created on: 30/03/20
* 1100
 */

function SessionManager()
{

    SessionManager.generateSessionVar = function (length)
    {
        let result           = '';
        let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for ( let i = 0; i < length; i++ )
        {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    };

    SessionManager.prototype.destroySession = function ()
    {

    };

    SessionManager.prototype.startSession = function ()
    {
        alert('start session clicked')
    }
}

session_manager = new SessionManager();/**
 *Created by darula
 *Created on 17/06/2020
 *Time: 04:50
 */

function Timer()
{
    Timer.TUTOR_TIME_PER_MONTH = 540000; //Seconds
    Timer.STUDENT_TIMER = 216000; //seconds
    Timer.started = false;
    Timer.prototype.init =function () {
        this.start_time = new Date().getTime();
        Timer.started = true;
        this.user_id = AuthManager.UID;
        this.env = the_env;
    }

    /**
     * Function to save time spent on a tution session
     */
    Timer.prototype.saveDuration = function()
    {
        let end_time = new Date().getTime();
        let duration = end_time - timer.start_time;

        firebaseApp.database().ref(`users/${AuthManager.UID}/timer`).push({
            duration: duration,
            time: new Date().getTime()
        })

        Timer.started = false;
    }


    /**
     * @param is_tutor
     */
    Timer.prototype.countHours = function (is_tutor = true)
    {
        firebaseApp.database().ref(`users/${AuthManager.UID}/timer`).once('value', (snapshot)=>{
            try
            {
                let times = snapshot.val();
                let keys = Object.keys(times);
                let total_time = 0;
                let end_time = 0;
                let counter = 0;
                let start_time = 0;
                keys.forEach((key, index)=>
                {
                    let data = times[key];
                    total_time += data.duration;
                    if(counter === 0)
                    {
                        start_time = data.time;
                    }
                    counter ++;
                    end_time = data.time;
                });

                let seconds = total_time / 1000;
                if(is_tutor)
                {
                    let hours = seconds/3600;
                    let time_string = hours.toFixed(2);
                    $('#hours_status').text(`${time_string} used`)
                }

                else
                {
                    let total_student_time = 60 * 60 * 60;
                    let time_left = total_student_time - seconds;
                    let hrs = time_left / 3600;
                    let str = hrs.toFixed(2);
                    $('#hours_status').text(`${str} hours left`)
                }

            }

            catch (e)
            {
                if(is_tutor)
                {
                    $('#hours_status').text("Tutored 0 hours");
                }

                else
                {
                    $('#hours_status').text("60 hours left");
                }
            }
        })
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
 * To do move everything that handles VCast Content into this file
 * @constructor
 */
function VCastContentManager()
{
    VCastContentManager.ACTIVE_CONTENT = null;
    VCastContentManager.CONTENT_TYPES = Object.freeze({"TEXT":"text", "FREE_HAND":"free_hand", "FILE_PRESENTATION":"presentation"})
    let canvas = document.getElementById('drawCanvas');

    VCastContentManager.renderContent = function (data, key)
    {
        let ctx;
        try
        {
            ctx = canvas.getContext('2d');
        }

        catch (e) {
            return;
        }

        let content_type = data.content_type;
        let file_type;
        let file_data;
        let url;

        switch (content_type)
        {
            case VCastManager.CONTENT_TYPES.FILE_PRESENTATION:
                file_data = data.data;
                file_type = file_data.file_type;
                url = file_data.url;
                //TODO Render the presentation here
                let width = 595;
                let height = 842;
                let screen_width = $(window).width();
                if(screen_width < width)
                {
                    width = screen_width;
                    height = 1.41 * width;
                }
                console.log(`url is`, url);
                FirebasePubSub.FILE_EXISTS = true;
                $('body').append(`<iframe style="" id="${key}" class="vsession_item" src = "/libs/thirdparty/ViewerJS/#${url}" width="${width}" height=${height} allowfullscreen webkitallowfullscreen></iframe>`);
                break;

            case VCastManager.CONTENT_TYPES.IMAGE:
                FirebasePubSub.FILE_EXISTS = true;
                file_data = data.data;
                file_type = file_data.file_type;
                url = file_data.url;
                $('body').append(` <img id="${key}" src="${url}" alt="Image missing" class="img img-responsive vsession_item" style="max-height: 600px;">`)
                break;
            case VCastManager.CONTENT_TYPES.TYPE_STROKE:
                ctx.lineWidth = data.size;
                drawOnCanvas(data.color, data.data, ctx);
                break;
            case VCastManager.CONTENT_TYPES.TYPE_TEXT:

                strokeTextOnCanvas(data.data);
                break;
            case VCastManager.CONTENT_TYPES.PAGE_BREAK:
                VCastManager.clearScreen();
                break;

            case VCastManager.CONTENT_TYPES.VIDEO:
                file_data = data.data;
                file_type = file_data.file_type;
                url = file_data.url;
                FirebasePubSub.FILE_EXISTS = true;
                $('body').append(`<video id="${key}" class="vsession_item" controls style="max-height: 600px;">
                    <source src="${url}">
                </video>`)
        }
    }

    VCastContentManager.clearScreen = function (key)
    {
        VCastManager.clearScreen();
        $(`#${key}`).remove();
    }
}

/**
 **Created by daRula
 * 1326
 * 30/03/2020
 */

function VCastPlayer(env)
{
    this.vcast_id = null;
    this.source_video_url = null;
    this.source_data = null;
    VCastPlayer.ENV = env;
    VCastPlayer.prototype.init =  function ()
    {
        let url_string = window.location.href;
        let url = new URL(url_string);
        let vcast_id = url.searchParams.get("v");
        this.vcast_id = vcast_id;
        if(vcast_id !== "")
        {
            vcast_player.fetchVideoSRC();
            $('#btnStart').click(()=>{
                vcast_manager.zanehape(this.vcast_id)
            })
        }

        console.log('VAST_id in player is', vcast_id);


    };

    VCastPlayer.prototype.fetchVideoSRC = function ()
    {
        let vid = document.getElementById('vid2');
        console.log('VCASTS ID HERE', this.vcast_id);
        try
        {
            firebaseApp.database().ref(`vcasts/${VCastPlayer.ENV}/${this.vcast_id}/share_props`).once('value',  (snapshot)=>
            {
                console.log("Video Snapshot is", snapshot)
                console.log('Snapshot is', snapshot.val());
                let video_url = snapshot.val().video_url;
                console.log('video', video_url);
                vid.src = video_url;
                $('#vcasta').show();
                $('#vid2').show();
                $('#vcast_source').remove();
                $('#vcast_controls').remove();
                $('#draggable_text').remove();
                $('#btnStop').hide();

            })
        }

        catch (e)
        {
            console.log("IN VCast player, ", e.message);
        }
    };

    VCastPlayer.fetchVCastVideo = function ()
    {

    }
}
/**
 *Created by darula
 *Created on 22/06/2020
 *Time: 12:58
 */

function Admin()
{

}/**
 *Created by darula
 *Created on 18/06/2020
 *Time: 16:53
 */

function Loader()
{
    Loader.prototype.init = function ()
    {
        // loader
        let loader = function() {
            setTimeout(function() {
                if($('#ftco-loader').length > 0) {
                    $('#ftco-loader').removeClass('show');
                }
            }, 1);
        };
        loader();

    }
}/**
 *Created by darula
 *Created on 14/06/2020
 *Time: 22:17
 */

function Profile()
{
    Profile.prototype.init = function ()
    {
        loader.init();
        this.user_id = AuthManager.UID;
        this.env = the_env;

        console.log("Item is discover");
        $('#main_container').html(Profile.renderProfile());
        $('#login_space').html(VCastUiManager.renderLoginModal());

    }

    Profile.renderProfile = function ()
    {
        let url_string = window.location.href;
        url_string =url_string.replace("%2F", "/");
        url_string = url_string.replace("#_=_", "");
        let index = url_string.indexOf("?profile");
        let and_index = url_string.indexOf("&");
        if(and_index > 0)
        {
            url_string = url_string.substring(0, and_index);
        }

        let length = url_string.length;

        let username  = url_string.substring(index + 9, length);
        if(username === "")
        {
            return `<h1><b>404</b> Profile not found</h1>`;
        }

        else
        {
            VCastUiManager.addIcon('main_container');
        }

        $('meta[name=og\\:image]').attr('content', AuthManager.USER_IMAGE);
        $('meta[name=og\\:title]').attr('content', `Get tutored by ${username} on VCast`);

        firebaseApp.database().ref(`users`).once('value', (snapshot)=> {
            let tutors = snapshot.val();
            let keys = Object.keys(tutors);

            keys.forEach((key, index) => {
                let tutor_data = tutors[key];
                try
                {
                    let _username = tutor_data.profile.username;
                    if(_username === username)
                    {
                        VCastUiManager.removeLoadingIcon();
                        $('#main_container').append(Profile.renderUserProfile(tutor_data));
                    }


                }
                catch (e)
                {

                }
            });
        });
    }

    Profile.renderUserProfile = function (tutor_data)
    {
        let tutor_profile = tutor_data.profile;
        let details = tutor_data.details;
        let UID = details.UID;
        if(UID === AuthManager.UID)
        {
            timer.countHours(true);
        }
        let photo_url = details.photo_url;
        let first_name = tutor_profile.first_name;
        let last_name = tutor_profile.last_name;
        let bio = tutor_profile.short_bio;
        let username = tutor_profile.username;
        let app_number = Discover.getNumber(tutor_profile.app_number);
        let subjects = tutor_profile.subjects;
        let subject_names = Discover.getSubjectNames(subjects);

        let subjects_string = "Tutors ";
        subject_names.forEach((name, index)=>{
            subjects_string += name + ", ";
        })

        subjects_string = subjects_string.substring(0, subjects_string.length - 2);
        return `<h3 style="" class="d-flex justify-content-center">@${username}</h3><div class="container" style="margin-left: auto; margin-right: auto"><div class="card" style="width: 18rem">

<a href="https://vcast.app/discover?profile/${username}">
    <img class="card-img-top" src="${photo_url}" alt="Card image cap">
    <div class="card-body">
      <h5 class="card-title">${first_name + " " + last_name}</h5>
      <small style="color: rgb(59,57,57);; text-decoration: none">${subjects_string}</small>
      <p class="card-text">${bio}</p>
    </div>

</a>


    <div class="card-footer">
      <a href="https://wa.me/${app_number}"><ion-icon  style="float: left; color: #25D366; width: 40px; height: 40px; cursor: pointer;" name="logo-whatsapp"></ion-icon><a/>
       <a href="https://www.facebook.com/dialog/share?app_id=1748121785498328&display=popup&href=https://vcast.app/discover?profile/${username}
  &redirect_uri=https://vcast.app/discover?profile/${username}" target="_blank"><ion-icon  style="" class="footer_icons" name="logo-facebook"></ion-icon></a> 
         <a target="_blank" href="https://twitter.com/intent/tweet?text=Check%20out%20${username}%20on%20VCast%20https://vcast.app/discover?profile/${username}"><ion-icon class="footer_icons" name="logo-twitter" style="color: #10DFFD"></ion-icon></a>
         <a href="tel:+${app_number}"><ion-icon class="footer_icons" style="color: #2dc72d" name="call"></ion-icon></a>
    </div>

  </div></div>`;
    }
}/**
 *Created by darula
 *Created on 28/05/2020
 *Time: 08:42
 */

function CreateProfile() {
    CreateProfile.createProfileForm = function () {
        return `    <h3>Create your VCast Tutor Profile</h3>
<form>

    <div class="form-group">
        <label for="first_name">First Name</label>
        <input type="text" class="form-control" id="first_name">
    </div>
    
        <div class="form-group">
        <label for="last_name">Last Name</label>
        <input type="text" class="form-control" id="last_name">
    </div>
    
            <div class="form-group">
        <label for="username">Pick a Username</label>
        <input type="text" class="form-control" id="username">
    </div>
    
        <div class="form-group">
        <label for="bank_details">FNB Bank Details (How we pay you, e-wallet, pay to cell etc...)</label>
        <textarea class="form-control" placeholder="Type your Bank details" id="bank_details" rows="3"></textarea>
    </div>
    <div class="form-group">
        <label for="app_number">WhatsApp Number</label>
        <input maxlength="8" type="number" class="form-control" id="app_number" placeholder="Type your Number">
    </div>
    
    <div class="form-group">
    <label for="tutor_type">Tutor Type</label>
    <select class="form-control" id="tutor_type">
            <option value="self">Self Employed</option>
            <option type="lion">From Lion Tutoring</option>
            <option type="crackit">From CrackIt Tutoring</option>
            <option type="paragon">From Paragon Tutoring</option>
    </select>
    
</div>

    <div class="form-group">
        <label for="subjects">Select Subjects (Max is 3)</label>
        <select multiple class="form-control" id="subjects">
            <option value="1">BGCSE Mathematics</option>
            <option value="2">BGCSE Physics</option>
            <option value="3">BGCSE Chemistry</option>
            <option value="4">BGCSE Biology</option>
            <option value="5">IGCSE Mathematics</option>
            <option value="6">IGCSE Physics</option>
            <option value="7">IGCSE Chemistry</option>
            <option value="8">IGCSE Biology</option>
        </select>
    </div>
    <div class="form-group">
        <label for="short_bio">Short Bio</label>
        <textarea class="form-control" placeholder="Type your Bio" id="short_bio" rows="3"></textarea>
    </div>

    <div class="form-group">
        <label for="start_time">Tuition Start time (Max of 5 hours a day)</label>
        <input type="time" class="" id="start_time">
    </div>
   

    <div class="form-group">
        <label for="cv_document">Upload your CV (PDF)</label>
        <input type="file" class="form-control-file" id="cv_document">
    </div>

</form>
    <hr>

    <button type="submit" class="btn btn-success mb-2" id="create_btn">Create Profile</button>
    <div class="progress" id="upload_progress" style="display: none;" >
        <div id="upload_progress_bar" class="progress-bar progress-bar-success" role="progressbar"  aria-valuenow="1" aria-valuemin="0" aria-valuemax="100"></div>
</div>
<div style="margin-top: 50px;"></div>
        `
    }
    CreateProfile.prototype.init = function () {
        this.user_id = AuthManager.UID;
        this.env = the_env;
        let url_string = window.location.href;

        if (url_string.indexOf("?create") > 0) {
            console.log("Item is create");
            $('#main_container').html(CreateProfile.createProfileForm());
            $('#login_space').html(VCastUiManager.renderLoginModal());

            create_profile.fetchProfile();
        } else if (url_string.indexOf("profile") > 0) {
            profile.init();
        } else {
            discover.init();
        }

        $('#create_btn').on('click', () => {
            create_profile.validateInput();
        })
    }

    /**
     *
     * @returns {boolean}
     */
    CreateProfile.prototype.validateInput = async function () {
        let first_name = $('#first_name').val();
        let last_name = $('#last_name').val();
        let start_time = $('#start_time').val();
        let short_bio = $('#short_bio').val();
        let subjects = $('#subjects').val();
        let tutor_type = $('#tutor_type').val();
        let app_number = $('#app_number').val();
        let username = $('#username').val();
        let bank_details = $('#bank_details').val();

        if (username.includes(" ")) {
            VCastUiManager.swalInfor("Username Invalid", "Username should not include spaces");
            return false;
        }

        await CreateProfile.usernameExists(username);
        console.log('exists', exists);

        let is_valid = CreateProfile.validateUsername(username);
        if (is_valid === false) {
            return false;
        }


        let file = document.getElementById("cv_document").files[0];
        let file_type;
        let name;

        try {
            name = file.name;
            file_type = file.type;
        } catch (e) {
            VCastUiManager.swalInfor("No file Selected", "Please upload your CV.");
            return false;
        }

        if (file_type !== "application/pdf") {
            VCastUiManager.swalInfor("Please upload a PDF File");
            return false;
        }


        let path = `profiles/${AuthManager.UID}/${name}`;
        vcast_manager.uploadFile(path, file, FileUploadManager.progressHandler, (downloadUrl) => {
            let data = {
                first_name: first_name,
                last_name: last_name,
                start_time: start_time,
                short_bio: short_bio,
                subjects: subjects,
                tutor_type: tutor_type,
                app_number: app_number,
                bank_details: bank_details,
                username: username,
                cv_url: downloadUrl,
                cv_path: path,
                approved: "0",
                UID: AuthManager.UID
            }

            try {
                firebaseApp.database().ref(`users/${AuthManager.UID}/profile`).set(data);
                VCastUiManager.swalSuccess("Successfully created profile!")
            } catch (e) {
                VCastUiManager.swalInfor("Could not create profile, please retry!")
            }
            FileUploadManager.resetUploadModal("upload_file_modal");

        })
    }

    /**
     *
     * @param username
     * @returns {boolean}
     */
    CreateProfile.validateUsername = function (username) {
        let nameRegex = /^[a-zA-Z\-]+$/;
        let validUsername = username.match(nameRegex);
        if (validUsername == null) {
            VCastUiManager.swalInfor("Invalid Username", "Your first name is not valid. Only characters A-Z, a-z and '-' are  acceptable.");
            return false;
        }
    }

    /*
    Function to check if the User has an existing profile
     */
    CreateProfile.prototype.fetchProfile = function () {
        firebaseApp.database().ref(`users/${AuthManager.UID}/profile`).once('value', (snapshot) => {
            try {
                let keys = Object.keys(snapshot);
                console.log('Snapshot is', snapshot);
                keys.forEach((item, index) => {
                    //alert(item);
                })
            } catch (e) {
                console.log("Profile doesnt exist");
            }
        })
    }

    /**
     *
     * @param username
     * @returns {*}
     */
    CreateProfile.usernameExists = async function (username) {
        await firebaseApp.database().ref(`users`).once('value', (snapshot) => {
            let tutors = snapshot.val();
            console.log(tutors);

            let keys = Object.keys(tutors);

            return keys.forEach((key, index) => {
                let tutor_data = tutors[key];
                try {
                    let _username = tutor_data.profile.username;
                    if (_username === username) {
                        VCastUiManager.swalInfor("Username Exists", "Username exists, please choose another");
                        return true;
                    }
                } catch (e) {
                    return false;
                }

                return false;
            })

        });
    }
}/**
 *Created by darula
 *Created on 14/06/2020
 *Time: 19:47
 */

function Discover()
{
    Discover.prototype.init = function ()
    {
        loader.init();
        this.user_id = AuthManager.UID;
        this.env = the_env;

        console.log("Item is discover");
        //$('#main_container').html(`<div id="ftco-loader" style="justify-content: center" class="show fullscreen"><svg class="circular" width="48px" height="48px"><circle class="path-bg" cx="24" cy="24" r="22" fill="none" stroke-width="4" stroke="#eeeeee"/><circle class="path" cx="24" cy="24" r="22" fill="none" stroke-width="4" stroke-miterlimit="10" stroke="#F96D00"/></svg></div>`)
        $('#main_container').html(CreateProfile.discover());
        $('#login_space').html(VCastUiManager.renderLoginModal());

        discover.getTutors();

    }

    CreateProfile.discover = function ()
    {
        return `<div class="form-group">
            <input type="text" class="form-control">
            
            <div class="container" style="margin-top: 20px;">
                      <div class="card-deck" id="tutors">  
</div>


</div>
</div>`
    }

    /**
     *
     * @param param
     */
    Discover.prototype.searchTutor = function(param){
        firebaseApp.database().ref(`users`).once('value', (snapshot)=>{

            }
        )
    }

    Discover.prototype.getTutors = function ()
    {
        //$('#tutors').html(`<div id="ftco-loader" style="justify-content: center" class="show fullscreen"><svg class="circular" width="48px" height="48px"><circle class="path-bg" cx="24" cy="24" r="22" fill="none" stroke-width="4" stroke="#eeeeee"/><circle class="path" cx="24" cy="24" r="22" fill="none" stroke-width="4" stroke-miterlimit="10" stroke="#F96D00"/></svg></div>`)

        VCastUiManager.addIcon('tutors');
        firebaseApp.database().ref(`users`).once('value', (snapshot)=>{
            let tutors = snapshot.val();
            let keys = Object.keys(tutors);

            let is_tutor = true;

            keys.forEach((key, index)=>{
                let tutor_data = tutors[key];
                try
                {
                    let tutor_profile = tutor_data.profile;
                    let details = tutor_data.details;
                    let photo_url = details.photo_url;
                    let UID = details.UID;
                    if(UID === AuthManager.UID)
                    {
                        timer.countHours(true);
                    }
                    let first_name = tutor_profile.first_name;
                    let last_name = tutor_profile.last_name;
                    let bio = tutor_profile.short_bio;
                    let app_number = Discover.getNumber(tutor_profile.app_number);
                    let subjects = tutor_profile.subjects;
                    let subject_names = Discover.getSubjectNames(subjects);
                    let username = tutor_profile.username;

                    let subjects_string = "Tutors ";
                    subject_names.forEach((name, index)=>{
                        subjects_string += name + ", ";
                    })

                    subjects_string = subjects_string.substring(0, subjects_string.length - 2);

                    VCastUiManager.removeLoadingIcon();
                    $('#tutors').append(`<div class="row" style="margin-left: auto; margin-right: auto"><div class="card" style="width: 18rem">

<a href="discover?profile/${username}">
    <img class="card-img-top" src="${photo_url}" alt="Card image cap">
    <div class="card-body">
      <h5 class="card-title">${first_name + " " + last_name}</h5>
      <small style="color: rgb(59,57,57);; text-decoration: none">${subjects_string}</small>
      <p class="card-text">${bio}</p>
    </div>

</a>

    <div class="card-footer">
      <a href="https://wa.me/${app_number}"><ion-icon  style="float: left; color: #25D366; width: 40px; height: 40px; cursor: pointer;" name="logo-whatsapp"></ion-icon><a/>
       <a href="https://www.facebook.com/dialog/share?app_id=1748121785498328&display=popup&href=https://vcast.app/discover?profile/${username}
  &redirect_uri=https://vcast.app/discover?profile/${username}" target="_blank"><ion-icon  style="" class="footer_icons" name="logo-facebook"></ion-icon></a> 
         <a target="_blank" href="https://twitter.com/intent/tweet?text=Check%20out%20${username}%20on%20VCast%20https://vcast.app/discover?profile/${username}"><ion-icon class="footer_icons" name="logo-twitter" style="color: #10DFFD"></ion-icon></a>
         <a href="tel:+${app_number}"><ion-icon class="footer_icons" style="color: #2dc72d" name="call"></ion-icon></a>
    </div>

  </div></div>`)

                }

                catch (e)
                {
                    console.log(e.message);
                }
            });
        })
    }

    /**
     *
     * @param app_number
     */
    Discover.getNumber = function (app_number)
    {
        app_number = app_number.replace("+", "");
        if(app_number.length === 8)
            return `267${app_number}`;
        return app_number;

    }

    Discover.getSubjectNames = function (subjects)
    {
        let returnable = [];
        subjects.forEach((sub_number, index)=>{

            let subject = "Mathematics";
            switch (sub_number)
            {
                case "1":
                    subject = "BGCSE Mathematics";
                    break;
                case "2":
                    subject = "BGCSE Physics";
                    break;
                case "3":
                    subject = "BGCSE Chemistry";
                    break;
                case "4":
                    subject = "BGCSE Biology";
                    break;

                case "5":
                    subject = "IGCSE Mathematics";
                    break;
                case "6":
                    subject =  "IGCSE Physics";
                    break;
                case "7":
                    subject = "IGCSE Chemistry";
                    break;
                case "8":
                    subject = "IGCSE Biology"
                    break;

            }
            returnable.push(subject);
        })

        return returnable;
    }
}/**
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

let firebaseApp = firebase.initializeApp(Firebase.getInstance());function FirebasePubSub(env, lesson_id, user_id)
{
    this.env = env;
    this.lesson_id = lesson_id;
    this.user_id = AuthManager.UID;
    FirebasePubSub.IS_VCAST = false;
    FirebasePubSub.CONNECTED_DEVICES = 0;
    FirebasePubSub.FILE_EXISTS = false;
    FirebasePubSub.prototype.init = function()
    {
        this.user_id = AuthManager.UID;
        let url_string = window.location.href;
        let url = new URL(url_string);
        let lesson_id = url.searchParams.get("vsession");
        IntroManager.startBeforeSession();

        if(lesson_id)
        {
            $('#chat_toggle').show();

            $('#chat_toggle').click(()=>{
                $('#message_badge').text('0');
                $('#message_badge').hide();
            });
            firebase_pub_sub.fixElements();
            $('#text_arr_id').on('keypress', (e)=>{
                vcast_manager.saveTextToFirebase(e)
            }); //TODO, this should be in one class

            $('#starSession').off('click');
            $('#start_vcast').hide();

            $('#session_icon').css("color", "red");
            this.lesson_id = lesson_id;
            firebaseApp.database().ref(`lessons/${env}/${this.lesson_id}`).once('value',  (snapshot)=>
            {
                IntroManager.startAfterSession();
                console.log('Snapshot is', snapshot.val());
                let ownerId = snapshot.val().owner_id;
                group_chat.subscribeToMessages(env, AuthManager.UID, lesson_id);
                group_chat.init();
                $('#starSession').css("top", "0");
                firebase_pub_sub.initDevices(AuthManager.UID, env, lesson_id);
                vsession_actions_manager.init(lesson_id, env);
                $('#startButton').show();
                let is_owner = ownerId == AuthManager.UID ? "1" : "0";
                let owner = {
                    is_owner:is_owner,
                    owner_id:ownerId
                }
                video_stream.init(this.user_id, this.lesson_id, env, owner);
                video_stream.subscribeToOwner();
                VideoStream2.setIceConf();

                if(ownerId == AuthManager.UID)
                {
                    if(!FirebasePubSub.FILE_EXISTS)
                    {
                        firebase_pub_sub.initFileUploader();
                    }
                    let full_url = `https://vcast.app/cast?vsession=${lesson_id}`;
                    $('#whatsapp_share').attr("href", `whatsapp://send?text=Let's share a virtual whiteboard on VCast at ${full_url}`);
                    $('#mail_share').attr("href", `mailto:?body=Let's share a virtual whiteboard on VCast at ${full_url}&subject=Join my Live session on VCast`);
                    VCastUiManager.swalSuccess("You are in your session");
                    $('#whatsapp_share').show();
                    $('#mail_share').show();
                    $('#session_text').text("End VSession");


                    $('#starSession').click(()=>
                    {
                        $(window).off('beforeunload');
                        VCastUiManager.swalConfirm("Are you sure you want to end session?", "Failed to end session", ()=>{
                            VCastUiManager.swalSuccess("Successfully ended session!");
                            setTimeout(()=>{
                                window.location.replace("cast.html");
                            }, 1000)
                        })
                    })
                }

                else
                {
                    $('#trasher').remove(); //Remove the delete icon for others
                    VCastUiManager.swalSuccess("You are in an active session!");
                    $('#session_text').text("Exit VSession");
                    $('#starSession').click(()=>{
                        $(window).off('beforeunload');
                        VCastUiManager.swalConfirm("Are you sure you want to exit session?", "Failed to exit session", ()=>{
                            VCastUiManager.swalSuccess("Successfully ended session!");
                            setTimeout(()=>{
                                window.location.replace("cast.html");
                            }, 1000)
                        })
                    })
                }
            });


        }

        else
        {
            $('#starSession').click(()=>{
                firebase_pub_sub.startSession();
            })
        }
    };

    /**
     * Insert a button to initialize file uploads
     */
    FirebasePubSub.prototype.initFileUploader = function()
    {
        $(`<span id="file_upload_init" class="glyphicon glyphicon-file clickable" style="color: #a4a4a4;"></span>`).insertAfter('#toggle_drag1');
        file_upload_manager.init("upload_file_modal", "file_upload_init", firebase_pub_sub.uploadFile);
    };

    /**
     * Upload file callback function
     * @param file
     */
    FirebasePubSub.prototype.uploadFile = function(file)
    {
        let name = new Date().getTime() + file.name;
        let file_type = file.type;
        let content_type = VCastManager.CONTENT_TYPES.FILE_PRESENTATION;
        if(FileUploadManager.ALLOWED_IMAGES.includes(file_type))
        {
            content_type = VCastManager.CONTENT_TYPES.IMAGE;
        }

        else if(FileUploadManager.ALLOWED_VIDEOS.includes(file_type))
        {
            content_type = VCastManager.CONTENT_TYPES.VIDEO;
        }
        let path = `vsessions/${firebase_pub_sub.env}/${firebase_pub_sub.lesson_id}/files/${name}`;
        vcast_manager.uploadFile(path, file, FileUploadManager.progressHandler, (downloadUrl)=>{
            console.log(`File url ${downloadUrl}`);
            VCastUiManager.swalSuccess("Upload complete");
            FileUploadManager.resetUploadModal("upload_file_modal");
            let data = {
                url:downloadUrl,
                file_type:file_type,
                path:path
            }

            firebase_pub_sub.publish(data, "black", "30px", content_type);
            $('#file_upload_init').remove(); //TODO remove this:Currently uploads only one file
        })
    }

    FirebasePubSub.prototype.initDevices = function(user_id, env, lesson_id)
    {
        let devices_path = `lessons/${env}/${lesson_id}/devices`;
        let user_device_path = devices_path + `/${user_id}`;
        device_manager.subscribeToDeviceInformation(devices_path, (snapshot)=>{
            let connected_devices = snapshot.val();
            try
            {
                let keys = Object.keys(connected_devices);
                keys.forEach((key, index)=>{
                    let data = connected_devices[key];
                    let user_id_ = data.user_id;
                    let device_width = data.device_width;
                    if(data.connected == "1")
                    {
                        DeviceManager.updateConnectedDevices(user_id_, device_width, true);
                    }

                    else
                    {
                        DeviceManager.updateConnectedDevices(user_id_, device_width, false);
                    }
                });


            }

            catch (e)
            {
                console.log("Could not get device ionfor", e.message);
            }
        });

        device_manager.getAllConnectedDevices(devices_path, (snapshot)=>{

            try
            {
                let connected_devices = snapshot.val();
                let keys = Object.keys(connected_devices);
                keys.forEach((key, index)=>{
                    let data = connected_devices[key];
                    if(data.connected == "1")
                    {
                        let user_id_ = data.user_id;
                        let device_width = data.device_width;
                        DeviceManager.updateConnectedDevices(user_id_, device_width, true);
                    }
                });

            }

            catch (e)
            {
                console.log("No connected devices yet", e.message);
            }
        });
        device_manager.updateDeviceInformation(user_device_path, user_id, "1");

        $(window).on('unload', ()=>{
            device_manager.updateDeviceInformation(user_device_path, user_id, "0");
            return "Bye now!";
        });
    };

    /**
     * In a vcast call, fix some elements
     */
    FirebasePubSub.prototype.fixElements = function()
    {
        let window_height = $( window ).height();
        let scroll_up = $('#scroll_up');
        let scroll_down = $('#scroll_down');
        scroll_up.show();
        scroll_down.show();
        scroll_down.click(()=>{

            let y = $(window).scrollTop();
            $('html, body').animate({ scrollTop: y + 50 })
        });

        scroll_up.click(()=>{
            let y = $(window).scrollTop();
            $('html, body').animate({ scrollTop: y - 50 })
        });

        scroll_down.dblclick(()=>{
            let y = $(window).scrollTop();
            $('html, body').animate({ scrollTop: y + window_height/2 })
        });

        scroll_up.dblclick(()=>{
            let y = $(window).scrollTop();
            $('html, body').animate({ scrollTop: y - window_height/2 })
        });
        let canvas = document.getElementById("drawCanvas");
        canvas.height = 6000;
        $('#colorSwatch').css("position", "fixed");
        $('#tools').css("position", "fixed");
        $('#main_nav_cust').css("position", "fixed");
    };

    FirebasePubSub.prototype.startSession = function ()
    {
        $(window).off('beforeunload');
        //TODO Start the session in firebase
        try
        {
            let lesson_ref = firebaseApp.database().ref(`lessons/${this.env}`).push();
            let key = lesson_ref.key;
            let data = {
                owner_id:AuthManager.UID,
                time_created:new Date().getTime()
            };

            lesson_ref.update(data).then(()=>{
                let url = `?vsession=${key}`;
                window.location.replace(url);
            }).catch(()=>{
                VCastUiManager.swalWarning("Failed to start session, Please retry!");
            });
        }

        catch (e)
        {
            VCastUiManager.swalWarning("Failed to start session!");
        }
    };

    /**
     * Subscribe to the last data insert & delete
     */
    FirebasePubSub.prototype.subscribe = function ()
    {
        try
        {
            let latest_id_ref = firebaseApp.database().ref(`lessons/${this.env}/${this.lesson_id}/data`);
            latest_id_ref.limitToLast(1).on('child_added', function(snapshot) {
                console.log(snapshot.val());
                let data = snapshot.val();
                let key = snapshot.key;
                if(AuthManager.UID != data.publisher_id) //Draw if the publisher is not the subscriber
                {
                    VCastContentManager.renderContent(data, key);
                }

            });
        }

        catch (e)
        {
            console.log('error 33', e.message);
        }


        //subscribe to delete
        try
        {
            let delete_ref = firebaseApp.database().ref(`lessons/${this.env}/${this.lesson_id}/actions/delete_action`);
            delete_ref.on('value', (snapshot)=> {
                if(!snapshot.val())
                {
                    console.log('Nothimng here');
                    return;
                }
                console.log('delete data', snapshot.val());
                let actions = snapshot.val();
                if(actions.delete === "1")
                {
                    //clearCanvas(canvas);
                    VCastManager.clearScreen();
                    firebaseApp.database().ref(`lessons/${this.env}/${this.lesson_id}/actions/delete_action`).set(null); //remove the delete action
                    if(actions.delete_images === "1")
                    {
                        firebaseApp.database().ref(`lessons/${this.env}/${this.lesson_id}/data`).set(null);
                        $('.vsession_item').remove();
                        VSessionActionsManager.UNDO_BUFFER = [];//Clear the undo buffer
                    }

                    else
                    {
                        /**
                         * Remove all the content which is not images
                         */
                        firebaseApp.database().ref(`lessons/${this.env}/${this.lesson_id}/data`).orderByChild("content_type").equalTo(VCastManager.CONTENT_TYPES.TYPE_STROKE).set(null);
                        firebaseApp.database().ref(`lessons/${this.env}/${this.lesson_id}/data`).orderByChild("content_type").equalTo(VCastManager.CONTENT_TYPES.TYPE_TEXT).set(null);
                    }
                }
            });
        }
        catch (e)
        {
            console.log('error 33', e.message);
        }


    };

    FirebasePubSub.prototype.publish = function (data, color, size, content_type = null)
    {
        content_type = content_type === null ? VCastManager.CONTENT_TYPES.TYPE_STROKE : content_type; //TODO improve
        //TODO; Have a better implementation of this function
        try
        {
            let time = new Date().getTime();
            if(FirebasePubSub.IS_VCAST === false)
            {
                let data_ref = firebaseApp.database().ref(`lessons/${firebase_pub_sub.env}/${firebase_pub_sub.lesson_id}/data`);
                let new_data_ref = data_ref.push();
                new_data_ref.set({
                    color: color,
                    data: data,
                    publisher_id: firebase_pub_sub.user_id,
                    content_type:content_type,
                    size:size,
                    time: time
                })

                let data_key = new_data_ref.key;
                VSessionActionsManager.addDataKey(data_key)
                //firebaseApp.database().ref(`lessons/${firebase_pub_sub.env}/${firebase_pub_sub.lesson_id}/data`).push()
            }

            else
            {
                if(VCastManager.VCAST_ID === null)
                {
                    console.log('The vcast id is null');
                    return;
                }
                if(!data)
                {
                    console.log('data is null in  pub nub!!');
                    return;
                }

                content_type = content_type === null ? VCastManager.CONTENT_TYPES.TYPE_STROKE : content_type; //TODO improve
                firebaseApp.database().ref(`vcasts/${this.env}/${VCastManager.VCAST_ID}/data/${time}`).set({
                    color: color,
                    data: data,
                    publisher_id: this.user_id,
                    size:size,
                    time: time,
                    content_type:content_type
                });


            }
        }

        catch (e) {
            console.log("E40", e.message);
        }

    };


    FirebasePubSub.prototype.deleteWholeData = function(canvas, delete_images = "0")
    {
        try
        {
            firebaseApp.database().ref(`lessons/${this.env}/${this.lesson_id}/actions/delete_action`).set(
                {
                    delete:"1", delete_images:delete_images}
                );
            //clearCanvas(canvas);
            VCastManager.clearScreen();
            VSessionActionsManager.UNDO_BUFFER = [];
            if(delete_images === "1")
            {
                $('.vsession_item').remove();
            }
        }

        catch (e)
        {
            VCastUiManager.swalWarning("Failed to delete data, check the connection!");
            console.log('Failed delete', e.message);
        }

    };


    FirebasePubSub.prototype.drawFromHistory = function ()
    {
        try {
            let history_ref = firebaseApp.database().ref(`lessons/${this.env}/${this.lesson_id}/data`);
            history_ref.once('value', function (snapshot) {

                let obj = snapshot.val();
                if (!obj) {
                    console.log('in draw from histoty');
                    return;
                }
                let keys = Object.keys(obj);
                console.log('keys are', keys);
                keys.forEach((key, index) => {
                    let data = obj[key];
                    console.log('points', data);
                    console.log('we herte');

                    //drawOnCanvas(data.color, data.plots, ctx);
                    VCastContentManager.renderContent(data, key);
                });

            });
        } catch (e) {
            console.log('error, number', e.message);
        }
    };

}

function clearCanvas(canvas)
{
    try
    {
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    catch (e)
    {
        console.log("No canvas");
    }

}

function drawOnCanvas(color, plots, ctx)
{
    try
    {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(plots[0].x, plots[0].y);

        for(var i=1; i<plots.length; i++) {
            ctx.lineTo(plots[i].x, plots[i].y);
        }
        ctx.stroke();
    }

    catch (e)
    {
        console.log('Could not stroke');
    }
}

function strokeTextOnCanvas(data)
{
    try
    {
        let canvas = document.getElementById("drawCanvas");
        let ctx = canvas.getContext("2d");
        let text = data.text;
        let x = data.position.x;
        let y = data.position.y + 41;
        ctx.font = "30px Arial";
        ctx.fillText(text, x, y)
    }

    catch (e) {
        console.log("Could not draw text")
    }
}

function toggleClickableActive(elem)
{
    elem.toggleClass("clickable_active");

}

function startCanvas()
{
    VCastContentManager.ACTIVE_CONTENT = VCastContentManager.CONTENT_TYPES.FREE_HAND;
    let canvas = document.getElementById('drawCanvas');
    let ctx = canvas.getContext('2d');
    let color = document.querySelector(':checked').getAttribute('data-color');
    $('#text_arr_id').css("color", color);
    let past_color = color;
    var plots = [];

    canvas.width = Math.min(document.documentElement.clientWidth, window.innerWidth || 300);
    canvas.height = Math.min(document.documentElement.clientHeight, window.innerHeight || 300);
    console.log('start canvas called 212121');

    ctx.strokeStyle = color;
    ctx.lineWidth = '3';
    ctx.lineCap = ctx.lineJoin = 'round';
    let current_user_conf = {
        line_width:ctx.lineWidth,
        color:color
    };


    function inActivateTextElement()
    {
        let elem = $('#drawCanvas');
        $('#toggle_drag1').removeClass("clickable_active");
        elem.off('click touchstart');
        elem.css("cursor", "");
        $('#text_arr_id').remove();

    }

    function inActivateEraser()
    {
        $('#eraser_').removeClass("clickable_active");
    }

    function updateCurrentUserConf(color, line_width)
    {
        current_user_conf.line_width = line_width;
        current_user_conf.color = color;
    }

    function appendStuff(e, elem)
    {
        $('#text_arr_id').off('click');
        $('#text_arr_id').remove();
        let total_width = $( window ).width();

        let x = e.pageX;
        let y = e.pageY;
        let left = x + "px";
        let top = y + "px";
        let text_arr_width = (total_width - x-10) + "px";
        $('body').append(`
                    <textarea id="text_arr_id" rows="1" style="width: ${text_arr_width}; top:${top}; left: ${left}; position: absolute; font-size: 30px;" onclick="this.focus()"></textarea>
                    `);
        $('#text_arr_id').focus();

        $('#text_arr_id').on('keypress', (e)=>{
            vcast_manager.saveTextToFirebase(e, x, y)
        });
    }

    $("#toggle_drag1").on('click',()=>{
        let elem = $('#drawCanvas');
        let toggler = $('#toggle_drag1');
        toggleClickableActive(toggler);

        inActivateEraser();

        if((elem.css("cursor") == "text"))
        {
            elem.off('click touchstart'); //remove the click event from the canvas
            elem.css("cursor", "");
            $('#text_arr_id').remove();//Remove the text area thingy
        }
        else
        {
            elem.css("cursor", "text");

            try
            {
                elem.on('click', (ev)=>{
                    if($('#drawCanvas').css("cursor") == "text")
                    {
                        appendStuff(ev, elem);
                    }
                });

                elem.on('touchstart', (ev)=>{
                    if($('#drawCanvas').css("cursor") == "text")
                    {
                        appendStuff(ev.touches[0], elem);
                    }
                });
            }

            catch (e) {


            }
        }
    });

    /* Mouse and touch events */

    document.getElementById('colorSwatch').addEventListener('click', function(e)
    {
        $('#eraser_').removeClass("clickable_active");
        inActivateTextElement();
        if(ctx.lineWidth == '30') //do nothing when the eraser is on
        {
            ctx.lineWidth = '3'; //reset the pen
        }
        color = document.querySelector(':checked').getAttribute('data-color');
        past_color = color; //update the past color
        updateCurrentUserConf(color, ctx.lineWidth);
    }, false);

    $('#tools .tools').on('click', function(){
        console.log($(this));
        let action = $(this)[0].dataset.content;
        console.log(action);
        switch (action)
        {
            case "delete":
                if(FirebasePubSub.IS_VCAST)
                {
                    vcast_manager.insertPageBreak();
                    break;
                }
                else
                {
                    firebase_pub_sub.deleteWholeData(canvas, "1");
                    /*Swal.fire({
                        title: 'Preserve images?',
                        input: 'checkbox',
                        inputPlaceholder: 'Keep Images'
                    }).then(function(result) {
                        if (result.value) {
                            Swal.fire({icon: 'success', text: 'Images will not be deleted!'});
                            firebase_pub_sub.deleteWholeData(canvas, "0");

                        } else if (result.value === 0) {
                            Swal.fire({icon: 'success', text: "Images will be deleted :("});
                            firebase_pub_sub.deleteWholeData(canvas, "1");

                        } else {
                            console.log(`Dismissed ${result.dismiss}`)
                        }
                    })*/
                }
                break;

            case "eraser":
                $('#drawCanvas').css("cursor", "");
                let eraser = $('#eraser_');
                inActivateTextElement();
                if(ctx.lineWidth == '30')
                {
                    ctx.lineWidth = '3';
                    color = past_color;
                    eraser.removeClass("clickable_active");
                }
                else
                {
                    ctx.lineWidth = '30';
                    color = 'white';
                    eraser.addClass("clickable_active");
                }
                break;
            default:
                console.log("Caught");
        }

        updateCurrentUserConf(color, ctx.lineWidth);
    });
    let isTouchSupported = 'ontouchstart' in window;
    let isPointerSupported = navigator.pointerEnabled;
    let isMSPointerSupported =  navigator.msPointerEnabled;

    let downEvent = isTouchSupported ? 'touchstart' : (isPointerSupported ? 'pointerdown' : (isMSPointerSupported ? 'MSPointerDown' : 'mousedown'));
    let moveEvent = isTouchSupported ? 'touchmove' : (isPointerSupported ? 'pointermove' : (isMSPointerSupported ? 'MSPointerMove' : 'mousemove'));
    let upEvent = isTouchSupported ? 'touchend' : (isPointerSupported ? 'pointerup' : (isMSPointerSupported ? 'MSPointerUp' : 'mouseup'));

    canvas.addEventListener(downEvent, startDraw, false);
    canvas.addEventListener(moveEvent, draw, false);
    canvas.addEventListener(upEvent, endDraw, false);

    /* Draw on canvas */

    function drawOnCanvas(color, plots)
    {
        try
        {
            color = current_user_conf.color;
            ctx.strokeStyle = color;
            ctx.lineWidth = current_user_conf.line_width;
            ctx.beginPath();
            ctx.moveTo(plots[0].x, plots[0].y);

            for(var i=1; i<plots.length; i++) {
                ctx.lineTo(plots[i].x, plots[i].y);
            }
            ctx.stroke();
        }

        catch (e)
        {
            console.log("Cannot stroke: ", e.message);
        }

    }

    var isActive = false;

    function draw(e) {
        e.preventDefault(); // prevent continuous touch event process e.g. scrolling!
        if(!isActive) return;

        var x = isTouchSupported ? (e.targetTouches[0].pageX - canvas.offsetLeft) : (e.offsetX || e.layerX - canvas.offsetLeft);
        var y = isTouchSupported ? (e.targetTouches[0].pageY - canvas.offsetTop) : (e.offsetY || e.layerY - canvas.offsetTop);

        plots.push({x: (x << 0), y: (y << 0)}); // round numbers for touch
        drawOnCanvas(color, plots);
    }

    function startDraw(e) {
        e.preventDefault();
        isActive = true;
    }

    function endDraw(e)
    {
        e.preventDefault();
        isActive = false;
        firebase_pub_sub.publish(plots, color, ctx.lineWidth);

        plots = [];
    }
}
/*(function() {
    /* Canvas */


//})();



function Peer(user_id, initiator)
{
    console.log('In create peer; user id is: ', user_id);

    Peer.prototype.init = function (stream)
    {
        this.peer_id = null;

        const iceConfiguration = VideoStream2.ICE_CONF;//TODO Check if ice was set
        this.peer= new SimplePeer({
            initiator: initiator=== "1",
            trickle: false,
            stream:stream,
            config: {
                iceServers: iceConfiguration
            }
        });

        console.log('created $peer', user_id);
        this.peer.on('connect', ()=>
        {
            console.log(`${this.peer_id} connected`);
            this.connected = true;
        });

        this.peer.on('error', (e)=>
        {
            console.log('an error occured: ', e);
            VCastUiManager.swalWarning("Call disconnected");
        });

        this.peer.on('close', ()=>{
            VCastUiManager.swalWarning("Someone left");
        })

        this.peer.on('destroy', ()=>{
            console.log("Peer destryed");
        })
    };

    Peer.prototype.setPeerId = function (peer_id) {
        this.peer_id = peer_id;
    };

    Peer.prototype.getPeer = function () {
        return this.peer;
    };

    Peer.prototype.getIsInitiator = function()
    {
        return this.peer.initiator;
    };

    Peer.prototype.getPeerId = function () {
        return this.peer_id;
    };

}

let remote_peer_ids =[];

let localStream;


function VideoStream2()
{
    let peer;
    this.user_id = AuthManager.UID;
    VideoStream2.FOUND_USERS_IDS = []; //The ids of the users found on the conference
    VideoStream2.ICE_CONF = null;
    this.remote_exists = false;
    VideoStream2.PEERS = [];
    this.connected_peer_ids = [];

    let sound = new Audio("https://vcast.app/static/assets/sounds/call.mp3");

    const startButton = document.getElementById('startButton');
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    let startTime;
    VideoStream2.prototype.init = async function (user_id, lesson_id, env, initiator)
    {
        this.user_id = user_id;
        this.lesson_id = lesson_id;
        this.env = env;
        this.is_owner = initiator.is_owner;
        this.owner_id = initiator.owner_id;
        startButton.addEventListener('click', video_stream.start);
        //callButton.addEventListener('click', call);

        $(window).on('beforeunload', function(){
            return 'Are you sure you want to leave?';
        });

        $(window).on('unload', ()=>{
            this.removeFromFirebase(peer);
            return 'Goodbye user';
        });

        draggable.init('video_sources', 'draggable_videos');

    };


    VideoStream2.setIceConf = function()
    {
        if(video_stream.env === "test")
        {
            VideoStream2.ICE_CONF = [{
                urls: [ "stun:u3.xirsys.com" ]
            }, {
                username: "HTF1rSDhJZsA4bt5IiiEWD3igvc-xg10eepSExfsZJkRyPxquIfLfsQP1-bAlDXwAAAAAF6PBs1vbWJlZHpp",
                credential: "334894c0-7a55-11ea-9c45-8a42fc970248",
                urls: [
                    "turn:u3.xirsys.com:3478?transport=udp",
                    "turn:u3.xirsys.com:3478?transport=tcp",
                    "turns:u3.xirsys.com:443?transport=tcp",
                    "turns:u3.xirsys.com:5349?transport=tcp"
                ]
            }];
            return;
        }
        $.post('https://test.abstractclassa.com/endpoints/core/twilio/client.php', {get_ice:'true'},
            function(data)
            {
                try
                {
                    let json = jQuery.parseJSON(data);
                    console.log(`processed`, json);
                    VideoStream2.ICE_CONF = json.ice;
                }

                catch (e) {
                    console.log(`could not get ice`, e.message);
                    VideoStream2.ICE_CONF = [{
                        urls: [ "stun:u3.xirsys.com" ]
                    }, {
                        username: "HTF1rSDhJZsA4bt5IiiEWD3igvc-xg10eepSExfsZJkRyPxquIfLfsQP1-bAlDXwAAAAAF6PBs1vbWJlZHpp",
                        credential: "334894c0-7a55-11ea-9c45-8a42fc970248",
                        urls: [
                            "turn:u3.xirsys.com:3478?transport=udp",
                            "turn:u3.xirsys.com:3478?transport=tcp",
                            "turns:u3.xirsys.com:443?transport=tcp",
                            "turns:u3.xirsys.com:5349?transport=tcp"
                        ]
                    }];
                }

            })
    }


    /**
     *
     */
    VideoStream2.prototype.hangUp = function ()
    {
        //First destroy all connected peers
        video_stream.connected_peer_ids.forEach((peer_id, index)=>{
            VideoStream2.PEERS[peer_id].getPeer().destroy();
        });

        //Remove the tracks
        localStream.getTracks().forEach(function(track) {
            track.stop();
        });

        //hide the videos
        $('#localVideo').hide();
        $('#remoteVideo').hide();

        //Remove the red button class
        $('#startButton').removeClass("call_hung_up");
        $('#startButton').css("color", "#25D366");


        //TODO:: Remove from firebase;
        try
        {
            firebaseApp.database().ref(`lessons/${video_stream.env}/${video_stream.lesson_id}/video/participants/${AuthManager.UID}`).set(null);
            if(video_stream.is_owner === "1") //if the user is the owner remove them
            {
                firebaseApp.database().ref(`lessons/${video_stream.env}/${video_stream.lesson_id}/video/owner`).set(null);
                firebaseApp.database().ref(`lessons/${video_stream.env}/${video_stream.lesson_id}/video/participants`).set(null);//remove all the participants if is owner
            }
            $(window).off('beforeunload');
            window.location.reload();
        }

        catch (e)
        {
            console.log('Could not remove call@!!');
        }

    }



    VideoStream2.prototype.start = async function()
    {
        $('#localVideo').show();
        $('#remoteVideo').show();
        timer.init();

        const constraints = {
            width: {min: 320, ideal: 320},
            height: {min: 240, ideal: 240},
            advanced: [
                {width: 320, height: 240},
                {aspectRatio: 1.33}
            ]
        };

        if($('#startButton').hasClass("call_hung_up"))
        {
            //TODO: Destry peers thgen clear the video window
            video_stream.hangUp();
            timer.saveDuration();
            return;
        }

        $('#startButton').css("color", "");
        $('#startButton').toggleClass("call_hung_up");
        console.log('Requesting local stream');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
            console.log('Received local stream');
            localVideo.srcObject = stream;
            localStream = stream;
        } catch (e)
        {
            VCastUiManager.swalWarning('Please give permissions to access camera!');
            console.log(`getUserMedia() error: ${e.name}`);
        }

        startButton.disabled = true;
        console.log('Starting call');
        startTime = window.performance.now();
        const videoTracks = localStream.getVideoTracks();
        const audioTracks = localStream.getAudioTracks();
        if (videoTracks.length > 0) {
            console.log(`Using video device: ${videoTracks[0].label}`);
        }
        if (audioTracks.length > 0) {
            console.log(`Using audio device: ${audioTracks[0].label}`);
        }

        localStream.getVideoTracks()[0].applyConstraints(constraints)
            .then(()=>{
                console.log('constraints applied')
            }).catch((e)=>{
                console.log("Could not apply constraints", e.message);
        })

        await video_stream.initializePeers(localStream);

    };



    VideoStream2.prototype.removeFromFirebase = function(peer)
    {
        if(peer.getPeer().initiator) //if its the initiator, disconnect everyone
        {
            firebaseApp.database().ref(`lessons/${this.env}/${this.lesson_id}/video/participants`).set(null); //
        }
    };



    /**
     * Get the connected user Ids,this method should run once
     * Each peer should get the number of connected user IDS they find
     * TODO:Connected users should be managed in a separate class
     */
    VideoStream2.prototype.getConnectedUserIds = function ()
    {
        try
        {
            let ref = firebaseApp.database().ref(`lessons/${video_stream.env}/${video_stream.lesson_id}/video/participants`);
            return ref.once('value').then((snapshot)=>
            {
                console.log('connected devices snapshot is: ', snapshot)
                let connected = snapshot.val();
                let returnable = [];
                let keys = Object.keys(connected);
                keys.forEach((key, index)=>{
                    let user_id = key;
                    if(user_id !== AuthManager.UID)
                    {
                        returnable.push(user_id);
                    }
                })
                return returnable;
            }).catch((e)=>{
                console.log("error getting connected devices", e.message);
                return [];
            })


        }

        catch (e)
        {
            console.log("Could not get connected users!!", e.message)
        }
    }

    /**
     * Initialize the peers looking at the number of connected people already existing
     * @param localStream
     */
    VideoStream2.prototype.initializePeers = async function (localStream)
    {
        video_stream.subscribeToMyCalls(localStream); //subscribe to my calls
        let connected_ids = await video_stream.getConnectedUserIds();
        video_stream.connected_peer_ids = connected_ids;

        if(connected_ids.length === 0) //This is the first person to connect, make them listen to other peers
        {
            let owner_data = {
                owner:"1",
                user_id:AuthManager.UID,
                initiator:"0",
            }

            firebaseApp.database().ref(`lessons/${video_stream.env}/${video_stream.lesson_id}/video/owner`).set(owner_data);
        }

        else
        {
            //Send a request to all other peers
            for(let i = 0; i < connected_ids.length; i++)
            {
                let user_id = connected_ids[i];
                let peer  = new Peer(AuthManager.UID, "1");
                peer.init(localStream);
                VideoStream2.PEERS[user_id] = peer;
                VideoStream2.PEERS[user_id].getPeer().on('signal', (data)=>{
                    let udp_id = JSON.stringify(data);

                    let to = {
                        user_id:AuthManager.UID,
                        initiator:"1",
                        udp_id:udp_id,
                        is_owner:video_stream.is_owner
                    }

                    video_stream.saveToFirebase(user_id, to);
                });

                VideoStream2.PEERS[user_id].getPeer().on('stream', (stream)=>
                {
                    if (user_id === video_stream.owner_id) //Always display the owner video
                    {
                        remoteVideo.srcObject = stream;
                    }
                    else if(!video_stream.remote_exists)
                    {
                        remoteVideo.srcObject = stream;
                        video_stream.remote_exists = true;
                    }
                    console.log(`Stream from ${user_id}`, stream);
                });

            }




        }
    }

    /**
     *
     * @param user_id
     * @param data
     */
    VideoStream2.prototype.saveToFirebase = function (user_id, data)
    {
        firebaseApp.database().ref(`lessons/${video_stream.env}/${video_stream.lesson_id}/video/participants/${user_id}`).push(data);
    };


    /**
     *
     * @param localStream
     */
    VideoStream2.prototype.subscribeToMyCalls = function (localStream)
    {
        video_stream.subscribeToOwner();
        let latest_id_ref = firebaseApp.database().ref(`lessons/${video_stream.env}/${video_stream.lesson_id}/video/participants/${AuthManager.UID}`);
        latest_id_ref.limitToLast(1).on('child_added', function(snapshot)
        {
            //Check if a peer exists
            let data = snapshot.val();
            let user_id = data.user_id;
            let udp_id = data.udp_id;
            let is_owner = data.is_owner;
            if(VideoStream2.PEERS[user_id])
            {
                VideoStream2.PEERS[user_id].getPeer().signal(udp_id);
            }

            else
            {
                //Answer a call to them you are not an initiator
                let peer  = new Peer(AuthManager.UID, "0");
                peer.init(localStream);
                VideoStream2.PEERS[user_id] = peer;
                VideoStream2.PEERS[user_id].getPeer().on('signal', (data)=>
                {
                    let udp_id = JSON.stringify(data);

                    let to = {
                        user_id:AuthManager.UID,
                        initiator:"0",
                        udp_id:udp_id,
                        is_owner:video_stream.is_owner
                    }

                    video_stream.saveToFirebase(user_id, to);
                });

                VideoStream2.PEERS[user_id].getPeer().on('stream', (stream)=>
                {
                    if(is_owner === "1")
                    {
                        remoteVideo.srcObject = stream; //always display the owner in the remove video;
                    }

                    else if(!video_stream.remote_exists)
                    {
                        remoteVideo.srcObject = stream;
                        video_stream.remote_exists = true;
                    }
                    console.log(`Stream from ${user_id}`, stream);
                });

            }

        });
    }

    /**
     * Subscribe to the ownwr
     */
    VideoStream2.prototype.subscribeToOwner = function ()
    {
        //Attempt to call the initiator if they exist
        let initiator_ref = firebaseApp.database().ref(`lessons/${this.env}/${this.lesson_id}/video/owner`);
        initiator_ref.on('value', (snapshot)=>
        {
            try
            {
                if(snapshot.exists())
                {
                    if(snapshot.val())
                    {
                        let initiator = snapshot.val();
                        let user_id = initiator.user_id;
                        $('#startButton').show();
                        if(user_id !== AuthManager.UID)
                        {
                            let peer  = new Peer(AuthManager.UID, "1");
                            peer.init(localStream);
                            VideoStream2.PEERS[user_id] = peer;
                            VideoStream2.PEERS[user_id].getPeer().on('signal', (data)=> {
                                let udp_id = JSON.stringify(data);

                                let to = {
                                    user_id: AuthManager.UID,
                                    initiator: "1",
                                    udp_id: udp_id,
                                    is_owner:video_stream.is_owner
                                }

                                video_stream.saveToFirebase(user_id, to);
                            });

                            VideoStream2.PEERS[user_id].getPeer().on('stream', (stream)=>
                            {
                                console.log(`In owner listener!!`);
                                remoteVideo.srcObject = stream; //the remote person is the owner, always display the ownwr in the remove video
                                console.log(`Stream from ${user_id}`, stream);
                            });
                            //TODO: Show the start button for the subscriber;
                            $('#startButton').show(); //TODO; Improve code, this should come as a callback
                            $("#startButton").animate({transform: "translateY(4px);"});
                            $("#startButton").animate({transform: "translateY(-4px);"});

                            sound.play().then(()=>{
                                console.log("Playing sound")
                            }).catch(()=>{
                                console.log("Could not play sound")
                            });

                            initiator_ref.remove(); //remove the initiator
                        }

                        else
                        {
                            console.log("You are the fucking initiator");
                        }

                    }

                    else
                    {
                        console.log("No value")
                    }
                }

                else
                {
                    console.log("No snapshot")
                }
            }

            catch (e)
            {
                console.log("Initiator removed or doesnt exist. ", e.message)
            }
        })
    }

}
/**
 *Created by darula
 *Created on 22/06/2020
 *Time: 07:13
 */

function Index()
{
    Index.renderIndex = function ()
    {
        return `  <nav class="navbar navbar-expand-lg navbar-dark ftco_navbar bg-dark ftco-navbar-light" id="ftco-navbar">
    <div class="container">
      <a class="navbar-brand" href="index.html">VCast</a>
      <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#ftco-nav" aria-controls="ftco-nav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="oi oi-menu"></span> Menu
      </button>

      <div class="collapse navbar-collapse" id="ftco-nav">
        <ul class="navbar-nav ml-auto">
          <li class="nav-item active"><a href="index.html" class="nav-link">Home</a></li>
          <li class="nav-item"><a href="#features" class="nav-link">Features</a></li>
          <li class="nav-item"><a href="#contacts_footer" class="nav-link">Contact</a></li>
          <li class="nav-item cta"><a href="discover?create" class="nav-link"><span>Find A tutor</span></a></li>
        </ul>
      </div>
    </div>
  </nav>
    <!-- END nav -->
    
    <!-- <div class="js-fullheight"> -->
    <div class="hero-wrap js-fullheight">
      <div class="overlay"></div>
      <div id="particles-js"></div>
      <div class="container">
        <div class="row no-gutters slider-text align-items-center justify-content-center" data-scrollax-parent="true">
          <div class="col-md-6 ftco-animate text-center" data-scrollax=" properties: { translateY: '70%' }">
            <h1 class="mb-4" data-scrollax="properties: { translateY: '30%', opacity: 1.6 }"><strong>Learn and Teach with VCast</strong></h1>
            <p data-scrollax="properties: { translateY: '30%', opacity: 1.6 }"><a href="discover.html" class="btn btn-primary btn-outline-white px-5 py-3">Find a Tutor</a></p>
            <p data-scrollax="properties: { translateY: '30%', opacity: 1.6 }"><a href="discover?create" class="btn btn-primary btn-outline-white px-5 py-3">Tutor Profile</a></p>
          </div>
        </div>
      </div>
    </div>
    

    
  
    <section class="ftco-section" id="features">
      <div class="container">
        <div class="row justify-content-center mb-5 pb-5">
          <div class="col-md-6 text-center heading-section ftco-animate">
            <span class="subheading">VCast Features</span>
            <h2 class="mb-4">Welcome to the Netflix of Tutoring</h2>
            <p>Online Tutoring made easy. </p>
          </div>
        </div>
        <div class="row">
          <div class="col-md-6 col-lg-3 d-flex align-self-stretch ftco-animate">
            <div class="media block-6 services d-block text-center">
              <div class="d-flex justify-content-center"><div class="icon color-3 d-flex justify-content-center mb-3"><span class="align-self-center icon-laptop"></span></div></div>
              <div class="media-body p-2 mt-3">
                <h3 class="heading">Virtual Whiteboard</h3>
                <p>Share a live Virtual whiteboard with an unlimited number of people.</p>
              </div>
            </div>      
          </div>
          <div class="col-md-6 col-lg-3 d-flex align-self-stretch ftco-animate">
            <div class="media block-6 services d-block text-center">
              <div class="d-flex justify-content-center"><div class="icon color-1 d-flex justify-content-center mb-3"><span class="align-self-center icon-chat"></span></div></div>
              <div class="media-body p-2 mt-3">
                <h3 class="heading">Chat</h3>
                <p>Real Time group chat with an unlimited number of peers.</p>
              </div>
            </div>      
          </div>
          <div class="col-md-6 col-lg-3 d-flex align-self-stretch ftco-animate">
            <div class="media block-6 services d-block text-center">
              <div class="d-flex justify-content-center"><div class="icon color-2 d-flex justify-content-center mb-3"><span class="align-self-center icon-video-camera"></span></div></div>
              <div class="media-body p-2 mt-3">
                <h3 class="heading">Video Call</h3>
                <p>Peer to peer Private Video call to discuss whatever that you desire.</p>
              </div>
            </div>    
          </div>

          <div class="col-md-6 col-lg-3 d-flex align-self-stretch ftco-animate">
            <div class="media block-6 services d-block text-center">
              <div class="d-flex justify-content-center"><div class="icon color-4 d-flex justify-content-center mb-3"><span class="align-self-center icon-live_help"></span></div></div>
              <div class="media-body p-2 mt-3">
                <h3 class="heading">Help &amp; Supports</h3>
                <p>For VCast Premium clients only. See the <a href="#contacts_footer">Contacts</a> to get started .</p>
              </div>
            </div>      
          </div>
        </div>
      </div>
    </section>


    <footer class="ftco-footer ftco-bg-dark ftco-section" id="contacts_footer">
      <div class="container">
        <div class="row mb-5">
          <div class="col-md">
            <div class="ftco-footer-widget mb-4">
              <h2 class="ftco-heading-2">VCast</h2>
              <p>VCast is the next generation E Learning platform. With the world going real time, We are more than happy to have you aboard.</p>
            </div>
          </div>
          <div class="col-md">
            <div class="ftco-footer-widget mb-4 ml-5">
              <h2 class="ftco-heading-2">Quick Links</h2>
              <ul class="list-unstyled">
                <li><a href="#" class="py-2 d-block">Home</a></li>
                <li><a href="#features" class="py-2 d-block">Features</a></li>
                <li><a href="https://abstractclass.co" target="_blank" class="py-2 d-block">About</a></li>
                <li><a href="#" class="py-2 d-block">Contact</a></li>
              </ul>
            </div>
          </div>
          <div class="col-md">
             <div class="ftco-footer-widget mb-4">
              <h2 class="ftco-heading-2">Contact Information</h2>
              <ul class="list-unstyled">
                <li><a href="#" class="py-2 d-block">Plot 69184, Block 8, Gaborone, Botswana Innovation Hub Science and Technology Park</a></li>
                <li><a href="#" class="py-2 d-block">+267 73867278</a></li>
                <li><a href="#" class="py-2 d-block">info@abstractclass.co</a></li>
                <li><a href="#" class="py-2 d-block">sales@abstractclass.co</a></li>
              </ul>
            </div>
          </div>
          <div class="col-md">
            <div class="ftco-footer-widget mb-4">
              <ul class="ftco-footer-social list-unstyled float-md-left float-lft">
                <li class="ftco-animate"><a href="#"><span class="icon-twitter"></span></a></li>
                <li class="ftco-animate"><a href="https://fb.me/vcastbw" target="_blank"><span class="icon-facebook"></span></a></li>
                <li class="ftco-animate"><a href="https://www.instagram.com/abstractclassbw" target="_blank"><span class="icon-instagram"></span></a></li>
              </ul>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12 text-center">

            <p><!-- Link back to Colorlib can't be removed. Template is licensed under CC BY 3.0. -->
  Copyright &copy;<script>document.write(new Date().getFullYear());</script> All rights reserved | VCast is a product of <a href="https://abstractclass.co" target="_blank">Abstract Class</a>

          </div>
        </div>
      </div>
    </footer>
    
  

  <!-- loader -->
  <div id="ftco-loader" class="show fullscreen"><svg class="circular" width="48px" height="48px"><circle class="path-bg" cx="24" cy="24" r="22" fill="none" stroke-width="4" stroke="#eeeeee"/><circle class="path" cx="24" cy="24" r="22" fill="none" stroke-width="4" stroke-miterlimit="10" stroke="#F96D00"/></svg></div>`

    }
}$(document).ready(function(){

    $('.chat_head').click(function(){
        $('.chat_body').slideToggle('slow');
    });
    $('.msg_head').click(function(){
        $('.msg_wrap').slideToggle('slow');
    });

    $('.close').click(function(){
        $('.msg_box').hide();
    });

    $('.user').click(function(){

        $('.msg_wrap').show();
        $('.msg_box').show();
    });

});/**
 *
 */

/*
*  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
*
*  Use of this source code is governed by a BSD-style license
*  that can be found in the LICENSE file in the root of the source
*  tree.
*/

'use strict';

/*const videoElement = document.getElementById('vcast_source');
const audioInputSelect = document.querySelector('select#audioSource');
const audioOutputSelect = document.querySelector('select#audioOutput');
const videoSelect = document.querySelector('select#videoSource');
const selectors = [audioInputSelect, audioOutputSelect, videoSelect];
let chunks = [];
let recordedVideo;
let globalwindow = window;
//audioOutputSelect.disabled = !('sinkId' in HTMLMediaElement.prototype);

function gotDevices(deviceInfos) {
    // Handles being called several times to update labels. Preserve values.
    const values = selectors.map(select => select.value);
    selectors.forEach(select => {
        while (select.firstChild) {
            select.removeChild(select.firstChild);
        }
    });
    for (let i = 0; i !== deviceInfos.length; ++i) {
        const deviceInfo = deviceInfos[i];
        const option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === 'audioinput') {
            option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
            audioInputSelect.appendChild(option);
        } else if (deviceInfo.kind === 'audiooutput') {
            option.text = deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
            audioOutputSelect.appendChild(option);
        } else if (deviceInfo.kind === 'videoinput') {
            option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
            videoSelect.appendChild(option);
        } else {
            console.log('Some other kind of source/device: ', deviceInfo);
        }
    }
    selectors.forEach((select, selectorIndex) => {
        if (Array.prototype.slice.call(select.childNodes).some(n => n.value === values[selectorIndex])) {
            select.value = values[selectorIndex];
        }
    });
}


// Attach audio output device to video element using device/sink ID.
function attachSinkId(element, sinkId) {
    if (typeof element.sinkId !== 'undefined') {
        element.setSinkId(sinkId)
            .then(() => {
                console.log(`Success, audio output device attached: ${sinkId}`);
            })
            .catch(error => {
                let errorMessage = error;
                if (error.name === 'SecurityError') {
                    errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
                }
                console.error(errorMessage);
                // Jump back to first output device in the list as it's the default.
                audioOutputSelect.selectedIndex = 0;
            });
    } else {
        console.warn('Browser does not support output device selection.');
    }
}

function changeAudioDestination() {
    const audioDestination = audioOutputSelect.value;
    attachSinkId(videoElement, audioDestination);
}



function handleError(error) {
    console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}



audioInputSelect.onchange = start;
audioOutputSelect.onchange = changeAudioDestination;

videoSelect.onchange = start;



function start()
{
    const audioSource = audioInputSelect.value;
    const videoSource = videoSelect.value;
    const constraints = {
        audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
        video: {deviceId: videoSource ? {exact: videoSource} : undefined}
    };

    //handle older browsers that might implement getUserMedia in some way
    if (navigator.mediaDevices === undefined) {
        navigator.mediaDevices = {};
        navigator.mediaDevices.getUserMedia = function(constraints) {
            let getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
            if (!getUserMedia) {
                return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
            }
            return new Promise(function(resolve, reject) {
                getUserMedia.call(navigator, constraints, resolve, reject);
            });
        }
    }else{
        navigator.mediaDevices.enumerateDevices()
            .then(gotDevices)
            .catch(err=>{
                console.log(err.name, err.message);
            });
    }

    navigator.mediaDevices.getUserMedia(constraints)
        .then(function(mediaStreamObj) {
            //connect the media stream to the first video element
            let video = document.getElementById('vcast_source');
            if ("srcObject" in video) {
                video.srcObject = mediaStreamObj;
            } else {
                //old version
                video.src = window.URL.createObjectURL(mediaStreamObj);
            }

            video.onloadedmetadata = function(ev) {
                //show in the video element what is being captured by the webcam
                video.play();
            };


            //add listeners for saving video/audio
            let start = document.getElementById('btnStart');
            let stop = document.getElementById('btnStop');
            let vidSave = document.getElementById('vid2');
            let mediaRecorder = new MediaRecorder(mediaStreamObj);
            let chunks = [];
            mediaRecorder.start();


            stop.addEventListener('click', (ev)=>{

                mediaRecorder.stop();

                console.log(mediaRecorder.state);
            });
            mediaRecorder.ondataavailable = function(ev) {
                chunks.push(ev.data);
            };
            mediaRecorder.onstop = (ev)=>{
                vcast_manager.stop();

                let blob = new Blob(chunks, { 'type' : 'video/mp4;' });
                VCastManager.RECORDED_BLOB = blob;
                chunks = [];
                mediaStreamObj.getTracks().forEach(function(track) {
                    track.stop();
                });

                recordedVideo = window.URL.createObjectURL(blob);
                console.log('blob', blob);
                vidSave.src = recordedVideo;
                $('#vcast_source').remove();
                $('#vid2').show();
            }
        })
        .catch(function(err) {
            console.log(err.name, err.message);
        });

}

*/

function VCastManager(lesson_id, env)
{
    this.start_time = (Math.floor(new Date().getTime() / 1000));
    this.lesson_id = $('#lesson_id').val();
    this.user_id = null;
    this.video_start_time = 0;
    let vdelete = $('#vcast_delete');
    let vupload = $('#vcast_upload');
    VCastManager.VCAST_ID = null;
    VCastManager.RECORDED_BLOB = null;
    VCastManager.SET_INTERVAL = false;
    this.env = env;
    let recorded_vid = document.getElementById("vid2");
    VCastManager.CONTENT_TYPES = Object.freeze({
        "TYPE_TEXT":"text",
        "TYPE_STROKE":"stroke",
        "VIDEO_FULL_SCREEN":"full_screen",
        "EXIT_FULL_SCREEN":"exit_full_screen",
        "PAGE_BREAK":"page_break",
        "MEDIA":"media",
        "FILE_PRESENTATION":"presentation",
        "IMAGE":"image",
        "VIDEO":"video"
    });
    VCastManager.VIDEO_DURATION = 0;
    let canvas = document.getElementById('drawCanvas');

    VCastManager.prototype.init = function()
    {
        VCastManager.SET_INTERVAL = false;
        vdelete.click(()=> {
            vcast_manager.deleteVCast();
        });

        vupload.click(()=>{

            vcast_manager.saveVCastVideo()
        });


        $('#vcast_replay').click(function () {
            vcast_manager.zanehape(VCastManager.VCAST_ID);
        });
    };

    VCastManager.prototype.saveVCastVideo = function()
    {
        function progressHandler(progress)
        {
            $('#save_status').html(`
                    <div class="progress">
            <div class="progress-bar progress-bar-info progress-bar-striped" role="progressbar" style="width: ${progress}%" aria-valuenow="1" aria-valuemin="0" aria-valuemax="100"></div>
        </div>`)
        }
        let title = $('#vcast_title').val();
        if(title === "")
        {
            VCastUiManager.swalWarning("Please enter title");
            return;
        }

        vcast_manager.uploadFile(`vcasts/${VCastManager.VCAST_ID}/main.mp4`,VCastManager.RECORDED_BLOB, progressHandler, (downloadURL)=>
        {
            try
            {
                firebaseApp.database().ref(`vcasts/${this.env}/${VCastManager.VCAST_ID}/share_props`).set({
                    video_url:downloadURL,
                    title: $('#vcast_title').val()
                });

                console.log('Saved VCast properties');
                let url = `https://vcastbw.web.app?v=${VCastManager.VCAST_ID}`;
                VCastUiManager.swalSuccess("Successfully saved VCast");
                $('#share_urls').html(`
                <input type="text" class="form-control" disabled value="${url}">`
                );
            }

            catch (e)
            {
                console.log('Could not save VCast Properties', e.message);
            }
        });
    };


    VCastManager.prototype.start = function ()
    {
        FirebasePubSub.IS_VCAST = true;
        VCastManager.SET_INTERVAL = false;
        this.startVcast();
        //console.log('hey');
        ///console.log('this.lesson_id', lesson_id);

    };

    VCastManager.prototype.stop = function()
    {
        console.log('In vcast');
        FirebasePubSub.IS_VCAST = false;
        vcast_manager.saveDuration();
        $('#lower_menu').show();
    };

    VCastManager.prototype.startOnCanvas = async function(vcast_id)
    {
        try
        {
            await firebaseApp.database().ref(`vcasts/${this.env}/${vcast_id}/data`).once('value', async function(snapshot)
            {

                let obj = snapshot.val();
                if(!obj)
                {
                    console.log('No data yet');
                    return;
                }
                let keys = Object.keys(obj);
                console.log('krrrrrrrrrrrrrr', keys);

                try
                {
                    for (let i = 0; i <keys.length; i++)
                    {
                        let key = keys[i];
                        let next_key = keys[i+1];
                        let diff = Math.abs(next_key - key);
                        let data = obj[key];
                        await sleep(diff);
                        VCastManager.renderVCastContent(data, key);

                    }

                }

                catch (e) {
                    console.log('wrong key', e.message);
                }

            });
        }

        catch (e)
        {
            console.log('error zane: ', e.message);
        }
    };

    VCastManager.prototype.zanehape = async function(vcast_id)
    {
        $('#btnStop').fadeOut(300);
        VCastManager.clearScreen();
        VCastManager.replay();
        let diff = await vcast_manager.getTimeDifferenceBetweenVideoAndCanvasContent(vcast_id);

        console.log('Diff in zanehape je: ', diff);
        console.log('envvv', this.env);

        await sleep(diff);
        await vcast_manager.startOnCanvas(vcast_id);

    };

    VCastManager.replay = function()
    {
        recorded_vid.play();
    };

    VCastManager.prototype.terminate = function () {
        //Terminate VCast
    };

    VCastManager.prototype.startVcast = function ()
    {
        this.user_id = AuthManager.UID;
        console.log('user_id is in start vcast', this.user_id);
        try
        {
            let ref = firebaseApp.database().ref(`vcasts/${this.env}`).push();
            let vcast_id = ref.key;
            this.video_start_time = new Date().getTime();

            ref.set({
                start_time: new Date().getTime()
            });
            console.log('VCAST ID is', vcast_id);

            VCastManager.VCAST_ID = vcast_id;
        }

        catch (e)
        {
            console.log('ref key :', e.message);
        }

    };

    VCastManager.prototype.getTimeDifferenceBetweenVideoAndCanvasContent = async function(vcast_id)
    {
        let diff = 0;
        await firebaseApp.database().ref(`vcasts/${this.env}/${vcast_id}/data`).limitToFirst(1).once('value', async(snapshot)=>{

            if(snapshot.val())
            {
                let obj = snapshot.val();
                let video_start  = Object.keys(obj)[0];
                console.log('time is:     ', video_start);

                await firebaseApp.database().ref(`vcasts/${this.env}/${VCastManager.VCAST_ID}/start_time`).once('value', async(snapshot)=>  {
                    console.log('snap is:_1', snapshot.val());
                    if(snapshot.val())
                    {
                        let canvas_start_time = snapshot.val();
                        console.log('start time is jksajsjsjs: ', canvas_start_time);
                        diff = Math.abs(canvas_start_time - video_start);
                        console.log('Diff in func is: ', diff);
                        await sleep(diff);
                    }
                })
            }

            else
            {
                console.log('invalid snappy');
                return 1;
            }
        });

        console.log('Before return diff is!!', diff);
        return diff;
    };

    VCastManager.prototype.deleteVCast = function ()
    {
        VCastUiManager.swalConfirm("Are you sure you want to delete this VCast?", "Not deleted", ()=>{

            try
            {
                VCastUiManager.swalSuccess("Successfully deleted VCast");
                firebaseApp.database().ref(`vcasts/${this.env}/${VCastManager.VCAST_ID}`).set(null);
                console.log('VCast deleted');
                $('#vcasta').hide(400);
                VCastManager.clearScreen();
                $('.saved_on_fly').fadeOut(200);
                $(window).off('beforeunload');

                setTimeout(()=>{
                    window.location.reload()
                }, 1000)
            }

            catch (e)
            {
                VCastUiManager.swalWarning("Could not deleted VCast!");
                console.log('Del V Cast :', e.message);
            }

        });
    };

    /**
     * Save Text Content to firebase
     */
    VCastManager.prototype.saveTextToFirebase = function (e, x, y) {
        if (e.keyCode == 13 && !e.shiftKey) {
            e.preventDefault();
            let msg = $('#text_arr_id').val();
            if(msg!='')
            {
                console.log('val', msg);
                console.log('In firebase vcast');
                console.log('in keypress', e);
                try
                {
                    let position = {
                        x:x,
                        y:y
                    };

                    let data = {
                        position: position,
                        text:msg,
                    };

                    console.log(position);

                    firebase_pub_sub.publish(data, '#000000', '30px', VCastManager.CONTENT_TYPES.TYPE_TEXT);

                    strokeTextOnCanvas(data);

                    $('#text_arr_id').remove();

                }

                catch (e)
                {
                    VCastUiManager.swalWarning("Error: Check internet connection!");
                    console.log(e.message);
                }
            }
        }

    };

    VCastManager.renderVCastContent = function (data, key)
    {
        VCastContentManager.renderContent(data, key);
    };

    /**
     * Save the VCast Duration
     * //TODO:Save the location
     */
    VCastManager.prototype.saveDuration = function ()
    {
        let duration = new Date().getTime() - this.video_start_time;
        VCastManager.VIDEO_DURATION = Math.round(document.getElementById("vid2").duration);
        console.log('The vide duration is:', duration);
        try
        {
            firebaseApp.database().ref(`vcasts/${this.env}/${VCastManager.VCAST_ID}/properties`).set({
                duration:duration
            });

            console.log('Saved, VCast Duration!!!!');
        }

        catch (e)
        {
            console.log('Could not save vcast duration!!errty', e.message);
        }
    };

    VCastManager.clearScreen = function ()
    {
        $('.saved_on_fly').remove();
        clearCanvas(canvas);
        $("html, body").animate({ scrollTop: 0 }, "slow");
    };

    /**
     * When the delete is pressed in
     */
    VCastManager.prototype.insertPageBreak = function ()
    {
        let data = {
            break:'true'
        };
        try
        {
            firebase_pub_sub.publish(data, "#fff", "100%", VCastManager.CONTENT_TYPES.PAGE_BREAK);
            VCastManager.clearScreen();
            console.log("Successfully inserted page break");
        }

        catch (e)
        {
            VCastUiManager.swalWarning("Could not add page, check connection!");
        }
    };

    VCastManager.prototype.uploadFile = function (path, blob, progressHandler, completeHandler)
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

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
the_env = location.hostname === "localhost" ? "test" :"live";
console.log('the env is', the_env);
auth_manager = new AuthManager();
firebase_pub_sub = new FirebasePubSub(the_env, '100', '20');
notification_manager = new NotificationManager();
intro_manager = new IntroManager();
content_manager = new VCastContentManager();
device_manager = new DeviceManager();
user_manager = new UserManager();
actions_manager = new ActionsManager();
vsession_actions_manager = new VSessionActionsManager();
create_profile = new CreateProfile();
discover = new Discover();
profile = new Profile();
timer = new Timer();
loader = new Loader();
//router = new Router();
//index = new Index();

file_upload_manager = new FileUploadManager();
/* Canvas */
if(window.location.href.indexOf("discover") < 0)
{
    startCanvas();
}

firebase_pub_sub.init();
firebase_pub_sub.subscribe();
firebase_pub_sub.drawFromHistory();
video_stream = new VideoStream2();
group_chat = new Chat();
vcast_manager = new VCastManager('100', the_env);

draggable = new DraggableElement();

//vcast_player = new VCastPlayer(the_env);

(function()
{
    auth_manager.init();
    //vcast_player.init();
    notification_manager.init();
    if(window.location.href.indexOf("discover") > 0)
    {
        create_profile.init();
    }

    $('#start_vcast').click(function () {
        $('#vcasta').show(300);
        //Clear can
        $('#trasher').removeClass("glyphicon-trash", 300);
        $('#trasher').addClass("glyphicon-forward", 1000);
        $('#trasher').css("color", "#00000");
        let canvas = document.getElementById('drawCanvas');
        clearCanvas(canvas);


        //Start recording vcast
        start();
        vcast_manager.start();
        $('#btnStart').hide(300);

    });

    vcast_manager.init();



    $('.modal-backdrop').remove();

    $('#chat_toggle').click(()=>{
        $('.msg_box').toggle(300);
        $('.msg_body').scrollTop($('.msg_body')[0].scrollHeight); //scroll to bottom
        if($('.msg_body').is(':visible'))
        {
            Chat.ScrollTopBeforeChat = $(window).scrollTop();
        }


        else
        {
            //Put the scrolltop where it was
            $('html, body').animate({ scrollTop: Chat.ScrollTopBeforeChat })
        }
    })

})();
/**
 * Created on 15/04/2020
 * Created by darula
 * 22:41
 * @constructor
 */
function VSessionActionsManager()
{

    this.user_id = AuthManager.UID;
    VSessionActionsManager.UNDO_BUFFER = []; //data that has been undone
    VSessionActionsManager.DATA_KEYS = []; //Added data since the beginning of the session, LIMIT to 100 Items
    VSessionActionsManager.prototype.init = function (vsession_id, env)
    {
        this.vsession_id = vsession_id;
        this.env = env;
        this.subscribeToUndo();
        actions_manager.init("btn_undo_", "btn_redo_");
        this.initRedoUndo();
    }

    VSessionActionsManager.prototype.initRedoUndo = function()
    {
        actions_manager.initRedoUndo(this.undo, this.redo)
    }

    /**
     * The undo action
     */
    VSessionActionsManager.prototype.undo = function ()
    {
        if(VSessionActionsManager.DATA_KEYS.length === 0)
        {
            VCastUiManager.swalInfor("Cannot perform more undos!");
            return;
        }
        try
        {
            let last_key = VSessionActionsManager.DATA_KEYS.pop();
            let ref = firebaseApp.database().ref(`lessons/${vsession_actions_manager.env}/${vsession_actions_manager.vsession_id}/data/${last_key}`);
            ref.remove();
        }

        catch (e)
        {
            console.log("Could not remove data!");
        }
    }

    /**
     * Redo action
     * Publish from the buffer
     */
    VSessionActionsManager.prototype.redo = function ()
    {
        if(VSessionActionsManager.UNDO_BUFFER.length === 0)
        {
            VCastUiManager.swalInfor("Nothing to redo");
            return;
        }

        let data = VSessionActionsManager.UNDO_BUFFER.pop();
        let data_ = data.data;
        let color = data.color;
        let content_type = data.content_type;
        let size = data.size;
        firebase_pub_sub.publish(data_, color, size, content_type);
    }

    /**
     * Subscribe to the undo action
     * It corresponds to the child removed
     */
    VSessionActionsManager.prototype.subscribeToUndo = function ()
    {
        try
        {
            let ref = firebaseApp.database().ref(`lessons/${vsession_actions_manager.env}/${vsession_actions_manager.vsession_id}/data`);
            ref.on('child_removed', function(snapshot)
            {
                let removed = snapshot.val();
                let key = snapshot.key;
                VSessionActionsManager.UNDO_BUFFER.push(removed);
                console.log(`Item has been removed`, snapshot);
                VCastContentManager.clearScreen(key);
                firebase_pub_sub.drawFromHistory();
            });
        }

        catch (e)
        {
            console.log("Error occured in removal! ", e.message);
        }

    }

    /**
     * Add a data key;
     * @param key
     */
    VSessionActionsManager.addDataKey = function (key)
    {
        VSessionActionsManager.DATA_KEYS.push(key); //TODO:LIMIT THE data keys
    }

}
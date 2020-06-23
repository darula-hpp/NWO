/**
 *Created by darula
 *Created on 23/06/2020
 *Time: 16:29
 */

function Series()
{
    Series.prototype.init = function ()
    {
        let url = window.location.href;
        if(url.indexOf("series") > 0)
        {
            $('#main_container').html(Series.wrapper());
            series.getFilms();
        }

    }

    Series.prototype.getFilms = function ()
    {
        //$('#tutors').html(`<div id="ftco-loader" style="justify-content: center" class="show fullscreen"><svg class="circular" width="48px" height="48px"><circle class="path-bg" cx="24" cy="24" r="22" fill="none" stroke-width="4" stroke="#eeeeee"/><circle class="path" cx="24" cy="24" r="22" fill="none" stroke-width="4" stroke-miterlimit="10" stroke="#F96D00"/></svg></div>`)

        VCastUiManager.addIcon('films');
        firebaseApp.database().ref(`nwo/season1`).once('value', (snapshot)=>{
            let films = snapshot.val();
            let keys = Object.keys(films);

            let is_tutor = true;

            keys.forEach((key, index)=>{
                let film_data = films[key];
                try
                {
                    let inspiration = film_data.inspiration;
                    let details = film_data.details;
                    let video_url = film_data.video_url;
                    let UID = film_data.UID;
                    let title = film_data.title;

                    let time  = new Date(film_data.time);

                    let month = time.getMonth() + 1;

                    let time_string = "Posted on " + time.getDate() + "/" + month + "/" + time.getFullYear();

                    VCastUiManager.removeLoadingIcon();
                    $('#films').append(`<div class="row" style="margin-left: auto; margin-right: auto"><div class="card" style="width: 18rem">

    <video class="card-img-top" controls playsinline loop>
    <source src="${video_url}">
</video>
    <div class="card-body">
      <h5 class="card-title">${title}</h5>
      <small style="color: rgb(59,57,57); text-decoration: none">${time_string}</small>
      <p class="card-text">${inspiration}</p>
    </div>

    <div class="card-footer">
      <a href="https://wa.me/26773867278"><ion-icon  style="float: left; color: #25D366; width: 40px; height: 40px; cursor: pointer;" name="logo-whatsapp"></ion-icon><a/>
       <a href="https://www.facebook.com/dialog/share?app_id=1748121785498328&display=popup&href=https://geezusdarula.web.app&redirect_uri=https://geezusdarula.web.app" target="_blank"><ion-icon  style="" class="footer_icons" name="logo-facebook"></ion-icon></a> 
         <a target="_blank" href="https://twitter.com/intent/tweet?text=Check%20out%20${title}%20on%20Geezus%20https://geezusdarula.web.app"><ion-icon class="footer_icons" name="logo-twitter" style="color: #10DFFD"></ion-icon></a>
         <a href="tel:+26773867278"><ion-icon class="footer_icons" style="color: #2dc72d" name="call"></ion-icon></a>
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


    Series.wrapper = function ()
    {
        return `<div class="form-group">
            <input type="text" class="form-control">
            
            <div class="container" style="margin-top: 20px;">
                      <div class="card-deck" id="films">  
</div>


</div>
</div>`
    }
}
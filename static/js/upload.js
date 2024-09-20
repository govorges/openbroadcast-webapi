var upload;

function OnReady() {
  window.displayElement__UploadStatusMessage = document.getElementById("uploadStatusMessage");
  window.utilElement__VideoFileInput = document.getElementById("videoDetails_File");
  utilElement__VideoFileInput.addEventListener("change", () => {
    if (utilElement__VideoFileInput.files.length >= 1) {
      displayElement__UploadStatusMessage.innerText = utilElement__VideoFileInput.files[0].name;
      
      internal__generateVideoThumbnail(utilElement__VideoFileInput.files[0]).then(function (thumbnailDataURL) {
        displayElement__ThumbnailDisplay0.src = thumbnailDataURL
      });
  
      return;
    }
    displayElement__UploadStatusMessage.innerText = "NO FILE SELECTED";
  });


  window.displayElement__ThumbnailDisplay0 = document.getElementById("display_Thumbnail0");

  window.displayElement__ThumbnailDisplay1 = document.getElementById("display_Thumbnail1");
  window.displayElement__ThumbnailDisplay2 = document.getElementById("display_Thumbnail2");
  window.displayElement__ThumbnailDisplay3 = document.getElementById("display_Thumbnail3");
  window.displayElement__ThumbnailDisplay4 = document.getElementById("display_Thumbnail4");
  window.displayElement__ThumbnailDisplay5 = document.getElementById("display_Thumbnail5");

  window.utilElement__ThumbnailFileInput = document.getElementById("videoDetails_ThumbnailUpload");
  utilElement__ThumbnailFileInput.addEventListener("change", () => {
    if (utilElement__ThumbnailFileInput.files.length >= 1) {
      window.displayElement__ThumbnailDisplay0.src = URL.createObjectURL(utilElement__ThumbnailFileInput.files[0]);
    }
  });

  window.displayElement__CategoryRadio_Funny = document.getElementById("videoCategory_Funny");
  window.displayElement__CategoryRadio_Informative = document.getElementById("videoCategory_Informative");
  window.displayElement__CategoryRadio_Misc = document.getElementById("videoCategory_Misc");
  window.displayElement__CategoryDisplay = document.getElementById("selectedCategoryDisplay");

  window.displayElement__VideoLength = document.getElementById("display_VideoLength");
  window.displayElement__VideoResolution = document.getElementById("display_VideoResolution");
  window.displayElement__VideoFPS = document.getElementById("display_VideoFPS");
  window.displayElement__VideoFileSize = document.getElementById("display_VideoFileSize");

  window.inputElement__VideoTitle = document.getElementById("videoTitle_Input");
  window.inputElement__VideoDescription = document.getElementById("videoDesc_Input");
}


const internal__generateVideoThumbnail = (file) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const video = document.createElement("video");

    videoObjectURL = URL.createObjectURL(new Blob([file], { type: "video/mp4" }));
    // if we dont reinstantiate the blob it breaks safari because apple made 1984
    video.autoplay = true;
    video.muted = true;
    video.src = videoObjectURL;

    video.onloadeddata = () => {
      let ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      minutes = video.duration / 60;
      minutes = Math.floor(minutes);
      if (minutes < 10) {
        minutes = "0" + minutes;
      }

      seconds = video.duration % 60;
      seconds = Math.floor(seconds);
      if (seconds < 10) {
        seconds = "0" + seconds;
      }

      var displayFileSize;

      filesizekilobytes = file.size / 1024;
      if (filesizekilobytes > 1024) {
        displayFileSize = Math.ceil(file.size / 1024 / 1024) + "MB"; // MB
      } 
      else if (filesizekilobytes < 1024) {
        displayFileSize = Math.ceil(file.size / 1024) + "KB";
      }
      else {
        displayFileSize = "NaN";
      }
      

      displayElement__VideoLength.innerText = minutes + ":" + seconds;
      displayElement__VideoResolution.innerText = video.videoWidth + "x" + video.videoHeight;
      displayElement__VideoFileSize.innerText = displayFileSize;

      ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

      return resolve(canvas.toDataURL("image/png"));
    };
  });
};
function internal__dataURItoBlob(dataURI) {
  // convert base64/URLEncoded data component to raw binary data held in a string
  var byteString;
  if (dataURI.split(',')[0].indexOf('base64') >= 0)
    byteString = atob(dataURI.split(',')[1]);
  else
    byteString = unescape(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  // write the bytes of the string to a typed array
  var ia = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ia], { type: mimeString });
}
function Event__createFileUpload() {
  let _title = inputElement__VideoTitle.value;
  let _desc = inputElement__VideoDescription.value;

  let video_metadata = {
    "title": _title,
    "description": _desc 
  };
  let videoThumbnail = document.getElementById("videoDetails_ThumbnailUpload").files[0];

  let formData = new FormData();
  formData.append("thumbnail", videoThumbnail);
  formData.append("metadata", JSON.stringify(video_metadata));

  upload_target_file = utilElement__VideoFileInput.files[0];

  fetch("/uploads/create", { method: "POST", body: formData }).then((response) => {
    return response.json();
  }).then((jsonData) => {
    upload = new tus.Upload(upload_target_file, {
      endpoint: "https://video.bunnycdn.com/tusupload",
      retryDelays: [0, 3000, 5000, 10000, 20000, 60000, 60000],
      headers: {
        AuthorizationSignature: jsonData['signature']['signature'],
        AuthorizationExpire: jsonData['signature']['signature_expiration_time'],
        VideoId: jsonData['metadata']['guid'],
        LibraryId: jsonData['metadata']['library_id']
      },
      metadata: {
        filetype: upload_target_file.type,
        title: _title,
      },
      onError: function (error) {
        console.log(error);
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        console.log(bytesUploaded, bytesTotal);
      },
      onSuccess: function () {
        let headerData = { 
          "id": jsonData['metadata']['id'],
          "signature": jsonData['signature']['signature']
        }
        fetch("/uploads/capture", { method: "POST", headers: headerData}); // do something with response but not right now because its 1AM
        // uploads/capture route confirms an upload is complete on client because it
        //       reduces the amount of requests my service has to send to check upload progress of every active upload in postgres
      }
    });
  }).then(function () {
    internal__StartFileUpload();
  });
  return 1;
}

function internal__StartFileUpload() {
  if (upload == undefined) {
    return;
  }
  upload.findPreviousUploads().then(function (previousUploads) {
    if (previousUploads.length) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
    }
    upload.start();
  });
}



function display__PopupDialog({title, message, _accentColor = "var(--accent-1)"}) {
    let popupDialog_Element = document.getElementById("__PopupDialog");
    
    let title_Elements = popupDialog_Element.getElementsByName("title");
    title_Elements.forEach(element => {
      element.innerHTML = title;
    });

    let message_Elements = popupDialog_Element.getElementsByName("message");
    message_Elements.forEach(element => {
      element.innerHTML = message;
    });

    let accent_elements = popupDialog_Element.getElementsByClassName("accent");
    accent_elements.forEach(element => {
      element.style.background = _accentColor;
    });
}

function Event__UploadClicked () {
  utilElement__VideoFileInput.click();
}
function Event__ThumbnailUploadClicked() {
  utilElement__ThumbnailFileInput.click();
}
function Event__CategorySelectionChanged() {
  var selectedCategory = "";
  if (displayElement__CategoryRadio_Funny.checked) {
    selectedCategory = "Funny";
  }
  else if (displayElement__CategoryRadio_Informative.checked) {
    selectedCategory = "Informative";
  }
  else if (displayElement__CategoryRadio_Misc) {
    selectedCategory = "Miscellaneous"
  }
  displayElement__CategoryDisplay.innerText = "Selected: " + selectedCategory;
}









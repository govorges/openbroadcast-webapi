
function init() {
    window.utility_VideoFileInput = document.getElementById("utility_VideoFileInput");
    window.utility_ThumbnailFileInput = document.getElementById("utility_ThumbnailFileInput");
    
    window.uploadObject = undefined;
    window.statusPollerInterval = undefined;

    window.memory__VideoFileInput_PreviousFileName = "";
    window.memory__VideoFileInput_CurrentFileName = "";

    window.utility_AlertBar = document.getElementById("alertBar");
    window.alertBar_HideTimout = null;
    utility_DisplayAlertBarMessage({
        messageContent:"Welcome to OpenBroadcast!",
        length_ms: 3000
    });

    window.dialog__Upload = document.getElementById("dialog__Upload");
    window.dialog__Metadata = document.getElementById("dialog__Metadata");
    window.dialog__Thumbnail = document.getElementById("dialog__Thumbnail");
    window.dialog__Details = document.getElementById("dialog__Details");
    window.dialog__UploadStatus = document.getElementById("dialog__UploadStatus");

    window.DialogNameMap = {
      "init": dialog__Upload,
      "upload": dialog__Upload,
      "metadata": dialog__Metadata,
      "thumbnail": dialog__Thumbnail,
      "details": dialog__Details,
      "uploadstatus": dialog__UploadStatus
    };
    window.DialogNameOrder = ["init", "upload", "thumbnail", "metadata", "details", "uploadstatus"];

    dialog__Next("init"); // Initializing the first item in DialogNameOrder.

    window.dialog__Upload_Buttons_SelectVideoFile = document.getElementById("dialog__Upload_SelectVideoFile");
    window.dialog__Upload_Buttons_Continue = document.getElementById("dialog__Upload_Continue");
    window.dialog__Upload_Display_SelectedVideoSubtext = document.getElementById("dialog__Upload_SelectedVideoSubtext");

    window.dialog__Metadata_Input_VideoTitle = document.getElementById("dialog__Metadata_Input_Title");
    window.dialog__Metadata_Input_VideoDescription = document.getElementById("dialog__Metadata_Input_Description")
    window.dialog__Metadata_Input_Category = document.getElementById("dialog__Metadata_Input_Category");
    window.dialog__Metadata_Buttons_Continue = document.getElementById("dialog__Metadata_Continue");

    window.dialog__Thumbnail_ImageDisplay = document.getElementById("thumbnailDisplay");

    window.dialog__Details_Title = document.getElementById("dialog__Details_Title");
    window.dialog__Details_Description = document.getElementById("dialog__Details_Description");
    window.dialog__Details_Category = document.getElementById("dialog__Details_Category");
    window.dialog__Details_VideoLength = document.getElementById("dialog__Details_VideoLength");
    window.dialog__Details_VideoResolution = document.getElementById("dialog__Details_VideoResolution");
    window.dialog__Details_VideoFileSize = document.getElementById("dialog__Details_VideoFileSize");
    window.dialog__Details_VideoThumbnail = document.getElementById("dialog__Details_VideoThumbnail");

    window.dialog__UploadStatus_ProgressBar = document.getElementById("dialog__UploadStatus_progressBar");
    window.dialog__UploadStatus_StatusText = document.getElementById("dialog__UploadStatus_statusText");

    // TODO: error callbacks to yell at users that things broke
    window.VideoStatusCodes = [
      {
        messageContent: "Upload is stuck in progress. This error should not exist, contact support (Error 0x01)",
        type: "error"
      },
      {
        messageContent: "Video uploaded successfully.",
        type: "info"
      },
      {
        messageContent: "OpenBroadcast is processing your video... (This usually takes a minute)",
        type: "info"
      },
      {
        messageContent: "Your video is transcoding. It will be available soon!",
        type: "info"
      },
      {
        messageContent: "Your video has been successfully registered on OpenBroadcast!",
        type: "info",
        callback: dialog__UploadStatus_StatusCompletionCallback
      },
      {
        messageContent: "There was an error processing your video (Error 0x05)",
        type: "error"
      },
      {
        messageContent: "Your upload has failed! There may be a problem with your video file. This is not typically connection related. (Error 0x06)",
        type: "error"
      }
    ]

    window.memory__VideoData = {
        title: "",
        description: "",
        category: "",
        category_str: "",
        duration_str: "",
        resolution_str: "",
        filesize_str: "",
        thumbnail_DataURL: "",
    }

}

function dialog__Upload_ViewRules(anchor) {
    let viewRules_Element = document.getElementById("dialog__Upload_ViewRules");

    if (viewRules_Element.style.display == "none") {
        viewRules_Element.style.display = "block";
        anchor.innerText = "Hide Rules";
    }
    else {
        anchor.innerText = "View Rules";
        document.getElementById("dialog__Upload_ViewRules").style.display = "None";
    }
}
function dialog__Upload_SelectVideoFile() {
    utility_VideoFileInput.click();
}
function utility_DisplayAlertBarMessage({messageContent, length_ms, type}) {
    if (messageContent == null) return;
    if (length_ms == null) length_ms = 10000;
    if (type == null) type = "info";

    utility_AlertBar.innerHTML = messageContent;
    utility_AlertBar.style.opacity = 1;

    if (type == "info") {
        utility_AlertBar.style.backgroundColor = "var(--accent-1)";
    }
    if (type == "error") {
        utility_AlertBar.style.backgroundColor = "maroon";
    }
    if (type == "warning") {
        utility_AlertBar.style.backgroundColor = "orange";
    }

    if (alertBar_HideTimout != null) {
        clearTimeout(alertBar_HideTimout);
    }

    alertBar_HideTimout = setTimeout(() => {
        utility_AlertBar.style.opacity = 0;
        alertBar_HideTimout = null;
    }, (length_ms));

}
function dialog__Upload_VideoFileInput__Event_OnChange() {
    if (utility_VideoFileInput.length == 0) {
        utility_DisplayAlertBarMessage({
            messageContent: "No video selected!",
            type: "warning"
        })
        return; // File selection is empty.
    }

    let currentFileName = utility_VideoFileInput.files[0].name;
    let _fileNameChunks = currentFileName.toLowerCase().split(".")
    if (_fileNameChunks[_fileNameChunks.length-1] != "mp4") {
        utility_DisplayAlertBarMessage({
            messageContent: "File must be of <span class=\"markdown_Code\">.mp4</span> file extension!",
            type: "error"
        });
        return;
    }

    if (memory__VideoFileInput_PreviousFileName == "" && currentFileName != "") {
        // Visual feedback in alertBar and below panel button.
        utility_DisplayAlertBarMessage({
            messageContent: "Video file selected successfully!"
        });
        dialog__Upload_Display_SelectedVideoSubtext.innerHTML = "Selected file: <span class=\"markdown_Code\">" + currentFileName + "</span>";

        // Swapping the file selection button with the continue-to-next-panel button.
        dialog__Upload_Buttons_Continue.style.display = "flex";
        dialog__Thumbnail_Load();
    }
    if (currentFileName == "") {
        utility_DisplayAlertBarMessage({
            messageContent:"Error selecting a video file!",
            type: "error"
        });
    }
}
function dialog__Next(currentDialogName) {
  let currentDialogIndex = DialogNameOrder.indexOf(currentDialogName);
  let nextDialogName = DialogNameOrder[currentDialogIndex+1];

  let currentDialogObj = DialogNameMap[currentDialogName];
  let nextDialogObj = DialogNameMap[nextDialogName];

  if (currentDialogName == "metadata") {
    if (dialog__Metadata_CheckMetadataValidity()) {
      memory__VideoData.title = dialog__Metadata_Input_VideoTitle.value;

      memory__VideoData.description = dialog__Metadata_Input_VideoDescription.value;
      if (memory__VideoData.description == "") {
          memory__VideoData.description = "A video uploaded to OpenBroadcast.";
      }
      memory__VideoData.category = dialog__Metadata_Input_Category.value;
      if (memory__VideoData.category == "misc") {
          memory__VideoData.category_str = "Miscellaneous";
      }
      else if (memory__VideoData.category == "info") {
          memory__VideoData.category_str = "Informative";
      }
      else if (memory__VideoData.category == "funny") {
          memory__VideoData.category_str = "Funny";
      }
      dialog__Metadata.style.display = "none";
      dialog__Details.style.opacity = 1;

      dialog__Details_PopulateData();
    }
    else {
      return;
    }
  }
  else if (currentDialogName == "thumbnail") {
    dialog__Metadata_Buttons_Continue.style.backgroundColor = "red";
  }
  else if (currentDialogName == "details") {
    dialog__UploadStatus_CreateUpload();
  }

  currentDialogObj.style.display = "none";
  let currentDialogHeader = currentDialogObj.querySelector(".header");
  currentDialogHeader.style.opacity = 0;

  nextDialogObj.style.display = "flex";
  let nextDialogHeader = nextDialogObj.querySelector(".header");
  nextDialogHeader.style.opacity = 1;

}

function dialog__Metadata_CheckMetadataValidity() {
    let titleValid = dialog__Metadata_CheckTitleValidity();
    let descValid = dialog__Metadata_CheckDescriptionValidity();
    let categoryValid = dialog__Metadata_CheckCategoryValidity();

    if (titleValid && descValid && categoryValid) {
        dialog__Metadata_Buttons_Continue.style.backgroundColor = "var(--accent-1)";

        return true;
    }
    else {
        dialog__Metadata_Buttons_Continue.style.backgroundColor = "red";
    }
}
function dialog__Metadata_CheckTitleValidity() {
    let title = dialog__Metadata_Input_VideoTitle.value;
    let titleLabel = document.getElementById("titleLabel");
    if (title.length > 120) {
        titleLabel.innerHTML = `
        <span>
            Video Title<br>
            <span class=\"markdown_Error\">
                Video title is too long! (%%CURRENT_LENGTH%%/120 characters)
            </span>
        </span>
        <span class="subtext">Maximum length of 120 characters. <span class="markdown_Code">Required</span></span>
        `.replace("%%CURRENT_LENGTH%%", title.length);
        return false;
    }
    if (title.length < 12) {
        titleLabel.innerHTML = `
        <span>
            Video Title<br>
            <span class=\"markdown_Error\">
                Video title is too short! (%%CURRENT_LENGTH%%/12 characters)
            </span>
        </span>
        <span class="subtext">Maximum length of 120 characters. <span class="markdown_Code">Required</span></span>
        `.replace("%%CURRENT_LENGTH%%", title.length);
        return false;
    }
    else {
        titleLabel.innerHTML = `
        <span>
            Video Title<br>
            <span class=\"markdown_Success\">
                Video title is valid!
            </span>
        </span>
        <span class="subtext">Maximum length of 120 characters. <span class="markdown_Code">Required</span></span>
        `;
        return true;
    }
}
function dialog__Metadata_CheckDescriptionValidity() {
    let description = dialog__Metadata_Input_VideoDescription.value;
    let descriptionLabel = document.getElementById("descLabel");

    if (description.length > 800) {
        descriptionLabel.innerHTML = `
        <span>
            Video Description<br>
            <span class=\"markdown_Error\">
                Video description is too long! (%%CURRENT_LENGTH%%/800 characters)
            </span>
        </span>
        <span class="subtext">Maximum length of 800 characters. <span class="markdown_Code">Optional</span></span>
        `.replace("%%CURRENT_LENGTH%%", description.length);

        return false;
    }
    else {
        descriptionLabel.innerHTML = `
        <span>
            Video Description<br>
            <span class=\"markdown_Success\">
                Video description is valid!
            </span>
        </span>
        <span class="subtext">Maximum length of 800 characters. <span class="markdown_Code">Optional</span></span>
        `;

        return true;
    }
}
function dialog__Metadata_CheckCategoryValidity() {
    let category = dialog__Metadata_Input_Category.value;
    if (["misc", "funny", "info"].includes(category)) {
        return true;
    }
    return false;
}

const dialog__Thumbnail_DataURIFromFile = (fileObject) => {
    return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const video = document.createElement("video");

        videoObjectUrl = URL.createObjectURL(new Blob([fileObject], { type: "video/mp4" }));

        video.autoplay = true;
        video.muted = true;
        video.src = videoObjectUrl;

        video.onloadeddata = () => {
            let ctx = canvas.getContext("2d");

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            memory__VideoData.resolution_str = video.videoWidth + "x" + video.videoHeight;

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

            memory__VideoData.duration_str = minutes + ":" + seconds;

            var displayFileSize;

            filesizekilobytes = fileObject.size / 1024;
            if (filesizekilobytes > 1024) {
              displayFileSize = Math.ceil(fileObject.size / 1024 / 1024) + "MB"; // MB
            }
            else if (filesizekilobytes < 1024) {
              displayFileSize = Math.ceil(fileObject.size / 1024) + "KB";
            }
            else {
              displayFileSize = "NaN";
            }

            memory__VideoData.filesize_str = displayFileSize;

            ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            let thumbnailBlob = canvas.toBlob((file) => {
                return file;
            })

            utility_ThumbnailFileInput.files[0] = thumbnailBlob;
            return resolve(canvas.toDataURL("image/png"));
        }
    })

}

function dialog__Thumbnail_Load() {
    dialog__Thumbnail_DataURIFromFile(utility_VideoFileInput.files[0]).then(function (thumbnailDataURL) {
        utility_ThumbnailFileInput.setAttribute("onchange", null); // Temporarily disable the onchange to guarantee it doesn't trigger from setting the thumbnail file input element programmatically.
        dialog__Thumbnail_ImageDisplay.src = thumbnailDataURL;
        memory__VideoData.thumbnail_DataURL = thumbnailDataURL;
        utility_ThumbnailFileInput.setAttribute("onchange", "dialog__Thumbnail_ThumbnailFileInput_Event_OnChange()");
    });
}
function dialog__Thumbnail_SelectThumbnailFile() {
    utility_ThumbnailFileInput.click();
}
function dialog__Thumbnail_ThumbnailFileInput_Event_OnChange() {
    // This, in my testing, didn't trigger when the file was programmatically changed.
    // However, browsers.
    // Therefore, fixed.
    if (utility_ThumbnailFileInput.files.length == 0) {
        return;
    } // TODO: probably additional logic here.
    let thumbnailDataURL = URL.createObjectURL(utility_ThumbnailFileInput.files[0]);
    dialog__Thumbnail_ImageDisplay.src = thumbnailDataURL;
    memory__VideoData.thumbnail_DataURL = thumbnailDataURL;
}


function dialog__Details_PopulateData() {
    dialog__Details_Title.innerText = memory__VideoData.title;
    dialog__Details_Description.innerText = memory__VideoData.description;
    dialog__Details_Category.innerText = memory__VideoData.category_str;

    dialog__Details_VideoLength.innerText = memory__VideoData.duration_str;
    dialog__Details_VideoResolution.innerText = memory__VideoData.resolution_str;
    dialog__Details_VideoFileSize.innerText = memory__VideoData.filesize_str;

    dialog__Details_VideoThumbnail.src = memory__VideoData.thumbnail_DataURL;
}
function DataURLToBlob(dataURL) {
  let byteString;
  if (dataURL.split(',')[0].indexOf('base64') >= 0) {
    byteString = atob(dataURL.split(',')[1]);
  }
  else {
    byteString = unescape(dataURL.split(',')[1]);
  }

  let mimeString = dataURL.split(",")[0].split(':')[1].split(";")[0];
  let ia = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ia], {type: mimeString});
}

async function dialog__UploadStatus_CreateUpload() {
  if (memory__VideoData.thumbnail_DataURL == null) {
    return;
  }
  let formData = new FormData();

  let thumbnailFile = DataURLToBlob(memory__VideoData.thumbnail_DataURL);
  formData.append("thumbnail", thumbnailFile);

  let videoMetadata = { "title": memory__VideoData.title, "description": memory__VideoData.description, "category": memory__VideoData.category }
  formData.append("metadata", JSON.stringify(videoMetadata));

  _uploadTarget = utility_VideoFileInput.files[0];

  fetch("/uploads/create", { method: "POST", body: formData } ).then((response) => {
    return response.json();
  }).then((jsonData) => {
    uploadObject = new tus.Upload(_uploadTarget, {
      endpoint: "https://video.bunnycdn.com/tusupload",
      retryDelays: [0, 3000, 5000, 10000, 20000, 60000, 60000],
      headers: {
        AuthorizationSignature: jsonData['signature']['signature'],
        AuthorizationExpire: jsonData['signature']['signature_expiration_time'],
        LibraryId: jsonData['signature']['library_id'],
        VideoId: jsonData['metadata']['guid']
      },
      metadata: {
        filetype: _uploadTarget.type,
        title: memory__VideoData.title
      },
      onError: function (error) {
        utility_DisplayAlertBarMessage({
          messageContent: "Error during upload, retrying...",
          length_ms: 2000,
          type: 'warning'
        });
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        let percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
        
        dialog__UploadStatus_ProgressBar.style.width = percentage + "%";
        dialog__UploadStatus_StatusText.innerText = "Uploading - " + percentage + "%";
      },
      onSuccess: function () {
        utility_DisplayAlertBarMessage({
          messageContent: "Upload complete! OpenBroadcast is processing your video. This page will update as the video's status changes.",
          length_ms: 60000,
          type: 'info'
        })
        dialog__UploadStatus_StartPoller(jsonData['metadata']['guid']);
      }
    });
  }).then(function () {
    dialog__UploadStatus_TryStartUpload();
  });
}

function dialog__UploadStatus_TryStartUpload() {
  if (uploadObject == undefined) {
    return;
  }
  uploadObject.findPreviousUploads().then(function (previousUploads) {
    if (previousUploads.length) {
      uploadObject.resumeFromPreviousUpload(previousUploads[0]);
    }
    uploadObject.start();
  });
}
function dialog__UploadStatus_StartPoller(guid) {
  if (guid == undefined) {
    return;
  }

  headers = { "guid": guid }

  statusPollerInterval = setInterval(function () {
    fetch("/uploads/status", { method: "GET", headers: headers } ).then((response) => {
      return response.json();
    }).then((jsonData) => {
      let uploadStatus = jsonData["status"]
      
      let statusInfo = VideoStatusCodes[uploadStatus];
      utility_DisplayAlertBarMessage({
        messageContent: statusInfo.messageContent,
        length_ms: 12000,
        type: statusInfo.type
      })
      var callback = statusInfo.callback;
      if (callback != undefined) {
        callback();
      }
    })
  }, 10000);
}
function dialog__UploadStatus_StatusCompletionCallback() {
  clearInterval(statusPollerInterval);
  console.log("Hello from the completion callback!");
}
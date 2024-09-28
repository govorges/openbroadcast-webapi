
function init() {
    window.utility_VideoFileInput = document.getElementById("utility_VideoFileInput");
    window.utility_ThumbnailFileInput = document.getElementById("utility_ThumbnailFileInput");
    
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

    window.dialog__Upload_Buttons_SelectVideoFile = document.getElementById("dialog__Upload_SelectVideoFile");
    window.dialog__Upload_Buttons_Continue = document.getElementById("dialog__Upload_Continue");
    window.dialog__Upload_Display_SelectedVideoSubtext = document.getElementById("dialog__Upload_SelectedVideoSubtext");

    window.dialog__Metadata_Input_VideoTitle = document.getElementById("dialog__Metadata_Input_Title");
    window.dialog__Metadata_Input_VideoDescription = document.getElementById("dialog__Metadata_Input_Description")
    window.dialog__Metadata_Input_Category = document.getElementById("dialog__Metadata_Input_Category");
    window.dialog__Metadata_Buttons_Continue = document.getElementById("dialog__Metadata_Continue");

    window.dialog__Thumbnail_ImageDisplay = document.getElementById("thumbnailDisplay");
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
    }
    if (currentFileName == "") {
        utility_DisplayAlertBarMessage({
            messageContent:"Error selecting a video file!",
            type: "error"
        });
    }
}
function dialog__Upload_Continue() {
    dialog__Upload.style.display = "none";

    dialog__Thumbnail.style.opacity = 1;
    dialog__Thumbnail_Load();
}
function dialog__Thumbnail_Continue() {
    dialog__Thumbnail.style.display = "none";

    dialog__Metadata.style.opacity = 1;
    dialog__Metadata_Buttons_Continue.style.backgroundColor = "red";
}
function dialog__Metadata_Continue() {
    if (dialog__Metadata_CheckMetadataValidity()) {
        dialog__Metadata.style.display = "none";
        dialog__Thumbnail.style.opacity = 1;
        dialog__Thumbnail_Load();
    }
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
    if (["misc", "funny", "informative"].includes(category)) {
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
}
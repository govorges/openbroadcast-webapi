
function init() {
    window.utility_VideoFileInput = document.getElementById("utility_VideoFileInput");
    
    window.memory__VideoFileInput_PreviousFileName = "";
    window.memory__VideoFileInput_CurrentFileName = "";

    window.utility_AlertBar = document.getElementById("alertBar");
    window.alertBar_HideTimout = null;
    utility_DisplayAlertBarMessage("Welcome to OpenBroadcast!", 3000);

    window.dialog__Upload_Buttons_SelectVideoFile = document.getElementById("dialog__Upload_SelectVideoFile");
    window.dialog__Upload_Buttons_Continue = document.getElementById("dialog__Upload_Continue");
    window.dialog__Upload_Display_SelectedVideoSubtext = document.getElementById("dialog__Upload_SelectedVideoSubtext");


    window.dialog__Metadata_Input_VideoTitle = document.getElementById("dialog__Metadata_Input_Title");
    window.dialog__Metadata_Input_VideoDescription = document.getElementById("dialog__Metadata_Input_Description")
    window.dialog__Metadata_Buttons_Continue = document.getElementById("dialog__Metadata_Continue");
    
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
function utility_DisplayAlertBarMessage(messageContent, length_ms = 10000) {
    utility_AlertBar.innerHTML = messageContent;
    utility_AlertBar.style.opacity = 1;

    if (alertBar_HideTimout != null) {
        clearTimeout(alertBar_HideTimout);
    }

    alertBar_HideTimout = setTimeout(() => {
        utility_AlertBar.style.opacity = 0;
        alertBar_HideTimout = null;
    }, (length_ms));

}
function utility_VideoFileInput__Event_OnChange() {
    if (memory__VideoFileInput_PreviousFileName == "") {
        utility_VideoFileInput.disabled = true;

        // Storing the file name for future use ( typically in file input event `onchange` )
        memory__VideoFileInput_CurrentFileName = utility_VideoFileInput.files[0].name;
        
        // Visual feedback in alertBar and below panel button.
        utility_DisplayAlertBarMessage("Video file selected successfully!", 10000);
        dialog__Upload_Display_SelectedVideoSubtext.innerHTML = "Selected file: <span class=\"markdown_Code\">" + memory__VideoFileInput_CurrentFileName + "</span>";

        // Swapping the file selection button with the continue-to-next-panel button.
        dialog__Upload_Buttons_SelectVideoFile.style.display = "none";
        dialog__Upload_Buttons_Continue.style.display = "flex";

    }
}

function utility_IsTitleValid(titleStr) {
    if (titleStr.length > 120) {
        return false;
    }
    return true;
}


function utility_VideoTitleInput__Event_OnChange() {
    let title = dialog__Metadata_Input_VideoTitle.value;
    let titleLabel = document.getElementById("titleLabel");

    if (!utility_IsTitleValid(title)) {
        titleLabel.innerHTML = `
        <span>
            Video Title<br>
            <span class=\"markdown_Error\">
                Video title is too long! (%%CURRENT_LENGTH%%/120 characters)
            </span>
        </span>
        <span class="subtext">Maximum length of 120 characters. <span class="markdown_Code">Required</span></span>
        `.replace("%%CURRENT_LENGTH%%", title.length);

        dialog__Metadata_Buttons_Continue.disabled = true;
        dialog__Metadata_Buttons_Continue.style.backgroundColor = "red";
    }
    else if (title.length > 12) {
        titleLabel.innerHTML = `
        <span>
            Video Title<br>
            <span class=\"markdown_Success\">
                Video title is valid!
            </span>
        </span>
        <span class="subtext">Maximum length of 120 characters. <span class="markdown_Code">Required</span></span>
        `;

        dialog__Metadata_Buttons_Continue.disabled = false;
        dialog__Metadata_Buttons_Continue.style.backgroundColor = getComputedStyle(document.body).getPropertyValue("--accent-1");
    }
    else {
        titleLabel.innerHTML = `
        <span>
            Video Title<br>
            <span class=\"markdown_Error\">
                Video title is too short! (Minimum 12 characters)
            </span>
        </span>
        <span class="subtext">Maximum length of 120 characters. <span class="markdown_Code">Required</span></span>
        `;

        dialog__Metadata_Buttons_Continue.disabled = true;
        dialog__Metadata_Buttons_Continue.style.backgroundColor = "red";
    }
}

function utility_VideoDescriptionInput__Event_OnChange() {
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

        dialog__Metadata_Buttons_Continue.disabled = true;
        dialog__Metadata_Buttons_Continue.style.backgroundColor = "red";
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

        dialog__Metadata_Buttons_Continue.disabled = false;
        dialog__Metadata_Buttons_Continue.style.backgroundColor = getComputedStyle(document.body).getPropertyValue("--accent-1");
    }
}


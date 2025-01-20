function global_init() {
    window.utility_AlertBar = document.getElementById("alertBar");
    window.alertBar_HideTimout = null;

    let user_email = document.getElementById("user.Email").innerText;
    if (user_email != null && user_email !== "") {
        document.getElementById("navBarAccountDisplay").innerHTML = '<i class="material-icons">person</i>' + user_email;
    }
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
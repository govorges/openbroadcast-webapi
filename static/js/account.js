initialized = false;
window.onload = (function() {
    init();
    initialized = true;
})
function init() {
    if (initialized) {
        return;
    }
    global_init();

    window.User_Email = document.getElementById("user.Email").innerText;
    window.User_Id = document.getElementById("user.Id").innerText;

    User_EmailDisplay = document.getElementById("user.EmailDisplay");
    User_EmailDisplay.innerText = User_Email; 
}
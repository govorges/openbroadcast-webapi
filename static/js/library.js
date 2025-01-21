window.initialized = false;
window.onload = (function() { 
    init();
    initialized = true;
});

function change_selected_tab(anchor) {
    anchor.className = "currentView";    
    let description_El = document.getElementById(anchor.id + "_desc");
    description_El.style.display = "block";

    TabNames.forEach(tab => {
        let tab_El = document.getElementById("tabs_" + tab);
        if (tab_El.id != anchor.id) {
            tab_El.className = null;
            document.getElementById(tab_El.id + "_desc").style.display = "none";
        }
    });
}

function init() {
    global_init();

    window.display_CenterBox = document.getElementById("centerBox");
    window.TabNames = ["#manageLibrary", "#advertising", "#security"]
    
    selectedTab = window.TabNames[0];
    if (window.location.hash && window.TabNames.indexOf(window.location.hash) > -1) {
        selectedTab = window.location.hash;
    }
    selectedTab_El = document.getElementById("tabs_" + selectedTab);
    change_selected_tab(selectedTab_El);
}
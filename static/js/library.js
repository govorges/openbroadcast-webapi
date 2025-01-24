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

async function RetrieveVideos() {
    // Retrieves a dictionary of video objects from the Library service.
    let videoData = await fetch("/library/videos", {
        method: "GET",
        headers: { // Setting cookie header to pass session information.
            "cookie": document.cookie
        }
    }).then( (response) => {
        if (response.status != 200) {
            console.error(
                "/library/videos - Video retrieval unsuccessful."
            );
        }
        else {
            return response;
        }
    }).then( (response) => { return response.json(); });
    
    return videoData;
}

async function RetrieveCollections() {
    // Retrieves a dictionary of collection objects from the Library service.
    let collectionData = await fetch("/library/collections", {
        method: "GET",
        headers: { // Setting cookie header to pass session information.
            "cookie": document.cookie
        }
    }).then( (response) => {
        if (response.status != 200) {
            console.error(
                "/library/collections - Collection retrieval unsuccessful."
            );
        }
        else {
            return response;
        }
    }).then( (response) => { return response.json(); } );
    
    return collectionData;
}

function update_videopath_display() {
    videopath_display_el = document.querySelector(".videoPath > a:last-child");
    if (window.SelectedCollection != null) {
        videopath_library_el = document.querySelector(".videoPath > a");
        videopath_library_el.setAttribute("href", "#");
        videopath_display_el.innerText = window.SelectedCollection.name
    }
    else {
        videopath_library_el = document.querySelector(".videoPath > a");
        videopath_library_el.removeAttribute("href");
        videopath_display_el.innerText = "";
    }
}

function change_collection_selection(collectionName_El) {
    let guid;
    if (collectionName_El != null) {
        let collectionGuid_El = collectionName_El.parentNode.getElementsByTagName("guid")[0];
        guid = collectionGuid_El.id;
    }

    if (window.SelectedCollection != null) {
        let selectedCollectionGuid = window.SelectedCollection.guid;
        document.getElementById(selectedCollectionGuid).parentNode.querySelector(".name").setAttribute("class", "name");
        if (window.SelectedCollection.guid == guid) {
            window.SelectedCollection = null;
            update_videopath_display();
            return; // Toggling the selection.
        }
        window.SelectedCollection = null;
    }
    
    window.Collections.forEach((collection) => {
        if (collection.guid == guid) {
            window.SelectedCollection = collection;
            collectionName_El.setAttribute("class", "name selected");

            utility_DisplayAlertBarMessage({
                messageContent: "Collection \"" + collection.name + "\" has been selected!",
                length_ms: 3000
            });
        }
    })

    update_videopath_display();
    // function utility_DisplayAlertBarMessage({messageContent, length_ms, type}) {
}

async function add_collection() {
    let collection_adder = document.getElementById("collection_adder");
    let collection_name_element = collection_adder.querySelector('input');
    let label_element = collection_adder.querySelector("span");
    if (collection_name_element.style.display != "none") {
        let name = collection_name_element.value;
        if (name == "") {
            utility_DisplayAlertBarMessage({
                messageContent: "Collection name was invalid!",
                length_ms: 3000,
                type: "error"
            });
        }
        else {
            let collection_response = await fetch("/library/collections/add", {
                method: "POST",
                headers: { // Setting cookie header to pass session information.
                    "cookie": document.cookie,
                    "accept": "application/json",
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    collection_name: name
                })
            }).then( (response) => {
                if (response.status != 200) {
                    console.error(
                        "/library/collections/add - Collection addition unsuccessful."
                    );
                    utility_DisplayAlertBarMessage({
                        messageContent: "Collection was not added! (" + response.status + ")",
                        length_ms: 3000,
                        type: "error"
                    });
                }
                else {
                    return response;
                }
            }).then( (response) => { return response.json(); } );
            populate_collections();
        }
        collection_name_element.style.display = "none";
        collection_name_element.value = "";
        label_element.innerText = "Create Collection";
    }
    else {
        collection_name_element.style.display = "block";
        label_element.innerText = "Confirm"
        collection_name_element.focus();
    }

}

function populate_collections() {
    RetrieveCollections().then((result) => {
        collection_container.innerHTML = "";
        result.forEach((collection) => {
            let template = document.getElementById("collection_Template").innerHTML;
            template = template.replace("%%Name%%", collection.name);
            template = template.replace("%%Guid%%", collection.guid);
            template = template.replace("%%Video_Count%%", collection.videoCount);
            template = template.replace("%%Storage%%", collection.totalSize);

            collection_container.innerHTML += template;

            window.Collections.push(collection);
        });
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

    utility_DisplayAlertBarMessage({
        messageContent: "Loading Video Library...",
        length_ms: 3000
    });

    window.Collections = [];
    populate_collections();
    window.SelectedCollection = null;

    window.Videos = [];
    RetrieveVideos().then((result) => {
        window.Videos = result;
        if (window.Videos.length == 0) {
            let loader_El = document.getElementById("video_container").querySelector(".loader");
            loader_El.innerHTML = "<span>No videos found! <a href=#>Click here to upload</a> or drag & drop a file to get started.</span>";
        }
    });
}
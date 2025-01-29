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
    
    videoData = videoData.sort(
        (first, second) => { 
            return Date.parse(first.dateUploaded) - Date.parse(second.dateUploaded)
        }
    )

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

        if (collectionName_El.contentEditable == "true" || collectionName_El.contentEditable == true) {
            return;
        }
    }

    if (window.SelectedCollection != null) {
        let selectedCollectionGuid = window.SelectedCollection.guid;
        document.getElementById(selectedCollectionGuid).parentNode.querySelector(".name").setAttribute("class", "name");
        if (window.SelectedCollection.guid == guid) {
            window.SelectedCollection = null;
            update_videopath_display();
            utility_DisplayAlertBarMessage({messageContent: "Selection cleared", length_ms: 500});
            window.Videos.forEach((video) => {
                if (video.collectionId == "") {
                    create_video_element(video);
                }
            });
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

            let video_container = document.getElementById("video_container");
            video_container.innerHTML = "";

            window.Videos.forEach((video) => {
                if (video.collectionId == window.SelectedCollection.guid) {
                    create_video_element(video);
                }
            });
        }
    });

    if (window.SelectedCollection == null) {
        utility_DisplayAlertBarMessage({messageContent: "Selection cleared", length_ms: 500})
        window.Videos.forEach((video) => {
            if (video.collectionId == "") {
                create_video_element(video);
            }
        });
    }

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
            utility_DisplayAlertBarMessage({
                messageContent: "Creating collection, '" + name + "'...",
                length_ms: 3000,
            });
            await fetch("/library/collections/add", {
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
                    utility_DisplayAlertBarMessage({
                        messageContent: "Collection, '" + name + "' created successfully!",
                        length_ms: 3000,
                    });
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

async function populate_collections() {
    await RetrieveCollections().then((result) => {
        collection_container.innerHTML = "";
        result.forEach((collection) => {
            let template = document.getElementById("collection_Template").innerHTML;
            template = template.replace("%%Name%%", collection.name);
            template = template.replace("%%Guid%%", collection.guid);
            template = template.replace("%%Video_Count%%", collection.videoCount);
            
            let formattedStorage;
            if (collection.totalSize > 1000000) {
                formattedStorage = collection.totalSize / 1000 / 1000; // MB = collection.totalSize / 1000 / 1000 / 1000; // MB
                if (formattedStorage > 1000) {
                    formattedStorage = formattedStorage / 1000;  // GB
                    formattedStorage = Math.round(formattedStorage).toString() + " GB";
                }
                else {
                    formattedStorage = Math.round(formattedStorage) + " MB";
                }
            }
            else {
                formattedStorage = ">1 MB";
            }

            template = template.replace("%%Storage%%", formattedStorage);

            collection_container.innerHTML += template;

            window.Collections.push(collection);
        });
    });
}

function create_video_element(video) {
    let template = document.getElementById("video_Template").innerHTML;

    if (video.status == 0) {
        return;
    }
    if (video.status == 2) {
        template = template.replace('<img src="%%Thumbnail%%">', "<span class='status'>Video processing...<a href='#'>What's This?</a></span>"); 
    }
    else if (video.status == 3) {
        template = template.replace('<img src="%%Thumbnail%%">', "<span class='status'>Video transcoding...<a href='#'>What's This?</a></span>");
    }
    else if (video.status > 4) {
        template = template.replace('<img src="%%Thumbnail%%">', "Error with video (0x0" + video.status + ")");
    }
    else {
        template = template.replace("%%Thumbnail%%", video.thumbnail); 
    }

    template = template.replace("%%Guid%%", video.guid);
    template = template.replaceAll("%%Name%%", video.title);


    let hours = 0;
    let minutes = 0;
    let seconds = video.length;

    while (seconds > 60) {
        seconds -= 60;
        minutes += 1;
    }            
    while (minutes > 60) {
        minutes -= 60;
        hours += 1;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (hours < 10) {
        hours = "0" + hours;
    }

    let durationStr = hours + ":" + minutes + ":" + seconds;
    template = template.replace("%%Duration%%", durationStr);

    let formattedStorage;
    if (video.storageSize > 1000000) {
        formattedStorage = video.storageSize / 1000 / 1000; // MB = collection.totalSize / 1000 / 1000 / 1000; // MB
        if (formattedStorage > 1000) {
            formattedStorage = formattedStorage / 1000;  // GB
            formattedStorage = Math.round(formattedStorage).toString() + " GB";
        }
        else {
            formattedStorage = Math.round(formattedStorage) + " MB";
        }
    }
    else {
        formattedStorage = ">1 MB";
    }

    if (video.status != 4) {
        formattedStorage = "N/A";
    }
    template = template.replace("%%Storage%%", formattedStorage);

    if (video.collectionId != "") {
        window.Collections.forEach((collection) => {
            if (collection.guid == video.collectionId) {
                template = template.replaceAll("%%Collection%%", collection.name);
            }
        })
    }
    else {
        template = template.replace('<span class="collection" title="%%Collection%%">%%Collection%%</span>', "");
    }

    video_container.innerHTML = template + video_container.innerHTML;
}

function sort_library(by) {
    if (by == "date (newest)") {
        window.Videos = window.Videos.sort(
            (first, second) => { 
                return Date.parse(first.dateUploaded) - Date.parse(second.dateUploaded)
            }
        )
    }
    else if (by == "size (largest)") {
        window.Videos = window.Videos.sort(
            (first, second) => { 
                return first.storageSize - second.storageSize
            }
        )
    }
    else if (by == "date (oldest)") {
        window.Videos = window.Videos.sort(
            (first, second) => { 
                return Date.parse(first.dateUploaded) - Date.parse(second.dateUploaded)
            }
        )
        window.Videos.reverse();
    }
    else if (by == "size (smallest)") {
        window.Videos = window.Videos.sort(
            (first, second) => { 
                return first.storageSize - second.storageSize
            }
        )
        window.Videos.reverse();
    }
    let video_container = document.getElementById("video_container");
    video_container.innerHTML = "";
    window.Videos.forEach( (video) => {
        create_video_element(video);
    })
}

async function populate_videos() {
    utility_DisplayAlertBarMessage({
        messageContent: "Loading Video Library...",
        length_ms: 3000
    });
    window.Videos = [];
    await RetrieveVideos().then((result) => {
        let video_container = document.getElementById("video_container");
        video_container.innerHTML = "";
        result.forEach((video) => {
            create_video_element(video);
            window.Videos.push(video);
        });
        if (window.Videos.length == 0) {
            let loader_El = document.getElementById("video_container").querySelector(".loader");
            loader_El.innerHTML = "<span>No videos found! <a href=#>Click here to upload</a> or drag & drop a file to get started.</span>";
        }
    });
    document.getElementById("sorter").value = "date (newest)";
    
}

function edit_collection(anchor_el) {
    let collection_element = anchor_el.parentNode.parentNode;
    let settings = collection_element.querySelector(".settings");
    let innerSettings = collection_element.querySelector("div[name='innerSettings']");
    let name_el = collection_element.querySelector(".name");

    if (settings.style.display == "none") {
        settings.style.display = "flex";
        innerSettings.style.display = "none";

        if (innerSettings.querySelector("a").innerText == "Confirm" && name_el.getAttribute("data-old-name") != null) {
            name_el.innerText = name_el.getAttribute("data-old-name");
            name_el.removeAttribute("data-old-name");
            name_el.contentEditable = false;
            innerSettings.querySelector("a").innerText == "Rename";
        }
        if (innerSettings.querySelectorAll("a")[1].innerText == "Are you sure?") {
            innerSettings.querySelectorAll("a")[1].innerText = "Delete";
        }
    }  
    else {
        settings.style.display = "none";
        innerSettings.style.display = "flex";
    }
}

function enter_keypress_sendevent(event, target) {
    if (event.key == "Enter") {
        event.preventDefault();

        target.focus();
        target.click();
    }
}

async function rename_collection(anchor_el) {
    let collection_element = anchor_el.parentNode.parentNode;
    let collection_name_element = collection_element.querySelector(".name");
    let collection_guid_element = collection_element.querySelector("guid");

    let collection_name = collection_name_element.innerText;
    let collection_guid = collection_guid_element.id;

    if (anchor_el.innerText != "Confirm") {
        // Rename clicked
        collection_name_element.setAttribute("data-old-name", collection_name);

        collection_name_element.contentEditable = true;
        collection_name_element.focus();
        setTimeout(() => {
            collection_name_element.setSelectionRange(0, -1);
        }, 10)

        anchor_el.innerText = "Confirm";
    }
    else {
        // Confirm clicked
        anchor_el.innerText = "Rename";

        collection_name_element.removeAttribute("data-old-name");
        collection_name_element.contentEditable = false;

        edit_collection(anchor_el); // resetting the collection element settings view

        let new_name = collection_name_element.innerText;

        await fetch("/library/collections/update", {
            method: "POST",
            headers: { // Setting cookie header to pass session information.
                "cookie": document.cookie,
                "accept": "application/json",
                "content-type": "application/json"
            },
            body: JSON.stringify({
                guid: collection_guid,
                name: new_name
            })
        }).then( (response) => {
            if (response.status != 200) {
                console.error(
                    "/library/collections/update - Collection update unsuccessful."
                );
                utility_DisplayAlertBarMessage({
                    messageContent: "Collection was not renamed! (" + response.status + ")",
                    length_ms: 3000,
                    type: "error"
                });
            }
            else {
                utility_DisplayAlertBarMessage({
                    messageContent: "Collection renamed successfully!",
                    length_ms: 3000,
                });
                window.Collections.forEach((collection, index) => {
                    if (collection.guid == collection_guid) {
                        collection.name = new_name;
                        window.Collections[index] = collection
                        if (window.SelectedCollection != null && window.SelectedCollection.guid == collection.guid) {
                            // untoggle -> toggle
                            change_collection_selection(collection_name_element);
                            change_collection_selection(collection_name_element);
                        }
                    }
                })
                return response;
            }
        }).then( (response) => { return response.json(); } );
        
    }
}

async function delete_collection(anchor_el) {
    let collection_element = anchor_el.parentNode.parentNode;
    let collection_guid = collection_element.querySelector("guid").id;
    let collection_name = collection_element.querySelector(".name").innerText;

    if (anchor_el.innerText == "Delete") {
        anchor_el.innerText = "Are you sure?";
        utility_DisplayAlertBarMessage({
            messageContent: "Are you sure you want to delete the collection, '" + collection_name + "' (Click again to confirm)",
            length_ms: 10000,
            type: "warning"
        });
        anchor_el.disabled = true;
        setTimeout(() => {
            anchor_el.disabled = false;
        }, 500);
        return;
    }
    else if (anchor_el.disabled) {
        return;
    }

    utility_DisplayAlertBarMessage({
        messageContent: "Deleting collection, '" + collection_name + "'...",
        length_ms: 3000,
        type: "error"
    });

    await fetch("/library/collections/delete", {
        method: "POST",
        headers: { // Setting cookie header to pass session information.
            "cookie": document.cookie,
            "accept": "application/json",
            "content-type": "application/json"
        },
        body: JSON.stringify({
            guid: collection_guid
        })
    }).then( (response) => {
        if (response.status != 200) {
            console.error(
                "/library/collections/delete - Collection deletion unsuccessful."
            );
            utility_DisplayAlertBarMessage({
                messageContent: "Collection was not deleted! (" + response.status + ")",
                length_ms: 3000,
                type: "error"
            });
        }
        else {
            if (window.SelectedCollection != null && window.SelectedCollection.guid == collection_guid) {
                change_collection_selection(null);
            }
            populate_collections();
            utility_DisplayAlertBarMessage({
                messageContent: "Collection '" + collection_name + "' deleted successfully!",
                length_ms: 3000
            });
            return response;
        }
    });
    
}

// Multi-upload support is very useful!

async function create_video_upload(file) {
    let selectedCollection = window.SelectedCollection
    let collection_guid;
    if (selectedCollection == null) {
        collection_guid = null;
    }
    else {
        collection_guid = selectedCollection.guid;
    }
    await fetch("/library/videos/create", {
        method: "POST",
        headers: {
            "cookie": document.cookie,
            "content-type": "application/json"
        },
        body: JSON.stringify({
            filename: file.name,
            collection: collection_guid
        })
    }).then( (response) => {
        if (response.status != 200) {
            console.error(
                "/library/videos/create - Video creation unsuccessful"
            );
            utility_DisplayAlertBarMessage({
                messageContent: "Creation of Video object failed! (" + response.status + ")",
                length_ms: 5000,
                type: "error"
            });
        }
        else {
            return response.json();
        }
    }).then( (upload_signature) => { 
        var upload = new tus.Upload(file, {
            endpoint: "https://video.bunnycdn.com/tusupload",
            retryDelays: [0, 3000, 5000, 10000, 20000, 60000, 60000],
            headers: {
                AuthorizationSignature: upload_signature.signature,
                AuthorizatioNExpire: upload_signature.expiration,
                VideoId: upload_signature.videoId,
                LibraryId: upload_signature.libraryId
            },
            metadata: {
                filetype: file.type,
                title: file.name,
                collection: collection_guid
            },
            onError: function (error) {
                console.error(error);
                utility_DisplayAlertBarMessage({
                    messageContent: "Upload of '" + file.name + "' has encountered a problem! Retrying...",
                    length_ms: 10000,
                    type: "error"
                });
            },
            onProgress: function (bytesUploaded, bytesTotal) {
                console.log(bytesUploaded, bytesTotal);
            },
            onSuccess: async function () {
                utility_DisplayAlertBarMessage({
                    messageContent: "Upload of '" + file.name + "' has finished successfully!",
                    length_ms: 10000,
                    type: "info"
                });

                // Retrieve video data with guid : upload_signature.videoId
                // create video element
                await fetch("/library/video", {
                    method: "GET",
                    headers: {
                        "cookie": document.cookie,
                        "video": upload_signature.videoId,
                        "accept": "application/json",
                        "content-type": "application/json"
                    }
                }).then( (response) => {
                    if (response.status == 200) {
                        return response.json();
                    }
                }).then( (video) => {
                    if (video != null && video != undefined) {
                        window.Videos.push(video);
                        create_video_element(video);
                    }
                })
            }
        });

        upload.findPreviousUploads().then(function (previousUploads) {
            if (previousUploads.length) {
                upload.resumeFromPreviousUpload(previousUploads[0]);
            }
            upload.start();
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

    window.Collections = [];
    populate_collections();
    window.SelectedCollection = null;

    window.Videos = [];
    populate_videos();
    window.SelectedVideo = null;

    window.CurrentVideoFile = null;
    window.VideoFileInput = document.getElementById("video_upload_container");
    window.VideoFileInput.onchange = function () {
        console.log(window.VideoFileInput.files);
        for (const file of window.VideoFileInput.files) {
            create_video_upload(file);
        }
    }
}
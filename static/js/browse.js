window.initialized = false;
window.onload = (function() {
    init();
    initialized = true;
})

async function init() {
    if (initialized) {
        return;
    }
    global_init();

    window.display_CenterBox = document.getElementById("centerBox");

    window.Feeds = [
        {
            "feed.URL": "https://openbroadcast.b-cdn.net/feeds/MostRecent.xml",
            "feed.Title": null,
            "feed.Channel": null,
        }
    ];

    window.Feeds.forEach( (feedObj) => {
        feedURL = feedObj['feed.URL'];
        IngestXMLFeed({
            feedURL: feedURL
        }).then( (result) => {
            if (result == null) {
                console.error("Error loading feed at " + feedURL);
            }
            else {
                feedObj['feed.Channel'] = result;
                
                feedObj['feed.Channel'].childNodes.forEach( (node) => {
                    if (node.tagName == "irc:gridrowtitle") {
                        feedObj['feed.Title'] = node.textContent;
                    }
                }); 

                CreateChannelRow({ channel: feedObj['feed.Channel'] });
            }
        });
    });
}

async function CreateChannelRow({ channel }) {
    if (channel == null) {
        console.error("CreateChannelRow() : channel is not set!");
        return null;
    }

    let feedContainer = document.createElement("div");
    feedContainer.setAttribute("class", "feedContainer");

    let feedTitle = document.createElement("h2");
    feedContainer.appendChild(feedTitle);

    let channelRow = document.createElement("div");
    channelRow.setAttribute("class", "channelRow");
    feedContainer.appendChild(channelRow)

    let channelRowTemplate = document.getElementById("channelRowTemplate").innerHTML;
    channelRow.innerHTML = channelRowTemplate;
    channel.childNodes.forEach( (node) => {
        if (node.tagName == "irc:gridrowtitle") {
            feedTitle.innerText = node.textContent;
        }
        if (node.tagName == "item") {
            rowItem = document.createElement("div");
            rowItem.setAttribute("class", "channelItem");

            let rowItemTemplate = document.getElementById("channelItemTemplate").innerHTML;
            rowItem.innerHTML = rowItemTemplate;

            node.childNodes.forEach( (itemAttribute) => {
                replacement_value = itemAttribute.textContent;

                if (itemAttribute.tagName == "irc:length") {
                    replacement_value = CreateDurationString({ durationSec: replacement_value});
                }
                else if (itemAttribute.tagName == "irc:releasedate") {
                    rowItem.innerHTML = rowItem.innerHTML.replaceAll("%unparsed_releasedate%", replacement_value);
                    replacement_value = CreateDateString({ dateStr: replacement_value});
                }
                else if (itemAttribute.tagName == "irc:poster") {
                    let videoId = itemAttribute.textContent.split("/thumbnails/")[1].split(".")[0];
                    rowItem.innerHTML = rowItem.innerHTML.replaceAll("%video_id%", videoId);
                }
                rowItem.innerHTML = rowItem.innerHTML.replaceAll("%" + itemAttribute.tagName + "%", replacement_value);
            });

            channelRow.appendChild(rowItem);
        }
    });

    display_CenterBox.appendChild(feedContainer);
}

async function IngestXMLFeed({ feedURL }) {
    if (feedURL == null) {
        console.error("LoadXMLFeed() : feedURL is not set!");
        return null;
    }

    let XML_FetchData_RAW = await fetch(feedURL, { 
        method: "GET", 
        mode: "cors"
    }).then( (response) => {
        if (response.status != 200) {
            console.error(feedURL + " | fetch was unsuccessful!");
            return null;
        }
        else {
            return response;
        }
    }).then( (response) => response.text());


    XML_Parser = new DOMParser();
    XML_Data = XML_Parser.parseFromString(XML_FetchData_RAW, "text/xml");

    let XML_ChannelNode = null;
    XML_Data.documentElement.childNodes.forEach( (element) => {
        if (element.tagName == "channel") {
            XML_ChannelNode = element;
        }
    });
    
    if (XML_ChannelNode == null) {
        console.error(feedURL + " | No channel node was found!");
        return null;
    }
    return XML_ChannelNode;
}

function CreateDateString({ dateStr }) {
    date_components = dateStr.split(" ");

    // Probably a better way of doing this.
    month = date_components[0];
    day = date_components[1];
    year = date_components[2];

    months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
    month = months.indexOf(month.toLowerCase()) + 1;
    if (month < 10) {
        month = "0" + month;
    }
    else {
        month = month.toString();
    }

    if (day < 10) day = "0" + day;

    return month + "/" + day + "/" + year;
}



function CreateDurationString({ durationSec }) {
    minutes = durationSec / 60;
    minutes = Math.floor(minutes);
    if (minutes < 10) {
      minutes = "0" + minutes;
    }

    seconds = durationSec % 60;
    seconds = Math.floor(seconds);
    if (seconds < 10) {
      seconds = "0" + seconds;
    }

    return minutes + ":" + seconds;
}

function CopyVideoId(videoId_Element) {
    videoId_Element.select();
    videoId_Element.setSelectionRange(0, 20);

    navigator.clipboard.writeText(videoId_Element.value);

    videoId_Element.innerText = "Video ID Copied!";
    setTimeout(() => {
        videoId_Element.innerText = videoId_Element.value;
    }, 3000);
}
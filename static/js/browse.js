














async function init() {
    global_init();

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
                    if (node.tagName == "item") {
                        console.log(node);
                    }
                    else if (node.tagName == "irc:gridrowtitle") {
                        feedObj['feed.Title'] = node.textContent;
                    }
                }); 
            }
        });
    });
}

async function IngestXMLFeed({ feedURL }) {
    if (feedURL == null) console.error("LoadXMLFeed() : feedURL is not set!");

    let XML_FetchData_RAW = await fetch(feedURL, { method: "GET", mode: "cors" }).then( (response) => {
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

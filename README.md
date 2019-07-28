# CPP-browser-extension

This is the English version of a browser extension we implemented for a diary study about contextual privacy policies (CPPs). CPPs embed relevant information from privacy policies directly in the user's current context of use.
For further information about this study, please submit an issue or otherwise get in contact with the maintainers of this repository. We will gladly share our seminar paper with you.
The extension is functional on Chrome, Firefox and Edge browsers. CPPs are displayed in different situations on 7 different websites: Google Search, Youtube, Facebook, Twitter, Ebay, Ebay Kleinanzeigen and Amazon. 

## To try out the extension: 

### For Firefox:
There are two ways to try out the extension on Firefox. 
- You drag the .xpi file from this repository into any open browser window.
- You install it in the developer's options. See https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Temporary_Installation_in_Firefox for a detailed description.

### For Chrome: 
1. Open the Extension Management page by typing "chrome://extensions" into the browser's address bar. 
2. Enable Developer Mode by clicking the toggle switch next to "Developer mode".
3. Click the "load unpacked" button and select the extension directory. 

### For Edge: 
Install it in the developer's options. See https://docs.microsoft.com/en-us/microsoft-edge/extensions/guides/adding-and-removing-extensions for a detailed description.


## Our plugin logs data
During the usage of the plugin, a pop-up will appear repeatedly, asking for feedback on just seen CPPs. This is part of the logic of the diary study. Users can also give feedback using a browser toolbar icon. All data collected by this extension is saved on the user's computer, in the extension's local storage. 

### To read data from the local-storage on Firefox:
1. Type "about:debugging" into the adressbar of the browser
2. Activate the debugging of add-ons by setting the appropriate check-mark
3. Click on "Debugging" for the ContextualPP-extension – a separate window will open
4. Select the console in that separate window.
5. Enter the following code into the console and press "Enter" afterwards:
```javascript
window.browser.storage.local.get(null, function(items) {
var blob = new Blob([JSON.stringify(items, null,' ')], {type: "text/plain"});
var url = URL.createObjectURL(blob);
window.browser.tabs.create({ url: url }); // extension has the "tabs" permission to make this work
window.browser.downloads.download({ url: url }); // extension has the "downloads" permission to make this work
});
```
This opens a separate tab in your browser and downloads the local-storage of the extension.
6. In your Downloads-Folder there should be a document called "download" now. It probably doesn't have a file type, but this document is a .json-file, which contains the logdata, diary entries and feedback entries from the usage of the plugin.


### To read data from the local-storage on Chrome:
1. Install the extension Storage Area Explorer (https://chrome.google.com/webstore/detail/storage-area-explorer/ocfjjjjhkpapocigimmppepjgfdecjkb) 
2. Go to the extensions page by typing chrome://extensions/ into the address bar of the browser.
3. Activate debugging of the extension by toggling the toggle-button at the bottom right corner of the card for the ContextualPP-extension.
4. Click on the blue link for the background page – a new window will open. 
5. The left most tab on this window will be "Storage Explorer". Select this tab. 
6. You can export the data by clicking on the "Export"-button in the sub-tab named "chrome.storage.local"

### To read data from the local-storage on Edge:
- currently not possible. You are invited to share a way of downloading data from the extension's local storage on Edge. Please let us know in an issue or contact us otherwise, so we can update this read-me.

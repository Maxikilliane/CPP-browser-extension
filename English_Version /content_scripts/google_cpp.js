(function() {
    /**
     * Check and set a global guard variable.
     * If this content script is injected into the same page again,
     * it will do nothing next time.
     */
    if (window.hasRun) {
      return;
    }
    window.hasRun = true;

    /**
     * Support different browsers with namespace definitions
     */
    window.browser = (function() {
      return window.msBrowser || window.browser || chrome;
    })();

    HtmlSanitizer.AllowedTags['img'] = true;
    HtmlSanitizer.AllowedTags['input'] = true;
    HtmlSanitizer.AllowedTags['textarea'] = true;
    HtmlSanitizer.AllowedTags['button'] = true;
    HtmlSanitizer.AllowedCssStyles['display'] = true;
    HtmlSanitizer.AllowedAttributes['id'] = true;
    HtmlSanitizer.AllowedAttributes['class'] = true;
    HtmlSanitizer.AllowedAttributes['name'] = true;
    HtmlSanitizer.AllowedAttributes['type'] = true;
    HtmlSanitizer.AllowedAttributes['value'] = true;
    HtmlSanitizer.AllowedAttributes['rows'] = true;
    HtmlSanitizer.AllowedAttributes['cols'] = true;


    let cppTexts = {
        googleWhat: "What does Google store and collect?",
        googleWhy: "Why?",
        googleWhen: "In which siutation?",
        googleStartPage: "When using Google.",
        googleStartWhat: ["Information about the apps, browsers and devices you use, such as", "IP Address", "System Activity", "Crash Reports", "Date", "Time", "Referrer Request URL"],
        googleStartWhy: ["To Personalize Content", "To publicly share information that does not identify a single person, such as content owners, publishers or developers"],
        cppIdStart: "google_Start",

        googleSearch: "When using Google Search.",
        googleSearchWhat:["Your search queries", "Third Party Sites Using Google Services, Including a Google Captcha for example"], googleSearchWhy: ["Match content to you", "publicly share information that does not identify a single person, such as content owners, publishers or developers"],
        cppIdSearch: "google_Search",
        googleAdsWhat: ["Information about viewing advertising", "Information about interaction with advertising", "Purchases that you do"],
        googleAdsWhy: ["To match advertising to you", "To publicly share information that does not lead to the personal identification of an individual, such as rights owners, publishers or developers"],
        cppIdAds: "google_Ad",
        googleLocationWhat:["Location-specific data collected by various methods, eg", "GPS", "Your IP address", "Sensors on the device (e.g. motion sensors on the mobile phone)", "Information near the device, e.g. wifi access points, mobile towers or bluetooth equipment"],
        googleLocationWhy: ["For personalization, i.e. adaptation of content and advertisements to you"],
        cppIdLocation: "google_Location"
    };



    fetch(browser.extension.getURL('diary/diary.html'))
    .then(response => response.text())
    .then(data => {
        div = document.createElement('div');
        div.innerHTML = data.trim();
        document.body.insertAdjacentElement("beforeend", div);

    }).catch(err => {
        // handle error
    });




    let searchField = document.getElementsByClassName("gLFyf")[0];
    searchField.addEventListener("input", addCpp);

    let adsContainer = document.getElementsByClassName("cu-container"); // box with selection of items to purchase
    if (adsContainer.length === 0) {
        adsContainer = document.getElementsByClassName("ads-ad"); // search result as ad
        if (adsContainer.length !== 0) {
            adsContainer = adsContainer[0].parentNode
        }
    } else {
        adsContainer = adsContainer[adsContainer.length - 1];
    }
    if (adsContainer.length !== 0) {
        deletePreviousCpp();
        displayCpp(null, adsContainer, "beforeend", cppTexts.cppIdAds, cppTexts.googleWhat, cppTexts.googleWhy, null, cppTexts.googleAdsWhat, cppTexts.googleAdsWhy);

    } else {
    // no ads CPP
    }

    /**
     * function to detect when scrollbar reaches the bottom of page, some code from https://coursesweb.net/javascript/
     */
    let whenScrollBottom = function() {
        let windowHeight = (self.innerHeight) ? self.innerHeight : document.body.clientHeight; // gets window height
        // gets current vertical scrollbar position
        let scrollPos = window.pageYOffset ? window.pageYOffset : document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop;
        // if scrollbar reaches bottom
        if (document.body.scrollHeight <= (scrollPos + windowHeight)) {
            if(window.location.href.indexOf("search") !== -1){//not on startpage
                deletePreviousCpp();
                let bottomInfoBar = document.getElementById("fbar");
                displayCpp(null, bottomInfoBar, "afterbegin", cppTexts.cppIdLocation, cppTexts.googleWhat, cppTexts.googleWhy, null, cppTexts.googleLocationWhat, cppTexts.googleLocationWhy);
            }
        }
    }
    // register event on scrollbar
    window.onscroll = whenScrollBottom;

    /**
     * Determine where to add the CPP
     */
    function addCpp() {
        deletePreviousCpp();

        if (window.location.href.indexOf("search") === -1) { //We are on the start page
            let parentElem = document.getElementById("searchform");
            displayCpp(cppTexts.googleStartPage, parentElem, "afterbegin", cppTexts.cppIdStart, cppTexts.googleWhat, cppTexts.googleWhy, cppTexts.googleWhen, cppTexts.googleStartWhat, cppTexts.googleStartWhy);
        } else { // We are on the results page
            let parentElem = document.getElementById("top_nav");
            displayCpp(cppTexts.googleSearch, parentElem, "beforebegin", cppTexts.cppIdSearch, cppTexts.googleWhat, cppTexts.googleWhy, cppTexts.googleWhen, cppTexts.googleSearchWhat, cppTexts.googleSearchWhy);

        }

    };

    /**
     * Delete all CPP currently in the DOM
     */
    function deletePreviousCpp() {
        let cppBoxes = document.getElementsByClassName("cppBox");
        for (let i = 0; i < cppBoxes.length; i++) {
            let cppBox = cppBoxes[i];
            cppBox.parentNode.removeChild(cppBox);
        }
    };

    /**
     * Insert CPP into the DOM
     */

    function displayCpp(content, parentElem, locationAdjacent, cppId, what, why, when, whatEntries, whyEntries) {
        let cpp = document.createElement("div");
        cpp.classList.add("cppBox");
        var logo = document.createElement("img");
        logo.src = browser.runtime.getURL("icons/icon_bigger.png");
        cpp.appendChild(logo);

        // what is collected
        let headingWhat = document.createElement("h3")
        headingWhat.innerHTML = HtmlSanitizer.SanitizeHtml(what);
        cpp.appendChild(headingWhat);

        var whatList = document.createElement("UL");
        for (entry in whatEntries) {
          let listElement = document.createElement("LI");
          let text = document.createTextNode(whatEntries[entry]);
          listElement.appendChild(text);
          whatList.appendChild(listElement);
        }
        cpp.appendChild(whatList);


        // situation in which it is collected
        if (content !== null){
            let headingWhen = document.createElement("h3")
            headingWhen.innerHTML = HtmlSanitizer.SanitizeHtml(when);
            cpp.appendChild(headingWhen);
            let situation = document.createElement("p");
            situation.innerHTML = HtmlSanitizer.SanitizeHtml(content);
            cpp.appendChild(situation);
        }

        // why is it collected
        var headingWhy = document.createElement("h3")
        headingWhy.innerHTML = HtmlSanitizer.SanitizeHtml(why);
        cpp.classList.add("cppBox");
        cpp.appendChild(headingWhy);
        var whyList = document.createElement("UL");
        for (entry in whyEntries) {
          var listElement = document.createElement("LI");
          var text = document.createTextNode(whyEntries[entry]);
          listElement.appendChild(text);
          whyList.appendChild(listElement);
        }
        cpp.appendChild(whyList)


        parentElem.insertAdjacentElement(locationAdjacent, cpp);
        sendCPPTimeToBackgroundPage(cppId, cpp.innerHTML);
    };


    /**
     * Listen for messages from the background script.
     */
    window.browser.runtime.onMessage.addListener(function(message){
        if (message.command === "showDiary") {
            setTimeout(function() {

                let diary = document.getElementById("diaryModal");
                let logo = document.getElementById("cpp_logo");
                logo.src = browser.runtime.getURL("icons/icon_bigger.png");

                let exampleCpp = document.getElementById("displayedCppText");
                exampleCpp.innerHTML = HtmlSanitizer.SanitizeHtml(message.cppText);
                diary.style.display = "block";
                let submitButton = document.getElementById("submitDiary");
                submitButton.addEventListener("click", function(){
                    diary.style.display = "none";
                    let diaryEntry = getDataFromDiary();
                    sendDiaryToBackgroundPage(diaryEntry, message.cppId);
                });

                let closeButton = document.getElementById("closeDiary");
                    closeButton.addEventListener("click", function(){

                        diary.style.display = "none";
                        window.browser.runtime.sendMessage({
                            message: "diaryClosed",
                            cppId: message.cppId,
                            diaryTime: new Date()
                        },
                        function(response) {
                        });
                    });

            }, 4000);
        }
    });

    function sendCPPTimeToBackgroundPage(cppId, cppElement){
        window.browser.runtime.sendMessage({
            message: "cppTime",
            cppTime: new Date(),
            cppSite: "Google",
            cppId: cppId,
            cppText: cppElement
        },
        function(response) {
        });
        //sending.then(handleResponse, handleError);

    }



    function sendDiaryToBackgroundPage(diaryEntry, cppId) {
        window.browser.runtime.sendMessage({
            message: "diaryEntry",
            diaryTime: new Date(),
            diaryEntry: diaryEntry,
            cppId: cppId
        },
        function(response) {
        });
        //sending.then(handleResponse, handleError);
    }


    /**
     * Extract values from diary form
     */
    function getDataFromDiary(){
        let question1 = document.getElementById("use");
        let usefulness = sanitizeHTML(question1.value);

        let selectedQuestion2 = document.querySelector('input[name="change"]:checked');
        let willChange = "NA";
        if (selectedQuestion2 !== null){
            willChange = sanitizeHTML(selectedQuestion2.value);
        }
        let question3 = document.getElementById("changeExplanation");
        let changeExplanation = sanitizeHTML(question3.value);

        let selectedQuestion4 = document.querySelector('input[name="relevant"]:checked');
        let relevance = 0;
        if (selectedQuestion4 !== null){
            relevance = sanitizeHTML(selectedQuestion4.value);
        }

        return {usefulness: usefulness, willChange: willChange, changeExplanation: changeExplanation, relevance: relevance}
    }

    /**
     * Sanitize and encode all HTML in a user-submitted string
     * (c) 2018 Chris Ferdinandi, MIT License, https://gomakethings.com
     * @param  {String} str  The user-submitted string
     * @return {String} str  The sanitized string
     */
    function sanitizeHTML(str) {
        let temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    };


})();

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
        youtubeWhat: "Was speichert und sammelt Google (das Mutterunternehmen von Youtube)?",
        youtubeWhy: "Wozu?",

        youtubeVideoWhat: ["Informationen über Aktivitäten, die Du im Internet unternimmst, z.B.", "Videos, die Du auf Youtube anschaust", "Interaktion mit Inhalten, z.B. Liken/Disliken oder Kommentieren"] ,
        youtubeVideoWhy: ["Personalisierung von Inhalten"],
        cppIdVideo: "youtube_Video",

        youtubeAdWhat: ["Information über das Ansehen von Werbung", "Information über die Interaktion mit Werbung", "Käufe, die Du tätigst"],
        youtubeAdWhy: ["Anzeigen personalisieren", "Information, die nicht zur Identifizierung einer einzelnen Person führt, öffentlich teilen, z.B. mit Rechteinhabern, Publishern oder Entwicklern"],
        cppIdAd: "youtube_Ad"
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

    // make sure the DOM is loaded
    let readyStateCheckInterval = setInterval(function() {
        if (document.readyState === "complete") {
            clearInterval(readyStateCheckInterval);



            // When viewing an ad at the top of the page
            let topOfPageAd = document.getElementById("masthead-ad");
            if (topOfPageAd !== null) {
                deletePreviousCpp(cppTexts.cppIdAd);
                displayCpp(topOfPageAd, "beforeend", cppTexts.cppIdAd, cppTexts.youtubeWhat, cppTexts.youtubeWhy, cppTexts.youtubeAdWhat, cppTexts.youtubeAdWhy);
            }

            // When clicking on a youtube Video
            let youtubePlayer = document.getElementById("movie_player");
            let cppBoxContainer = youtubePlayer.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode;
            if (youtubePlayer !== null) {
                let currentUrl = window.location.href;
                if (currentUrl.indexOf("watch") !== -1){
                    deletePreviousCpp(cppTexts.cppIdVideo);
                    displayCpp(cppBoxContainer, "afterend", cppTexts.cppIdVideo, cppTexts.youtubeWhat, cppTexts.youtubeWhy, cppTexts.youtubeVideoWhat, cppTexts.youtubeVideoWhy);
                }
            }

            // When ad below video
            let videoAd = document.getElementById("player-ads");
            if (videoAd !== null) {
                deletePreviousCpp(cppTexts.cppIdAd);
                displayCpp(videoAd, "beforeend", cppTexts.cppIdAd, cppTexts.youtubeWhat, cppTexts.youtubeWhy, cppTexts.youtubeAdWhat, cppTexts.youtubeAdWhy);
            }
        }
    }, 10);

    /**
     * Delete all CPP currently in the DOM
     * If given a cppId, delete only those CPP which have name="cppId"
     */
    function deletePreviousCpp(cppId) {
        if(cppId !== null){
            let cppBoxes = document.getElementsByName(cppId);
            for (let i = 0; i < cppBoxes.length; i++) {
                let cppBox = cppBoxes[i];
                cppBox.parentNode.removeChild(cppBox);
            }

        }else{
            let cppBoxes = document.getElementsByClassName("cppBox");
            for (let i = 0; i < cppBoxes.length; i++) {
                let cppBox = cppBoxes[i];
                cppBox.parentNode.removeChild(cppBox);
            }
        }

    };

    /**
      * Insert CPP into the DOM
      */
    function displayCpp(parentElem, locationAdjacent, cppId, what, why, whatEntries, whyEntries){
        let cpp = document.createElement("div");
        cpp.classList.add("cppBox");
        var logo = document.createElement("img");
        logo.src = browser.runtime.getURL("icons/icon_bigger.png");
        cpp.appendChild(logo);
        cpp.setAttribute("name", cppId);

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
            // do that when we get the message to show diary entry
            setTimeout(function(){
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
        } else if (message.data === "urlPathChanged") {
            setTimeout(function() {

                fetch(browser.extension.getURL('diary/diary.html'))
                .then(response => response.text())
                .then(data => {
                    div = document.createElement('div');
                    div.innerHTML = HtmlSanitizer.SanitizeHtml(data.trim());
                    document.body.insertAdjacentElement("beforeend", div);
                }).catch(err => {
                    // handle error
                });

                let readyStateCheckInterval = setInterval(function() {
                    if (document.readyState === "complete") {
                        clearInterval(readyStateCheckInterval);


                        // When viewing an ad at the top of the page
                        let topOfPageAd = document.getElementById("masthead-ad");
                        if (topOfPageAd !== null) {
                            //deletePreviousCpp();
                            deletePreviousCpp(cppTexts.cppIdAd);
                            displayCpp(topOfPageAd, "beforeend", cppTexts.cppIdAd, cppTexts.youtubeWhat, cppTexts.youtubeWhy, cppTexts.youtubeAdWhat, cppTexts.youtubeAdWhy);
                        }

                        // When ad below video
                        let videoAd = document.getElementById("player-ads");
                        if (videoAd !== null) {
                            deletePreviousCpp(cppTexts.cppIdAd);
                            displayCpp(videoAd, "beforeend", cppTexts.cppIdAd, cppTexts.youtubeWhat, cppTexts.youtubeWhy, cppTexts.youtubeAdWhat, cppTexts.youtubeAdWhy);
                        }

                        // When clicking on a youtube Video
                        let youtubePlayer = document.getElementById("movie_player");
                        let cppBoxContainer = youtubePlayer.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode;
                        if (youtubePlayer !== null) {
                            let currentUrl = window.location.href;
                            // only display when actually watching videos, not on startpage
                            if (currentUrl.indexOf("watch") !== -1){
                                deletePreviousCpp(cppTexts.cppIdVideo);
                                displayCpp(cppBoxContainer, "afterend", cppTexts.cppIdVideo, cppTexts.youtubeWhat, cppTexts.youtubeWhy, cppTexts.youtubeVideoWhat, cppTexts.youtubeVideoWhy);
                            }
                        }


                    }
                }, 10);




            }, 2000);
        }

    });

    function sendCPPTimeToBackgroundPage(cppId, cppElement) {
        window.browser.runtime.sendMessage({
            message: "cppTime",
            cppTime: new Date(),
            cppSite: "YouTube",
            cppId: cppId,
            cppText: cppElement
        }, function(response){
            });
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

    function getDataFromDiary(){
        let question1 = document.getElementById("use");
        let usefulness = sanitizeHTML(question1.value);

        let selectedQuestion2 = document.querySelector('input[name="change"]:checked');
        let willChange = "NA";
        if (selectedQuestion2 !== null){
            willChange = sanitizeHTML(selectedQuestion2.value)
        }
        let question3 = document.getElementById("changeExplanation");
        let changeExplanation = sanitizeHTML(question3.value);

        let selectedQuestion4 = document.querySelector('input[name="relevant"]:checked');
        let relevance = 0;
        if (selectedQuestion4 !== null){
            relevance = sanitizeHTML(selectedQuestion4.value);
        }

        return {usefulness: usefulness, willChange: willChange, changeExplanation: changeExplanation, relevance: relevance};
    }


    /*!
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

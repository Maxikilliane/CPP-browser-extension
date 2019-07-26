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
    return window.msBrowser || chrome;
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
    twitterWhat: "Was speichert und sammelt Twitter?",
    twitterWhy: "Wozu?",
    twitterWhen: "In welcher Situation?",
    twitterBrowse: "Wenn Du dir Tweets ansiehst, auch wenn Du dafür nicht bei Twitter angemeldet bist",
    twitterBrowseWhat: ["Einzelne personenbezogene Informationen, z.B.", "Die Art von Gerät, das Du verwendest", "Deine IP-Adresse"],
    twitterBrowseWhy: ["Um Inhalte wie angezeigte Tweets zu personalisieren", "Um Anzeigen auf Dich abzustimmen"],
    cppIdTwitterBrowse: "twitter_browse",
    twitterTweet: "Wenn Du einen Tweet schreibst",
    twitterTweetWhat: ["Die Inhalte in Deinem Tweet"],
    twitterTweetWhy: ["Um Deinen Tweet zu veröffentlichen (in den Defaulteinstellungen ist der Tweet komplett öffentlich und das gesamte Internet hat darauf Zugriff)", "Um relevantere Inhalte anzuzeigen"],
    cppIdTwitterTweet: "twitter_tweet",
  };

  let diaryElement = document.getElementById("diaryModal");
  if (diaryElement === null) {
    fetch(browser.extension.getURL('diary/diary.html'))
      .then(response => response.text())
      .then(data => {
        div = document.createElement('div');
        div.innerHTML = data.trim();
        document.body.insertAdjacentElement("afterend", div);
      }).catch(err => {
        // handle error
      });
  }


  let userElement = document.getElementById("user-dropdown-toggle");
  if (userElement !== null) { //user is signed in
    let tweetField = document.getElementById("tweet-box-home-timeline");
    if (tweetField !== null) {
      tweetField.addEventListener("input", function() {
        deletePreviousCpp();
        let parentElem = tweetField.parentNode.parentNode.parentNode.parentNode;
        if (parentElem !== null) {
          displayCpp(cppTexts.twitterTweet, parentElem, "beforeend", cppTexts.cppIdTwitterTweet, cppTexts.twitterWhat, cppTexts.twitterWhy, cppTexts.twitterWhen, cppTexts.twitterTweetWhat, cppTexts.twitterTweetWhy);
        }
      });
    }
  } else { // user is not signed in
    let parentElem = document.getElementById("page-container");

    if (parentElem !== null) {
      displayCpp(cppTexts.twitterBrowse, parentElem, "afterbegin", cppTexts.cppIdTwitterBrowse, cppTexts.twitterWhat, cppTexts.twitterWhy, cppTexts.twitterWhen, cppTexts.twitterBrowseWhat, cppTexts.twitterBrowseWhy);
    }
  }

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
    if (content !== null) {
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
  window.browser.runtime.onMessage.addListener(function(message) {
    if (message.command === "showDiary") {
      setTimeout(function() {

        let diary = document.getElementById("diaryModal");

        let logo = document.getElementById("cpp_logo");
        logo.src = browser.runtime.getURL("icons/icon_bigger.png");

        let exampleCpp = document.getElementById("displayedCppText");
        exampleCpp.innerHTML = HtmlSanitizer.SanitizeHtml(message.cppText);
        diary.style.display = "block";
        let submitButton = document.getElementById("submitDiary");
        submitButton.addEventListener("click", function() {
          diary.style.display = "none";
          let diaryEntry = getDataFromDiary();
          sendDiaryToBackgroundPage(diaryEntry, message.cppId);
        });

        let closeButton = document.getElementById("closeDiary");
        closeButton.addEventListener("click", function() {

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
    }  else if (message.data === "urlPathChanged") {

      setTimeout(function() {


        let diaryElement = document.getElementById("diaryModal");
        if (diaryElement === null) {
          fetch(browser.extension.getURL('diary/diary.html'))
            .then(response => response.text())
            .then(data => {
              div = document.createElement('div');
              div.innerHTML = HtmlSanitizer.SanitizeHtml(data.trim());
              document.body.insertAdjacentElement("afterend", div);
            }).catch(err => {
              // handle error
            });
        }

        let readyStateCheckInterval = setInterval(function() {
          if (document.readyState === "complete") {
            clearInterval(readyStateCheckInterval);

            let userElement = document.getElementById("user-dropdown-toggle");
            if (userElement !== null) { //user is signed in
              let tweetField = document.getElementById("tweet-box-home-timeline");
              if (tweetField !== null) {
                tweetField.addEventListener("input", function() {
                  deletePreviousCpp();
                  let parentElem = tweetField.parentNode.parentNode.parentNode.parentNode;

                  if (parentElem !== null) {
                    deletePreviousCpp();
                    displayCpp(cppTexts.twitterTweet, parentElem, "beforeend", cppTexts.cppIdTwitterTweet, cppTexts.twitterWhat, cppTexts.twitterWhy, cppTexts.twitterWhen, cppTexts.twitterTweetWhat, cppTexts.twitterTweetWhy);
                  }
                });
              }
            } else { // user is not signed in
              let parentElem = document.getElementById("page-container");
              if (parentElem !== null) {
                deletePreviousCpp();
                displayCpp(cppTexts.twitterBrowse, parentElem, "afterbegin", cppTexts.cppIdTwitterBrowse, cppTexts.twitterWhat, cppTexts.twitterWhy, cppTexts.twitterWhen, cppTexts.twitterBrowseWhat, cppTexts.twitterBrowseWhy);
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
        cppSite: "Twitter",
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
  function getDataFromDiary() {
    let question1 = document.getElementById("use");
    let usefulness = sanitizeHTML(question1.value);

    let selectedQuestion2 = document.querySelector('input[name="change"]:checked');
    let willChange = "NA";
    if (selectedQuestion2 !== null) {
      willChange = sanitizeHTML(selectedQuestion2.value);
    }

    let question3 = document.getElementById("changeExplanation");
    let changeExplanation = sanitizeHTML(question3.value);

    let selectedQuestion4 = document.querySelector('input[name="relevant"]:checked');
    let relevance = 0;
    if (selectedQuestion4 !== null) {
      relevance = sanitizeHTML(selectedQuestion4.value);
    }

    return {
      usefulness: usefulness,
      willChange: willChange,
      changeExplanation: changeExplanation,
      relevance: relevance
    }
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

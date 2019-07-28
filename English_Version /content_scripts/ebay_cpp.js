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
    ebayWhat: "What does Ebay store and collect?",
    ebayWhy: "Why?",

    ebaySocialMediaWhatEntries: ["Facebook automatically gives access to personally identifiable information, such as content you've viewed or liked, information about the ads you've been shown or you've clicked on, and more."],
    ebaySocialMediaWhyEntries: ["So that Facebook advertising can be better personalized to you."],

    ebaySearchWhatEntries: ["Your browsing history data","Your location","How often and when you visit Ebay.de","Everything you generate: clicks articles, articles on the watchlist, articles in the shopping cart, etc."],
    ebaySearchWhyEntries: ["To match advertising exactly to you."],
    cppIdSearch: "ebay_Search",
    cppIdSocialMedia: "ebay_SocialMedia"
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

  let signInFB = document.getElementById("signin_fb_btn");
  if (signInFB != null) {
    signInFB.addEventListener("click", addCpp);
  }

  let searchField = document.getElementsByClassName("gh-tb ui-autocomplete-input")[0];
  if (searchField != null) {
    searchField.addEventListener("input", addCppSearch)
  }

  function addCppSearch() {
    deletePreviousCpp();
    let parentElem = document.getElementById("mainContent");
    displayCpp(cppTexts.ebayWhat, cppTexts.ebaySearchWhatEntries, cppTexts.ebayWhy, cppTexts.ebaySearchWhyEntries, parentElem, "beforebegin", cppTexts.cppIdSearch);
  }
  /**
   * Determine where to add the CPP
   */
  function addCpp() {
    deletePreviousCpp();
    let parentElem = document.getElementById("StaySignedInContainer");
    displayCpp(cppTexts.ebayWhat, cppTexts.ebaySocialMediaWhatEntries, cppTexts.ebayWhy, cppTexts.ebaySocialMediaWhyEntries, parentElem, "beforebegin", cppTexts.cppIdSocialMedia);
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
  function displayCpp(ebaySearchWhat, ebaySearchWhatEntries, ebaySearchWhy, ebaySearchWhyEntries, parentElem, locationAdjacent, cppId) {
    let cpp = document.createElement("div");

    // what does ebay collect
    var logo = document.createElement("img");
    logo.src = browser.runtime.getURL("icons/icon_bigger.png");
    cpp.appendChild(logo);

    var headingWhat = document.createElement("h3")
    headingWhat.innerHTML = HtmlSanitizer.SanitizeHtml(ebaySearchWhat);
    cpp.classList.add("cppBox");
    cpp.appendChild(headingWhat);
    var list = document.createElement("UL");
    for (entry in ebaySearchWhatEntries) {
      var listElement = document.createElement("LI");
      var text = document.createTextNode(ebaySearchWhatEntries[entry]);
      listElement.appendChild(text);
      list.appendChild(listElement);
    }
    cpp.appendChild(list);

    // why does ebay collect
    var headingWhy = document.createElement("h3")
    headingWhy.innerHTML = HtmlSanitizer.SanitizeHtml(ebaySearchWhy);
    cpp.classList.add("cppBox");
    cpp.appendChild(headingWhy);
    var list = document.createElement("UL");
    for (entry in ebaySearchWhyEntries) {
      var listElement = document.createElement("LI");
      var text = document.createTextNode(ebaySearchWhyEntries[entry]);
      listElement.appendChild(text);
      list.appendChild(listElement);
    }
    cpp.appendChild(list);


    parentElem.insertAdjacentElement(locationAdjacent, cpp);
    sendCPPTimeToBackgroundPage(cppId, cpp.innerHTML);

  };

  function sendCPPTimeToBackgroundPage(cppId, cppElement) {
    window.browser.runtime.sendMessage({
        message: "cppTime",
        cppTime: new Date(),
        cppSite: "Ebay",
        cppId: cppId,
        cppText: cppElement
      },
      function(response) {
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
  }



  /**
   * Listen for messages from the background script.
   */
  window.browser.runtime.onMessage.addListener(function(message) {
    if (message.command === "showDiary") {
      // do that when we get the message to show diary entry
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
            function(response) {});
        });

      }, 4000);
    }
  });

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

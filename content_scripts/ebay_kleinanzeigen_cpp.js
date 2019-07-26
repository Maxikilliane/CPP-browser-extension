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
    ebayWhat: "Was speichert und sammelt Ebay?",
    ebayWhy: "Wozu?",

    ebaySearchWhatEntries: ["Deine Browserverlaufsdaten", "Deinen Standort", "Wie oft und wann Du ebay-kleinanzeigen.de besuchst", "Alles was Du generierst: Artikel anklicken, Artikel auf die Beobachtungsliste, Artikel in den Warenkorb, usw."],
    ebaySearchWhyEntries: ["Um Werbung genau auf Dich abzustimmen."],

    cppIdSearch: "ebayKleinanzeigen_Search"
  };

  fetch(browser.extension.getURL('diary/diary.html'))
    .then(response => response.text())
    .then(data => {
      div = document.createElement('div');
      div.innerHTML = data.trim();
      document.body.insertAdjacentElement("beforeend", div);
      console.log("inserted");
    }).catch(err => {
      // handle error
    });


  let searchField = document.getElementById("site-search-query");
  if (searchField != null) {
    searchField.addEventListener("input", addCppSearch)
  }

  function addCppSearch() {
    console.log("hi");
    deletePreviousCpp();
    let parentElem = document.getElementById("site-content");
    displayCpp(cppTexts.ebayWhat, cppTexts.ebaySearchWhatEntries, cppTexts.ebayWhy, cppTexts.ebaySearchWhyEntries, parentElem, "beforebegin", cppTexts.cppIdSearch);
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
  function displayCpp(ebaySearchWhat, ebaySearchWhatEntries, ebaySearchWhy, ebaySearchWhyEntries, parentElem, locationAdjacent, cppId) {
    let cpp = document.createElement("div");
    var logo = document.createElement("img");
    logo.src = browser.runtime.getURL("icons/icon_bigger.png");
    cpp.appendChild(logo);
    // what does ebay collect
    var headingWhat = document.createElement("h3")
    headingWhat.innerHTML = HtmlSanitizer.SanitizeHtml(ebaySearchWhat);
    cpp.classList.add("cppBox");
    cpp.appendChild(headingWhat);
    console.log(parentElem);
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
    console.log("hier!")
    window.browser.runtime.sendMessage({
        message: "cppTime",
        cppTime: new Date(),
        cppSite: "EbayKleinanzeigen",
        cppId: cppId,
        cppText: cppElement
      },
      function(response) {
        console.log('sendResponse was called with: ' + response);
      });
  }

  function sendDiaryToBackgroundPage(diaryEntry, cppId) {
    console.log("sending diary");
    window.browser.runtime.sendMessage({
        message: "diaryEntry",
        diaryTime: new Date(),
        diaryEntry: diaryEntry,
        cppId: cppId
      },
      function(response) {
        console.log('sendResponse was called with: ' + response);

      });
  }


  /**
   * Listen for messages from the background script.
   */
  window.browser.runtime.onMessage.addListener(function(message) {
    if (message.command === "showDiary") {
      console.log("show diary");
      // do that when we get the message to show diary entry
      setTimeout(function() {
        //your code to be executed after 5 seconds

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
          console.log(message.cppId);
          sendDiaryToBackgroundPage(diaryEntry, message.cppId);
        });

        let closeButton = document.getElementById("closeDiary");
        closeButton.addEventListener("click", function() {

          diary.style.display = "none";
          console.log("closing diary");
          window.browser.runtime.sendMessage({
              message: "diaryClosed",
              cppId: message.cppId,
              diaryTime: new Date()
            },
            function(response) {

            });
        });

      }, 4000);
    } else if (message.command === "dontShowDiary") {
      console.log("alert dont show diary");
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
    console.log(willChange);
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

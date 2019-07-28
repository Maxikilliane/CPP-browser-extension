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
    amazonWhat: "What does Amazon store and collect?",
    amazonWhy: "Why?",

    amazonSearchWhatEntries: ["Your purchase history", "The exact order of the viewed/searched products including date and time",
      "The location of your computer"
    ],
    amazonSearchWhyEntries: ["To personalize recommendations for products and services (advertising!)", "To determine your preferences (advertising!)"],

    amazonCheckoutWhatEntries: ["Information about your credit history"],
    amazonCheckoutWhyEntries: ["Using scoring methods to ensure your solvency"],

    cppIdSearch: "amazon_Search",
    cppIdCheckout: "amazon_Checkout"
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

  let searchField = document.getElementById("twotabsearchtextbox");
  if (searchField == null) {
    searchField = document.getElementsByClassName("nav-input")[0];
  } else {
    searchField.addEventListener("input", addCpp);
  }

  let checkoutElement = document.getElementById("shipaddress");
  if (checkoutElement != null) {
    addCppCheckout();
  }


  function addCppCheckout() {
    deletePreviousCpp();
    let parentElem = document.getElementsByClassName("a-container")[0];
    displayCpp(cppTexts.amazonWhat, cppTexts.amazonCheckoutWhatEntries, cppTexts.amazonWhy, cppTexts.amazonCheckoutWhyEntries, parentElem, "beforebegin", cppTexts.cppIdCheckout);
  }

  /**
   * Determine where to add the CPP
   */
  function addCpp() {
    deletePreviousCpp();
    let parentElem = document.getElementById("pageContent");
    if (parentElem == null) {
      parentElem = document.getElementById("mako-subnav");
    }

    displayCpp(cppTexts.amazonWhat, cppTexts.amazonSearchWhatEntries, cppTexts.amazonWhy, cppTexts.amazonSearchWhyEntries, parentElem, "beforebegin", cppTexts.cppIdSearch);
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
  function displayCpp(amazonSearchWhat, amazonSearchWhatEntries, amazonSearchWhy, amazonSearchWhyEntries, parentElem, locationAdjacent, cppId) {
    let cpp = document.createElement("div");

    // what does amazon collect
    var headingWhat = document.createElement("h3")
    var logo = document.createElement("img");
    logo.src = browser.runtime.getURL("icons/icon_bigger.png");
    cpp.appendChild(logo);
    headingWhat.innerHTML = HtmlSanitizer.SanitizeHtml(amazonSearchWhat);
    cpp.classList.add("cppBox");
    cpp.appendChild(headingWhat);
    var list = document.createElement("UL");
    for (entry in amazonSearchWhatEntries) {
      var listElement = document.createElement("LI");
      var text = document.createTextNode(amazonSearchWhatEntries[entry]);
      listElement.appendChild(text);
      list.appendChild(listElement);
    }
    cpp.appendChild(list);

    // why does amazon collect
    var headingWhy = document.createElement("h3")
    headingWhy.innerHTML = HtmlSanitizer.SanitizeHtml(amazonSearchWhy);
    cpp.classList.add("cppBox");
    cpp.appendChild(headingWhy);
    var list = document.createElement("UL");
    for (entry in amazonSearchWhyEntries) {
      var listElement = document.createElement("LI");
      var text = document.createTextNode(amazonSearchWhyEntries[entry]);
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
        cppSite: "Amazon",
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
            function(response) {

            });
        });

      }, 4000);
    } else if (message.command === "dontShowDiary") {
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

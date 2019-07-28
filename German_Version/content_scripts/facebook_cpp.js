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
    facebookWhat: "Was speichert und sammelt Facebook?",
    facebookWhy: "Wozu?",
    facebookWhen: "In welcher Situation?",

    facebookPost: "Wenn Du etwas postest.",
    facebookPostWhatEntries: ["Unter anderem die Inhalte, die Du postest"],
    facebookPostWhyEntries: ["Um Daten mit anderen Unternehmen aus der Facebook-Gruppe zu teilen, z.B. Instagram, Whatsapp und Oculus", "Um Werbung zu personalisieren Werbung verwenden", " Um sie anderweitig weiterzuverwenden", "Um sie zu verbreiten", " Um sie zu modifizieren", "Um sie zu Kopieren", "Um sie öffentlich vorzuführen oder anzuzeigen", "Um sie Übersetzen", "Um abgeleitete Werke davon zu erstellen"],
    cppIdPost: "facebook_Post",

    facebookEventWhatEntries: ["Standortbezogene Daten, u.a.", "Dein aktueller Standort, falls der Zugriff darauf erlaubt ist", "Dein Wohnort", "Orte, die Du gerne besuchst", "Unternehmen/Personen in deiner Nähe"],
    facebookEventWhyEntries: ["Für personalisierte Werbung"],
    facebookEvent: "Wenn Du dich zu einer Veranstaltung anmeldest.",
    cppIdEvent: "facebook_Event",

    facebookUploadWhat: ["Metainformationen über hochgeladene Dateien, z.B.", "Aufnahmestandort eines Fotos", "Datum, an dem eine Datei erstellt wurde"],
    facebookUploadWhy: ["Um Daten mit anderen Unternehmen aus der Facebook-Gruppe zu teilen, z.B. Instagram, Whatsapp und Oculus", "Um sie zur Personalisierung von Inhalten zu verwenden", "Um sie für personalisierte Werbung zu verwenden"],
    facebookUploadMedia: "Beim Hochladen von Bildern, Videos oder Dateien.",
    cppIdUpload: "facebook_Upload"
  };

  let readyStateCheckInterval = setInterval(function() {

    if (document.readyState === "complete") {
      clearInterval(readyStateCheckInterval);


      fetch(browser.extension.getURL('diary/diary.html'))
        .then(response => response.text())
        .then(data => {
          div = document.createElement('div');
          div.innerHTML = data.trim();
          document.body.insertAdjacentElement("beforeend", div);

        }).catch(err => {
          // handle error
        });

      /**
       * add cpp to post
       */
      let targetNodePost = getTargetToWatch();

      const MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
      let configPost = {
        attributes: true,
        childList: false,
        subtree: false
      };
      let configTypePost = {
        attributes: false,
        childList: true,
        subtree: false,
        characterData: true
      };

      // checks whether user is typing something to post
      const typeObserver = new MutationObserver(function(mutations) {
        for (let i = 0; i < mutations.length; i++) {
          typeObserver.disconnect();
          let outerBox = getTargetToWatch();
          let cppContainer = outerBox.getElementsByClassName("_ikh")[0];
          deletePreviousCpp();
          displayCpp(cppTexts.facebookPost, cppContainer, "beforeend", "1em", cppTexts.cppIdPost, cppTexts.facebookWhat, cppTexts.facebookWhy, cppTexts.facebookWhen, cppTexts.facebookPostWhatEntries, cppTexts.facebookPostWhyEntries);
        }
      });

      let configMedia = {
        attributes: false,
        childList: true,
        subtree: true,
        characterData: false
      };
      const mediaObserver = new MutationObserver(function(mutations) {

        for (let i = 0; i < mutations.length; i++) {

          let outerBox = getTargetToWatch();
          if (outerBox.getElementsByClassName("fbScrollableArea").length > 0) {
            let cppContainer = outerBox.getElementsByClassName("fbScrollableArea")[0].parentNode.parentNode.parentNode;

            mediaObserver.disconnect();
            deletePreviousCpp();
            displayCpp(cppTexts.facebookUploadMedia, cppContainer, "beforeend", "1em", cppTexts.cppIdUpload, cppTexts.facebookWhat, cppTexts.facebookWhy, cppTexts.facebookWhen, cppTexts.facebookUploadWhat, cppTexts.facebookUploadWhy);
          }
        }
      });
      const postObserver = new MutationObserver(function(mutations) {
        for (let i = 0; i < mutations.length; i++) {
          if (mutations[i].attributeName === "role") {

            if (targetNodePost.getAttribute("role") === "dialog") {

              setTimeout(function() {
                let targetNodeType = document.getElementsByClassName("_1mf")[0].firstChild;
                typeObserver.observe(targetNodeType, configTypePost);
                let targetNodeMedia = targetNodePost.getElementsByClassName("_ikh")[0].parentNode;
                mediaObserver.observe(targetNodeMedia, configMedia);
              }, 1000);



            }

          }
        }
      });

      postObserver.observe(targetNodePost, configPost);


      /**
       * add cpp to event
       */
      let eventContainer = document.getElementById("events_dashboard_upcoming_events");
      if (eventContainer !== null) {
        cppContainer = eventContainer.firstChild.firstChild.firstChild;
        deletePreviousCpp();
        displayCpp(cppTexts.facebookEvent, cppContainer, "beforeend", "1em", cppTexts.cppIdEvent, cppTexts.facebookWhat, cppTexts.facebookWhy, cppTexts.facebookWhen, cppTexts.facebookEventWhatEntries, cppTexts.facebookEventWhyEntries);
      } else {
        let eventContainer = document.getElementById("event_button_bar");
        if (eventContainer !== null) {
          deletePreviousCpp();
          displayCpp(cppTexts.facebookEvent, eventContainer, "beforeend", "1em", cppTexts.cppIdEvent, cppTexts.facebookWhat, cppTexts.facebookWhy, cppTexts.facebookWhen, cppTexts.facebookEventWhatEntries, cppTexts.facebookEventWhyEntries);
        }
      }
    }
  }, 10);

  function getTargetToWatch() {
    let innerTargetNodePost = document.getElementById("feedx_sprouts_container");
    if (innerTargetNodePost !== null && innerTargetNodePost != undefined) {
      return innerTargetNodePost.parentNode.parentNode.parentNode;
    } else {
      let outerTargetNodePost = document.getElementsByClassName("fbTimelineComposerUnit")[0];
      if (outerTargetNodePost !== null && outerTargetNodePost !== undefined) {

        return outerTargetNodePost.firstChild.firstChild.firstChild;
      } else {
        return null;
      }
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
  function displayCpp(content, parentElem, locationAdjacent, cppFontsize, cppId, what, why, when, whatEntries, whyEntries) {

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
    let headingWhen = document.createElement("h3")
    headingWhen.innerHTML = HtmlSanitizer.SanitizeHtml(when);
    cpp.appendChild(headingWhen);
    let situation = document.createElement("p");
    situation.innerHTML = HtmlSanitizer.SanitizeHtml(content);
    cpp.appendChild(situation);

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

    if (cppFontsize !== null && cppFontsize !== undefined) {
      cpp.style.fontSize = cppFontsize;
    }

    parentElem.insertAdjacentElement(locationAdjacent, cpp);
    sendCPPTimeToBackgroundPage(cppId, cpp.innerHTML);

  };

  function sendCPPTimeToBackgroundPage(cppId, cppElement) {
    window.browser.runtime.sendMessage({
        message: "cppTime",
        cppTime: new Date(),
        cppSite: "Facebook",
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

  browser.runtime.onMessage.addListener(function(message, callback) {
    if (message.data === "urlPathChanged") {
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

        /**
         * add cpp to post
         */
        const MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        let configPost = {
          attributes: true,
          childList: false,
          subtree: false
        };
        let configTypePost = {
          attributes: false,
          childList: true,
          subtree: false,
          characterData: true
        };

        // checks whether user is typing something to post
        const typeObserver = new MutationObserver(function(mutations) {
          for (let i = 0; i < mutations.length; i++) {
            typeObserver.disconnect();
            let outerBox = getTargetToWatch();
            let cppContainer = outerBox.getElementsByClassName("_ikh")[0];
            deletePreviousCpp();
            displayCpp(cppTexts.facebookPost, cppContainer, "beforeend", "1em", cppTexts.cppIdPost, cppTexts.facebookWhat, cppTexts.facebookWhy, cppTexts.facebookWhen, cppTexts.facebookPostWhatEntries, cppTexts.facebookPostWhyEntries);
          }
        });

        let configMedia = {
          attributes: false,
          childList: true,
          subtree: true,
          characterData: false
        };
        const mediaObserver = new MutationObserver(function(mutations) {

          for (let i = 0; i < mutations.length; i++) {
            let outerBox = getTargetToWatch();
            if (outerBox.getElementsByClassName("fbScrollableArea").length > 0) {
              let cppContainer = outerBox.getElementsByClassName("fbScrollableArea")[0].parentNode.parentNode.parentNode;
              mediaObserver.disconnect();
              deletePreviousCpp();
              displayCpp(cppTexts.facebookUploadMedia, cppContainer, "beforeend", "1em", cppTexts.cppIdUpload, cppTexts.facebookWhat, cppTexts.facebookWhy, cppTexts.facebookWhen, cppTexts.facebookUploadWhat, cppTexts.facebookUploadWhy);
            }
          }
        });
        let targetNodePost = getTargetToWatch();
        const postObserver = new MutationObserver(function(mutations) {
          for (let i = 0; i < mutations.length; i++) {
            if (mutations[i].attributeName === "role") {

              if (targetNodePost.getAttribute("role") === "dialog") {
                setTimeout(function() {
                  let targetNodeType = document.getElementsByClassName("_1mf")[0].firstChild;
                  typeObserver.observe(targetNodeType, configTypePost);

                  // cpp for image upload
                  let targetNodeMedia = targetNodePost.getElementsByClassName("_ikh")[0].parentNode;
                  mediaObserver.observe(targetNodeMedia, configMedia);
                }, 1000);



              }

            }
          }
        });
        if (targetNodePost !== null) {
          postObserver.observe(targetNodePost, configPost);
        }



        /**
         * add cpp to event
         */
        setTimeout(function() {
          let eventContainer = document.getElementById("events_dashboard_upcoming_events");
          if (eventContainer !== null) {
            cppContainer = eventContainer.firstChild.firstChild.firstChild;
            deletePreviousCpp();
            displayCpp(cppTexts.facebookEvent, cppContainer, "beforeend", "1em", cppTexts.cppIdEvent, cppTexts.facebookWhat, cppTexts.facebookWhy, cppTexts.facebookWhen, cppTexts.facebookEventWhatEntries, cppTexts.facebookEventWhyEntries);
          } else {
            let eventContainer = document.getElementById("event_button_bar");
            if (eventContainer !== null) {
              deletePreviousCpp();
              displayCpp(cppTexts.facebookEvent, eventContainer, "beforeend", "1em", cppTexts.cppIdEvent, cppTexts.facebookWhat, cppTexts.facebookWhy, cppTexts.facebookWhen, cppTexts.facebookEventWhatEntries, cppTexts.facebookEventWhyEntries)
            }
          }
        }, 4000);




      }, 2000);



    } else if (message.command === "showDiary") {
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

})();

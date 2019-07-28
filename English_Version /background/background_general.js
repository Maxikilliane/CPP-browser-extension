/**
 * Support different browsers with namespace definitions
 */
window.browser = (function() {
  return window.msBrowser ||
    window.browser ||
    window.chrome;
})();

let lastTimeDiaryWasDisplayed = new Date(2019, 6, 3, 9, 0); // set day which is not the current day

let timeBetweenDiarysMilliseconds = 3600000; // variable measured in milliseconds, 600000 is 10 minutes // 30 minutes would be 1800000 milliseconds // final time is 1 hour

let theWholeEntry;
window.browser.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.message === "cppTime") {
      let currentDate = new Date(request.cppTime);
      if (lastTimeDiaryWasDisplayed.getDate() !== currentDate.getDate()) {
        // display the diary (first time in the day)
        browser.tabs.query({
          active: true,
          currentWindow: true
        }, function(tabs) {
          browser.tabs.sendMessage(tabs[0].id, {
            command: "showDiary",
            cppText: request.cppText,
            cppId: request.cppId
          }, function(response) {});
        });

        saveInformationFromCppDisplay(request, true);
        lastTimeDiaryWasDisplayed = currentDate;
      } else if ((currentDate - lastTimeDiaryWasDisplayed) >= timeBetweenDiarysMilliseconds) {
        //display the diary (first time after certain set time)
        browser.tabs.query({
          active: true,
          currentWindow: true
        }, function(tabs) {
          browser.tabs.sendMessage(tabs[0].id, {
            command: "showDiary",
            cppText: request.cppText,
            cppId: request.cppId
          }, function(response) {});
        });
        saveInformationFromCppDisplay(request, true);
        lastTimeDiaryWasDisplayed = currentDate;
      } else {
        // don't display diary here, only save cpp log data
        saveInformationFromCppDisplay(request, false);
        browser.tabs.query({
          active: true,
          currentWindow: true
        }, function(tabs) {
          browser.tabs.sendMessage(tabs[0].id, {
            command: "dontShowDiary"
          }, function(response) {});
        });
      }
    } else if (request.message === "diaryEntry") {
      saveDiaryEntry(request);
    } else if (request.message === "diaryClosed") {
      saveDiaryNoEntry(request);
      lastTimeDiaryWasDisplayed = lastTimeDiaryWasDisplayed.getTime() - (45 * 60000)
    }

    if (request.message === "feedback") {
      saveFeedback(request)
    }

  }
);


/**
 * Saves Logdata on the display of CPPs to a file on the persons computer
 */
function saveInformationFromCppDisplay(request, isDiaryDisplayed) {
  window.browser.storage.local.get(["logData"], function(result) {
    var secondsSinceLastEntry;
    var newEntry = {
      "time": request.cppTime,
      "site": request.cppSite,
      "text": request.cppId,
      "isDisplayed?": isDiaryDisplayed
    }
    if (Object.keys(result).length === 0) {
      var theWholeEntry = new Array()
      secondsSinceLastEntry = 4;
    } else {
      theWholeEntry = result["logData"];
      var lastEntry = theWholeEntry[theWholeEntry.length - 1];
      var timeOld = new Date(lastEntry.time);
      var timeNew = new Date(request.cppTime);
      secondsSinceLastEntry = (timeNew - timeOld) / 1000;
    }
    if (secondsSinceLastEntry > 3) {
      theWholeEntry.push(newEntry)

    }

    window.browser.storage.local.set({
      "logData": theWholeEntry
    });

  });
}


/**
 * Saves feedback from pop-up from extension icon
 */
function saveFeedback(request) {
  window.browser.storage.local.get(["feedback"], function(result) {
    var newEntry = {
      "time": request.time,
      "likertResponse": request.likertResponse,
      "problems": request.problems,
      "improvements": request.improvement
    }
    if (Object.keys(result).length === 0) {
      var theWholeEntry = new Array()
    } else {
      theWholeEntry = result["feedback"];
    }
    theWholeEntry.push(newEntry)
    window.browser.storage.local.set({
      "feedback": theWholeEntry
    });
  });
  chrome.notifications.create({
    "type": "basic",
    "iconUrl": browser.extension.getURL("icons/icon_4_bigger.png"),
    "title": "Thank you!",
    "message": "Your feedback was sent successfully."
  })
}

function saveDiaryEntry(request) {
  window.browser.storage.local.get(["diaryEntry"], function(result) {
    var newEntry = {
      "time": request.diaryTime,
      "diaryEntry": request.diaryEntry,
      "cppId": request.cppId
    }
    if (Object.keys(result).length === 0) {
      var theWholeEntry = new Array()
    } else {
      theWholeEntry = result["diaryEntry"];
    }
    theWholeEntry.push(newEntry)
    window.browser.storage.local.set({
      "diaryEntry": theWholeEntry
    });
  });
  chrome.notifications.create({
    "type": "basic",
    "iconUrl": browser.extension.getURL("icons/icon_4_bigger.png"),
    "title": "Thank you!",
    "message": "Your feedback was sent successfully."
  })
}

function saveDiaryNoEntry(request) {
  window.browser.storage.local.get(["diaryEntry"], function(result) {
    var newEntry = {
      "time": request.diaryTime,
      "diaryEntry": false,
      "cppId": request.cppId
    }
    if (Object.keys(result).length === 0) {
      var theWholeEntry = new Array()
    } else {
      theWholeEntry = result["diaryEntry"];
    }
    theWholeEntry.push(newEntry)
    window.browser.storage.local.set({
      "diaryEntry": theWholeEntry
    });
  });
}

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

  window.browser = (function() {
    return window.msBrowser || chrome;
  })();

  let feedbackButton = document.getElementById("feedbackButton");
  feedbackButton.addEventListener("click", function() {
    let likertResponse;
    if (document.querySelector('input[name = "Helpful"]:checked') !== null) {
      likertResponse = document.querySelector('input[name = "Helpful"]:checked').value;
    } else {
      likertResponse = 0;
    }
    var problems = document.getElementById("problem").value
    var improvements = document.getElementById("improvement").value
    sendFeedbackToBackgroundScript(likertResponse, problems, improvements);
    document.getElementById("problem").value = ""
    document.getElementById("improvement").value = ""
    var likertBoxes = document.getElementsByName("Helpful");
    for (var i = 0; i < likertBoxes.length; i++)
      likertBoxes[i].checked = false;

  });

  function sendFeedbackToBackgroundScript(likertResponses, problems, improvements) {
    window.browser.runtime.sendMessage({
        message: "feedback",
        time: new Date(),
        likertResponse: likertResponses,
        problems: problems,
        improvement: improvements

      },
      function(response) {
      });
  }

})();

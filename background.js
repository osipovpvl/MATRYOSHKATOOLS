chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CHECK_DOMAIN") {
    const { domain } = message;
    const apiKey = "c32b4abd558dbff2397e17546a77bc65";
    const apiUrl = `https://checktrust.ru/app.php?r=host/app/summary/basic&applicationKey=${apiKey}&host=${domain}&parameterList=trust,spam`;

    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        sendResponse({ trust: data.trust, spam: data.spam });
      })
      .catch((error) => {
        console.error("Error fetching domain data:", error);
        sendResponse(null);
      });

    return true; // Keeps the message channel open for async response
  }
});
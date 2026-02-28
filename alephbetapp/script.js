(function initAlephbetGame(globalScope) {
  const ALEPHBET = [
    { hebrew: "א", name: "Aleph", pronunciation: "AH-lef", word: "אור", wordSound: "or", definition: "light" },
    { hebrew: "ב", name: "Bet", pronunciation: "BET", word: "בית", wordSound: "bayit", definition: "house" },
    { hebrew: "ג", name: "Gimel", pronunciation: "GHEE-mel", word: "גן", wordSound: "gan", definition: "garden" },
    { hebrew: "ד", name: "Dalet", pronunciation: "DAH-let", word: "דג", wordSound: "dag", definition: "fish" },
    { hebrew: "ה", name: "He", pronunciation: "HAY", word: "הר", wordSound: "har", definition: "mountain" },
    { hebrew: "ו", name: "Vav", pronunciation: "VAHV", word: "ורד", wordSound: "vered", definition: "rose" },
    { hebrew: "ז", name: "Zayin", pronunciation: "ZAH-yin", word: "זית", wordSound: "zayit", definition: "olive" },
    { hebrew: "ח", name: "Chet", pronunciation: "KHET", word: "חלב", wordSound: "chalav", definition: "milk" },
    { hebrew: "ט", name: "Tet", pronunciation: "TET", word: "טוב", wordSound: "tov", definition: "good" },
    { hebrew: "י", name: "Yod", pronunciation: "YODE", word: "ים", wordSound: "yam", definition: "sea" },
    { hebrew: "כ", name: "Kaf", pronunciation: "KAHF", word: "כוכב", wordSound: "kochav", definition: "star" },
    { hebrew: "ל", name: "Lamed", pronunciation: "LAH-med", word: "לב", wordSound: "lev", definition: "heart" },
    { hebrew: "מ", name: "Mem", pronunciation: "MEM", word: "מים", wordSound: "mayim", definition: "water" },
    { hebrew: "נ", name: "Nun", pronunciation: "NOON", word: "נהר", wordSound: "nahar", definition: "river" },
    { hebrew: "ס", name: "Samekh", pronunciation: "SAH-mekh", word: "ספר", wordSound: "sefer", definition: "book" },
    { hebrew: "ע", name: "Ayin", pronunciation: "AH-yin", word: "עץ", wordSound: "etz", definition: "tree" },
    { hebrew: "פ", name: "Pe", pronunciation: "PAY", word: "פרח", wordSound: "perach", definition: "flower" },
    { hebrew: "צ", name: "Tsadi", pronunciation: "TSAH-dee", word: "ציפור", wordSound: "tzipor", definition: "bird" },
    { hebrew: "ק", name: "Qof", pronunciation: "KOHF", word: "קול", wordSound: "kol", definition: "voice" },
    { hebrew: "ר", name: "Resh", pronunciation: "RESH", word: "רוח", wordSound: "ruach", definition: "wind" },
    { hebrew: "ש", name: "Shin", pronunciation: "SHEEN", word: "שמש", wordSound: "shemesh", definition: "sun" },
    { hebrew: "ת", name: "Tav", pronunciation: "TAHV", word: "תפוח", wordSound: "tapuach", definition: "apple" },
  ];

  function getNextLetterIndex(currentIndex, direction, total) {
    if (total <= 0) {
      return -1;
    }
    const offset = direction === "previous" ? -1 : 1;
    return (currentIndex + offset + total) % total;
  }

  function isMobileSingleCardWidth(viewportWidth) {
    return Number.isFinite(viewportWidth) && viewportWidth <= 768;
  }

  function applyTrackMode(trackElement, viewportWidth) {
    const useMobileMode = isMobileSingleCardWidth(viewportWidth);
    trackElement.classList.toggle("is-mobile-single", useMobileMode);
  }

  function canSpeak() {
    return (
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      typeof SpeechSynthesisUtterance !== "undefined"
    );
  }

  function buildSpeechText(letterData) {
    return `${letterData.name}. Pronounced ${letterData.pronunciation}. Word: ${letterData.word}, sounds like ${letterData.wordSound}. Definition: ${letterData.definition}.`;
  }

  function pickVoice(voices) {
    if (!Array.isArray(voices) || voices.length === 0) {
      return null;
    }

    return (
      voices.find((voice) => voice.lang && voice.lang.startsWith("en")) ||
      voices.find((voice) => voice.default) ||
      voices[0]
    );
  }

  function speakLetter(letterData, statusElement) {
    if (!canSpeak()) {
      statusElement.textContent = `Audio unavailable. Letter: ${letterData.name}`;
      return;
    }

    const utterance = new SpeechSynthesisUtterance(buildSpeechText(letterData));
    const selectedVoice = pickVoice(window.speechSynthesis.getVoices());
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang || "en-US";
    } else {
      utterance.lang = "en-US";
    }

    utterance.rate = 0.75;
    utterance.pitch = 1.0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    statusElement.textContent = `Now sounding: ${letterData.name} (${letterData.pronunciation}) - ${letterData.word} (${letterData.wordSound}): ${letterData.definition}`;
  }

  function createCard(letterData, statusElement) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "letter-card";
    card.setAttribute(
      "aria-label",
      `${letterData.name}, pronunciation ${letterData.pronunciation}, word ${letterData.word}, sounds like ${letterData.wordSound}, means ${letterData.definition}`
    );

    const hebrewLine = document.createElement("p");
    hebrewLine.className = "letter-hebrew";
    hebrewLine.textContent = letterData.hebrew;

    const nameLine = document.createElement("p");
    nameLine.className = "letter-name";
    nameLine.textContent = letterData.name;

    const pronounceLine = document.createElement("p");
    pronounceLine.className = "letter-pronounce";
    pronounceLine.textContent = letterData.pronunciation;

    const wordLine = document.createElement("p");
    wordLine.className = "letter-word";
    wordLine.textContent = `Word: ${letterData.word} (${letterData.wordSound})`;

    const definitionLine = document.createElement("p");
    definitionLine.className = "letter-definition";
    definitionLine.textContent = `Definition: ${letterData.definition}`;

    card.appendChild(hebrewLine);
    card.appendChild(nameLine);
    card.appendChild(pronounceLine);
    card.appendChild(wordLine);
    card.appendChild(definitionLine);

    card.addEventListener("click", () => {
      document
        .querySelectorAll(".letter-card.is-speaking")
        .forEach((element) => element.classList.remove("is-speaking"));
      card.classList.add("is-speaking");
      speakLetter(letterData, statusElement);
    });

    return card;
  }

  function buildCards(trackElement, statusElement) {
    ALEPHBET.forEach((letterData) => {
      const card = createCard(letterData, statusElement);
      trackElement.appendChild(card);
    });
  }

  function start() {
    const trackElement = document.getElementById("lettersTrack");
    const statusElement = document.getElementById("statusText");

    if (!trackElement || !statusElement) {
      return;
    }

    buildCards(trackElement, statusElement);
    applyTrackMode(trackElement, window.innerWidth);

    window.addEventListener("resize", () => {
      applyTrackMode(trackElement, window.innerWidth);
    });
  }

  globalScope.AlephbetGame = {
    ALEPHBET,
    buildSpeechText,
    getNextLetterIndex,
    isMobileSingleCardWidth,
  };

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", start);
  }
})(typeof globalThis !== "undefined" ? globalThis : window);

(
  function initAlephbetGame(globalScope) {
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

    const HEBREW_GEMATRIA = {
      א: 1,
      ב: 2,
      ג: 3,
      ד: 4,
      ה: 5,
      ו: 6,
      ז: 7,
      ח: 8,
      ט: 9,
      י: 10,
      כ: 20,
      ך: 20,
      ל: 30,
      מ: 40,
      ם: 40,
      נ: 50,
      ן: 50,
      ס: 60,
      ע: 70,
      פ: 80,
      ף: 80,
      צ: 90,
      ץ: 90,
      ק: 100,
      ר: 200,
      ש: 300,
      ת: 400,
    };

    const ENGLISH_GEMATRIA = {};
    for (let code = 65; code <= 90; code += 1) {
      ENGLISH_GEMATRIA[String.fromCharCode(code)] = code - 64;
    }

    const LOCAL_SYNONYMS = {
      english: {
        light: ["brightness", "glow", "illumination"],
        house: ["home", "residence", "dwelling"],
        water: ["aqua", "liquid"],
        love: ["affection", "care", "devotion"],
        peace: ["calm", "harmony", "tranquility"],
        wisdom: ["insight", "knowledge", "understanding"],
        sun: ["daystar", "sunlight"],
      },
      hebrew: {
        שלום: ["שלווה", "רוגע", "הרמוניה"],
        אהבה: ["חיבה", "חמלה"],
        מים: ["נוזל", "מי שתיה"],
        אור: ["זוהר", "בהירות"],
        לב: ["רגש", "חיבה"],
      },
    };

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

    function stripHebrewMarks(text) {
      if (typeof text !== "string") {
        return "";
      }
      return text.normalize("NFKD").replace(/[\u0591-\u05C7]/g, "");
    }

    function detectScript(char) {
      if (HEBREW_GEMATRIA[char]) {
        return "hebrew";
      }
      if (/[A-Za-z]/.test(char)) {
        return "english";
      }
      return "other";
    }

    function getLetterValue(char) {
      const normalizedChar = stripHebrewMarks(char).charAt(0);
      if (!normalizedChar) {
        return 0;
      }
      if (HEBREW_GEMATRIA[normalizedChar]) {
        return HEBREW_GEMATRIA[normalizedChar];
      }
      const upper = normalizedChar.toUpperCase();
      return ENGLISH_GEMATRIA[upper] || 0;
    }

    function getInputScriptType(input) {
      const normalized = stripHebrewMarks(input);
      let hebrewCount = 0;
      let englishCount = 0;

      for (const char of normalized) {
        const script = detectScript(char);
        if (script === "hebrew") {
          hebrewCount += 1;
        } else if (script === "english") {
          englishCount += 1;
        }
      }

      if (hebrewCount > 0 && englishCount > 0) {
        return "mixed";
      }
      if (hebrewCount > 0) {
        return "hebrew";
      }
      if (englishCount > 0) {
        return "english";
      }
      return "unknown";
    }

    function calculateGematriaDetails(input) {
      const normalizedInput = stripHebrewMarks(input).trim();
      const letters = [];

      for (const char of normalizedInput) {
        const value = getLetterValue(char);
        if (value > 0) {
          letters.push({ char, value, script: detectScript(char) });
        }
      }

      const total = letters.reduce((sum, item) => sum + item.value, 0);
      return {
        input,
        normalizedInput,
        scriptType: getInputScriptType(normalizedInput),
        letters,
        total,
      };
    }

    function buildFallbackSynonyms(input, scriptType) {
      const cleaned = stripHebrewMarks(String(input || "")).trim();
      if (!cleaned) {
        return [];
      }

      const source = LOCAL_SYNONYMS[scriptType];
      if (!source) {
        return [];
      }

      const collected = [];
      const key = scriptType === "english" ? cleaned.toLowerCase() : cleaned;

      if (source[key]) {
        collected.push(...source[key]);
      } else if (scriptType === "english") {
        const words = key.match(/[a-z]+/g) || [];
        words.forEach((word) => {
          if (source[word]) {
            collected.push(...source[word]);
          }
        });
      } else if (scriptType === "hebrew") {
        const words = key.match(/[\u05D0-\u05EA\u05DA\u05DD\u05DF\u05E3\u05E5]+/g) || [];
        words.forEach((word) => {
          if (source[word]) {
            collected.push(...source[word]);
          }
        });
      }

      return [...new Set(collected)].slice(0, 10);
    }

    async function fetchEnglishSynonyms(input) {
      const query = String(input || "").trim();
      if (!query || typeof fetch !== "function") {
        return [];
      }

      try {
        const response = await fetch(
          `https://api.datamuse.com/words?ml=${encodeURIComponent(query)}&max=8`
        );
        if (!response.ok) {
          return [];
        }
        const list = await response.json();
        if (!Array.isArray(list)) {
          return [];
        }
        const queryLower = query.toLowerCase();
        return list
          .map((item) => item && item.word)
          .filter((word) => typeof word === "string")
          .map((word) => word.trim())
          .filter((word) => word.length > 0 && word.toLowerCase() !== queryLower)
          .slice(0, 8);
      } catch (_error) {
        return [];
      }
    }

    function renderBreakdown(listElement, letters) {
      listElement.innerHTML = "";
      if (letters.length === 0) {
        const emptyRow = document.createElement("li");
        emptyRow.textContent = "No Hebrew or English letters found in the input.";
        listElement.appendChild(emptyRow);
        return;
      }

      letters.forEach((letter) => {
        const row = document.createElement("li");
        row.textContent = `${letter.char} = ${letter.value}`;
        listElement.appendChild(row);
      });
    }

    function renderSynonyms(listElement, synonyms) {
      listElement.innerHTML = "";
      if (synonyms.length === 0) {
        const emptyRow = document.createElement("li");
        emptyRow.textContent = "No close synonym suggestions found.";
        listElement.appendChild(emptyRow);
        return;
      }

      synonyms.forEach((synonym) => {
        const row = document.createElement("li");
        row.textContent = synonym;
        listElement.appendChild(row);
      });
    }

    async function runGematriaCalculation(inputElement, resultElements) {
      const details = calculateGematriaDetails(inputElement.value);
      resultElements.total.textContent = `Total: ${details.total}`;
      resultElements.script.textContent = `Detected script: ${details.scriptType}`;
      renderBreakdown(resultElements.breakdown, details.letters);

      const fallbackSynonyms = buildFallbackSynonyms(details.normalizedInput, details.scriptType);
      const englishSynonyms =
        details.scriptType === "english"
          ? await fetchEnglishSynonyms(details.normalizedInput)
          : [];
      const synonyms = [...new Set([...fallbackSynonyms, ...englishSynonyms])].slice(0, 12);
      renderSynonyms(resultElements.synonyms, synonyms);
    }

    function initTabs() {
      const tabButtons = document.querySelectorAll("[data-tab-target]");
      const tabPanels = document.querySelectorAll("[data-tab-panel]");
      if (!tabButtons.length || !tabPanels.length) {
        return;
      }

      function setActiveTab(targetId) {
        tabButtons.forEach((button) => {
          const isActive = button.getAttribute("data-tab-target") === targetId;
          button.classList.toggle("is-active", isActive);
          button.setAttribute("aria-selected", String(isActive));
        });
        tabPanels.forEach((panel) => {
          const isActive = panel.id === targetId;
          panel.hidden = !isActive;
        });
      }

      tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const targetId = button.getAttribute("data-tab-target");
          if (targetId) {
            setActiveTab(targetId);
          }
        });
      });
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

    function initGematriaCalculator() {
      const inputElement = document.getElementById("gematriaInput");
      const calculateButton = document.getElementById("gematriaCalculate");
      const totalElement = document.getElementById("gematriaTotal");
      const scriptElement = document.getElementById("gematriaScript");
      const breakdownElement = document.getElementById("gematriaBreakdown");
      const synonymsElement = document.getElementById("gematriaSynonyms");

      if (
        !inputElement ||
        !calculateButton ||
        !totalElement ||
        !scriptElement ||
        !breakdownElement ||
        !synonymsElement
      ) {
        return;
      }

      const resultElements = {
        total: totalElement,
        script: scriptElement,
        breakdown: breakdownElement,
        synonyms: synonymsElement,
      };

      calculateButton.addEventListener("click", () => {
        runGematriaCalculation(inputElement, resultElements);
      });
    }

    function start() {
      const trackElement = document.getElementById("lettersTrack");
      const statusElement = document.getElementById("statusText");
      if (trackElement && statusElement && trackElement.children.length === 0) {
        buildCards(trackElement, statusElement);
        applyTrackMode(trackElement, window.innerWidth);
        window.addEventListener("resize", () => {
          applyTrackMode(trackElement, window.innerWidth);
        });
      }

      initTabs();
      initGematriaCalculator();
    }

    globalScope.AlephbetGame = {
      ALEPHBET,
      HEBREW_GEMATRIA,
      ENGLISH_GEMATRIA,
      buildSpeechText,
      getNextLetterIndex,
      isMobileSingleCardWidth,
      getLetterValue,
      getInputScriptType,
      calculateGematriaDetails,
      buildFallbackSynonyms,
    };

    if (typeof document !== "undefined") {
      document.addEventListener("DOMContentLoaded", start);
    }
  })(typeof globalThis !== "undefined" ? globalThis : window);

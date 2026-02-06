/* ========================================
   SPELASPEL - JavaScript Application
   ======================================== */

// ========================================
// Konfiguration
// ========================================
const CONFIG = {
    totalQuestions: 10,
    clockQuestions: 10, // 5 utan minutvisare + 5 med minutvisare
    helHalvQuestions: 10, // 2 bara timvisare + 2 båda på hel + 4 hel/halv + 2 med lurigt alternativ
    minutvisarenQuestions: 10, // 2 hel/halv + 3 hel/halv/kvart + 5 alla positioner
    minutvisarenHardQuestions: 10, // 2 hel/halv + 3 alla + 3 hel/halv/kvart utan etiketter + 2 alla utan etiketter
    timOchMinutvisarenQuestions: 10, // 3 hel/halv + 3 hel/halv/kvart + 4 alla positioner
    delayAfterCorrect: 1000, // ms
    delayAfterWrong: 300, // ms
    loadingDuration: 1500, // ms
    confettiCount: 30,
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ'.split(''),
    // Svåra bokstäver - lätta att förväxla
    alphabetHard: 'ABDEGIJLNQRTYÅÄÖ'.split(''),
    // Timmar för klockspelet
    hours: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    // Minutetiketterna - position på klockan och motsvarande text
    minuteLabels: {
        12: 'HEL',
        1: 'FEM MINUTER ÖVER',
        2: 'TIO MINUTER ÖVER',
        3: 'KVART ÖVER',
        4: 'TJUGO MINUTER ÖVER',
        5: 'FEM MINUTER I HALV',
        6: 'HALV',
        7: 'FEM MINUTER ÖVER HALV',
        8: 'TJUGO MINUTER I',
        9: 'KVART I',
        10: 'TIO MINUTER I',
        11: 'FEM MINUTER I'
    }
};

// ========================================
// Applikationens tillstånd
// ========================================
const state = {
    soundEnabled: true,
    currentScreen: 'loading',
    currentGame: null,
    currentQuestion: 0,
    correctFirstTry: 0,
    usedLetters: [],
    usedHours: [],
    usedMinutePositions: [], // För minutvisaren-spelet
    targetLetter: '',
    targetHour: 0,
    targetMinutePosition: 0, // För minutvisaren-spelet (1-12)
    isHalfHour: false, // För hel/halv-spelet
    answerOptions: [],
    isProcessing: false,
    previousScreen: null,
    returnToArea: 'home' // Vilken skärm man ska återvända till
};

// ========================================
// DOM-element
// ========================================
const elements = {
    screens: {
        loading: document.getElementById('loading-screen'),
        home: document.getElementById('home-screen'),
        svenska: document.getElementById('svenska-screen'),
        klockan: document.getElementById('klockan-screen'),
        game: document.getElementById('game-screen'),
        clockGame: document.getElementById('clock-game-screen'),
        result: document.getElementById('result-screen')
    },
    soundButtons: document.querySelectorAll('.sound-btn'),
    backButtons: document.querySelectorAll('.back-btn'),
    areaButtons: document.querySelectorAll('.area-btn'),
    gameButtons: document.querySelectorAll('.game-btn'),
    targetLetter: document.getElementById('target-letter'),
    questionText: document.getElementById('question-text'),
    answerGrid: document.getElementById('answer-grid'),
    progressDots: document.querySelector('.progress-dots'),
    // Klockelement
    clockProgressDots: document.getElementById('clock-progress-dots'),
    clockAnswerGrid: document.getElementById('clock-answer-grid'),
    hourHand: document.getElementById('hour-hand'),
    minuteHand: document.getElementById('minute-hand'),
    // Klocka med etiketter (för minutvisaren-spelet)
    clockContainer: document.getElementById('clock-container'),
    clockWithLabels: document.getElementById('clock-with-labels'),
    minuteHandLabeled: document.getElementById('minute-hand-labeled'),
    // Resultat
    resultPercentage: document.getElementById('result-percentage'),
    playAgainBtn: document.getElementById('play-again-btn'),
    goHomeBtn: document.getElementById('go-home-btn'),
    confettiContainer: document.getElementById('confetti-container')
};

// ========================================
// Ljudhantering
// ========================================
const audio = {
    correct: null,
    wrong: null,
    instructionLetter: null,
    instructionClock: null,
    instructionHelHalv: null,
    instructionMinutvisaren: null,
    instructionTimOchMinutvisaren: null,
    letters: {}
};

// Ladda ljudfiler
function loadAudio() {
    // Skapa ljud för rätt/fel svar
    audio.correct = new Audio('audio/correct.mp3');
    audio.wrong = new Audio('audio/wrong.mp3');
    audio.instructionLetter = new Audio('audio/tryck_pa_lilla.mp3');
    audio.instructionClock = new Audio('audio/vilken_timme.mp3');
    audio.instructionHelHalv = new Audio('audio/helhalv.mp3');
    audio.instructionMinutvisaren = new Audio('audio/minutvisaren.mp3');
    audio.instructionTimOchMinutvisaren = new Audio('audio/hurmycketklockan.mp3');

    // Sätt volym (subtil)
    audio.correct.volume = 0.5;
    audio.wrong.volume = 0.4;
    audio.instructionLetter.volume = 0.7;
    audio.instructionClock.volume = 0.7;
    audio.instructionHelHalv.volume = 0.7;
    audio.instructionMinutvisaren.volume = 0.7;
    audio.instructionTimOchMinutvisaren.volume = 0.7;
    
    // Förbered bokstavsljud (laddas vid behov)
    CONFIG.alphabet.forEach(letter => {
        const letterKey = letter.toLowerCase()
            .replace('å', 'aa')
            .replace('ä', 'ae')
            .replace('ö', 'oe');
        audio.letters[letter] = `audio/letter-${letterKey}.mp3`;
    });
}

// Spela ljud
function playSound(soundType) {
    if (!state.soundEnabled) return;
    
    let audioElement;
    
    if (soundType === 'correct') {
        audioElement = audio.correct;
    } else if (soundType === 'wrong') {
        audioElement = audio.wrong;
    } else if (soundType === 'instruction-letter') {
        audioElement = audio.instructionLetter;
    } else if (soundType === 'instruction-clock') {
        audioElement = audio.instructionClock;
    } else if (soundType === 'instruction-helhalv') {
        audioElement = audio.instructionHelHalv;
    } else if (soundType === 'instruction-minutvisaren') {
        audioElement = audio.instructionMinutvisaren;
    } else if (soundType === 'instruction-timochminutvisaren') {
        audioElement = audio.instructionTimOchMinutvisaren;
    } else if (soundType.startsWith('letter-')) {
        const letter = soundType.replace('letter-', '').toUpperCase();
        const audioPath = audio.letters[letter];
        if (audioPath) {
            audioElement = new Audio(audioPath);
            audioElement.volume = 0.7;
        }
    }
    
    if (audioElement) {
        audioElement.currentTime = 0;
        audioElement.play().catch(() => {
            // Ljudet kunde inte spelas (kanske saknas filen)
            console.log('Ljud saknas:', soundType);
        });
    }
}

// Toggla ljud på/av
function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    
    elements.soundButtons.forEach(btn => {
        btn.classList.toggle('muted', !state.soundEnabled);
    });
    
    // Spara inställning i localStorage
    try {
        localStorage.setItem('spelaspel-sound', state.soundEnabled ? 'on' : 'off');
    } catch (e) {
        // localStorage inte tillgängligt
    }
}

// Ladda ljudinställning
function loadSoundSetting() {
    try {
        const saved = localStorage.getItem('spelaspel-sound');
        if (saved === 'off') {
            state.soundEnabled = false;
            elements.soundButtons.forEach(btn => btn.classList.add('muted'));
        }
    } catch (e) {
        // localStorage inte tillgängligt, ljud är på som standard
    }
}

// ========================================
// Skärmnavigering
// ========================================
function showScreen(screenName) {
    // Spara föregående skärm för tillbaka-knappen
    if (state.currentScreen !== 'loading') {
        state.previousScreen = state.currentScreen;
    }
    
    // Dölj alla skärmar
    Object.values(elements.screens).forEach(screen => {
        if (screen) screen.classList.remove('active');
    });
    
    // Visa den nya skärmen
    if (elements.screens[screenName]) {
        elements.screens[screenName].classList.add('active');
        state.currentScreen = screenName;
    }
}

function goBack() {
    switch (state.currentScreen) {
        case 'svenska':
        case 'klockan':
            showScreen('home');
            break;
        case 'game':
            showScreen(state.returnToArea);
            break;
        case 'clockGame':
            showScreen('klockan');
            break;
        case 'result':
            showScreen(state.returnToArea);
            break;
        default:
            showScreen('home');
    }
}

// ========================================
// Spellogik: Starta spel
// ========================================
function startGame(gameType) {
    state.currentGame = gameType;
    state.currentQuestion = 0;
    state.correctFirstTry = 0;
    state.usedLetters = [];
    state.usedHours = [];
    state.usedMinutePositions = [];
    state.isHalfHour = false;

    // Återställ klockvyn innan nytt klockspel startar
    if (['timvisaren', 'hel-halv', 'minutvisaren', 'minutvisaren-hard', 'tim-och-minutvisaren'].includes(gameType)) {
        resetClockView();
    }

    // Avgör vilken typ av spel
    if (gameType === 'timvisaren') {
        state.returnToArea = 'klockan';
        startClockGame();
    } else if (gameType === 'hel-halv') {
        state.returnToArea = 'klockan';
        startHelHalvGame();
    } else if (gameType === 'minutvisaren') {
        state.returnToArea = 'klockan';
        startMinutvisarenGame();
    } else if (gameType === 'minutvisaren-hard') {
        state.returnToArea = 'klockan';
        startMinutvisarenHardGame();
    } else if (gameType === 'tim-och-minutvisaren') {
        state.returnToArea = 'klockan';
        startTimOchMinutvisarenGame();
    } else {
        state.returnToArea = 'svenska';
        startLetterGame();
    }
}

// ========================================
// Spellogik: Stora & Lilla
// ========================================
function startLetterGame() {
    // Skapa progress-prickar
    createProgressDots(elements.progressDots, CONFIG.totalQuestions);
    
    // Visa spelskärmen
    showScreen('game');
    
    // Spela instruktionsljudet när spelet startar
    setTimeout(() => {
        playSound('instruction-letter');
    }, 400);
    
    // Starta första frågan
    nextLetterQuestion();
}

// Hämta rätt bokstavsuppsättning baserat på spel
function getAlphabetForGame() {
    if (state.currentGame === 'stora-lilla-svar') {
        return CONFIG.alphabetHard;
    }
    return CONFIG.alphabet;
}

function createProgressDots(container, count) {
    container.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        const dot = document.createElement('span');
        dot.className = 'progress-dot';
        dot.setAttribute('aria-hidden', 'true');
        container.appendChild(dot);
    }
}

function updateProgressDots(container, index, status) {
    const dots = container.querySelectorAll('.progress-dot');
    
    dots.forEach((dot, i) => {
        dot.classList.remove('current', 'completed', 'wrong');
        
        if (i < index) {
            // Tidigare frågor
        } else if (i === index) {
            dot.classList.add('current');
        }
    });
    
    if (status && index < dots.length) {
        dots[index].classList.remove('current');
        dots[index].classList.add(status);
    }
}

function nextLetterQuestion() {
    if (state.currentQuestion >= CONFIG.totalQuestions) {
        endGame();
        return;
    }
    
    // Markera nuvarande fråga
    updateProgressDots(elements.progressDots, state.currentQuestion, null);
    
    // Hämta rätt bokstavsuppsättning för detta spel
    const currentAlphabet = getAlphabetForGame();
    
    // Välj en slumpmässig bokstav som inte använts
    let availableLetters = currentAlphabet.filter(
        letter => !state.usedLetters.includes(letter)
    );
    
    if (availableLetters.length === 0) {
        // Om alla bokstäver är använda, återställ
        state.usedLetters = [];
        availableLetters = [...currentAlphabet];
    }
    
    // Slumpa målbokstav
    state.targetLetter = availableLetters[
        Math.floor(Math.random() * availableLetters.length)
    ];
    state.usedLetters.push(state.targetLetter);
    
    // Skapa svarsalternativ
    state.answerOptions = generateLetterOptions(state.targetLetter);
    
    // Uppdatera UI
    elements.targetLetter.textContent = state.targetLetter;
    elements.targetLetter.style.animation = 'none';
    // Trigga reflow för att starta om animationen
    elements.targetLetter.offsetHeight;
    elements.targetLetter.style.animation = 'letterPop 0.4s ease-out';
    
    renderLetterAnswerButtons();
    
    state.isProcessing = false;
}

function generateLetterOptions(correctLetter) {
    const options = [correctLetter.toLowerCase()];
    
    // Hämta rätt bokstavsuppsättning för detta spel
    const currentAlphabet = getAlphabetForGame();
    
    // Få 3 andra slumpmässiga bokstäver från samma uppsättning
    const otherLetters = currentAlphabet.filter(l => l !== correctLetter);
    
    while (options.length < 4) {
        const randomLetter = otherLetters[
            Math.floor(Math.random() * otherLetters.length)
        ].toLowerCase();
        
        if (!options.includes(randomLetter)) {
            options.push(randomLetter);
        }
    }
    
    // Blanda ordningen
    return shuffleArray(options);
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function renderLetterAnswerButtons() {
    elements.answerGrid.innerHTML = '';
    
    state.answerOptions.forEach(letter => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = letter;
        btn.dataset.letter = letter;
        btn.addEventListener('click', () => handleLetterAnswer(letter, btn));
        elements.answerGrid.appendChild(btn);
    });
}

function handleLetterAnswer(selectedLetter, buttonElement) {
    if (state.isProcessing) return;
    
    const isCorrect = selectedLetter === state.targetLetter.toLowerCase();
    const isFirstAttempt = !elements.answerGrid.querySelector('.answer-btn.wrong');
    
    if (isCorrect) {
        state.isProcessing = true;
        buttonElement.classList.add('correct');
        playSound('correct');
        
        // Uppdatera statistik
        if (isFirstAttempt) {
            state.correctFirstTry++;
        }
        
        // Markera progress
        updateProgressDots(elements.progressDots, state.currentQuestion, 'completed');
        
        // Gå till nästa fråga
        state.currentQuestion++;
        
        setTimeout(() => {
            nextLetterQuestion();
        }, CONFIG.delayAfterCorrect);
        
    } else {
        buttonElement.classList.add('wrong');
        buttonElement.disabled = true;
        playSound('wrong');
    }
}

// ========================================
// Spellogik: Timvisaren (Klockan)
// ========================================
function startClockGame() {
    // Skapa progress-prickar
    createProgressDots(elements.clockProgressDots, CONFIG.clockQuestions);
    
    // Visa spelskärmen
    showScreen('clockGame');
    
    // Spela instruktionsljudet när spelet startar
    setTimeout(() => {
        playSound('instruction-clock');
    }, 400);
    
    // Starta första frågan
    nextClockQuestion();
}

function nextClockQuestion() {
    if (state.currentQuestion >= CONFIG.clockQuestions) {
        endGame();
        return;
    }
    
    // Markera nuvarande fråga
    updateProgressDots(elements.clockProgressDots, state.currentQuestion, null);
    
    // Avgör visarläge baserat på frågenummer:
    // Fråga 1-4 (index 0-3): Endast timvisare
    // Fråga 5-8 (index 4-7): Båda visare, minutvisare på 12
    // Fråga 9-10 (index 8-9): Båda visare, minutvisare på 11 eller 1
    let minuteMode = 'hidden';
    if (state.currentQuestion >= 4 && state.currentQuestion <= 7) {
        minuteMode = 'twelve'; // Minutvisare på 12
    } else if (state.currentQuestion >= 8) {
        minuteMode = 'near-twelve'; // Minutvisare på 11 eller 1
    }
    
    // Välj en slumpmässig timme som inte använts nyligen
    let availableHours = CONFIG.hours.filter(
        hour => !state.usedHours.includes(hour)
    );
    
    if (availableHours.length === 0) {
        // Om alla timmar är använda, återställ
        state.usedHours = [];
        availableHours = [...CONFIG.hours];
    }
    
    // Slumpa måltimme
    state.targetHour = availableHours[
        Math.floor(Math.random() * availableHours.length)
    ];
    state.usedHours.push(state.targetHour);
    
    // Uppdatera klockan och få info om vilken minut som visas
    const minuteInfo = setClockHands(state.targetHour, minuteMode);

    // Om minutvisaren visar 55, ska rätt svar vara nästa timme
    // eftersom timvisaren visuellt pekar på nästa timme
    if (minuteInfo.minuteValue === 55) {
        state.targetHour = state.targetHour === 12 ? 1 : state.targetHour + 1;
    }

    // Skapa svarsalternativ
    state.answerOptions = generateClockOptions(state.targetHour);
    
    // Rendera svarsknappar
    renderClockAnswerButtons();
    
    state.isProcessing = false;
}

function setClockHands(hour, minuteMode) {
    // Timvisaren: 360 grader / 12 timmar = 30 grader per timme
    let hourAngle = (hour % 12) * 30;
    let minuteAngle = 0;
    let showMinuteHand = false;
    let minuteValue = 0;
    
    if (minuteMode === 'twelve') {
        // Minutvisare på 12 (0 minuter)
        showMinuteHand = true;
        minuteAngle = 0;
        minuteValue = 0;
        // Timvisaren pekar exakt på timmen
    } else if (minuteMode === 'near-twelve') {
        // Minutvisare på antingen 11 (55 min) eller 1 (5 min)
        showMinuteHand = true;
        const isFiveMinutes = Math.random() < 0.5;
        
        if (isFiveMinutes) {
            // Klockan 5 minuter (1 på urtavlan) - timmen har just passerat
            minuteAngle = 5 * 6; // 30 grader
            minuteValue = 5;
            // Timvisaren strax efter timmen
            hourAngle += (5 / 60) * 30;
        } else {
            // Klockan 55 minuter (11 på urtavlan) - timmen har nästan passerat
            // Men vi visar fortfarande SAMMA timme (t.ex. 10:55 = timme 10)
            minuteAngle = 55 * 6; // 330 grader
            minuteValue = 55;
            // Timvisaren nästan vid nästa timme, men svaret är fortfarande nuvarande timme
            hourAngle += (55 / 60) * 30;
        }
    }
    
    // Visa/dölj minutvisaren
    if (showMinuteHand) {
        elements.minuteHand.classList.add('visible');
        elements.minuteHand.style.transform = 
            `translateX(-50%) translateY(-100%) rotate(${minuteAngle}deg)`;
    } else {
        elements.minuteHand.classList.remove('visible');
    }
    
    elements.hourHand.style.transform = 
        `translateX(-50%) translateY(-100%) rotate(${hourAngle}deg)`;
    
    return { minuteValue };
}

function generateClockOptions(correctHour) {
    const options = [correctHour];
    
    // Få 3 andra slumpmässiga timmar
    const otherHours = CONFIG.hours.filter(h => h !== correctHour);
    
    while (options.length < 4) {
        const randomHour = otherHours[
            Math.floor(Math.random() * otherHours.length)
        ];
        
        if (!options.includes(randomHour)) {
            options.push(randomHour);
        }
    }
    
    // Blanda ordningen
    return shuffleArray(options);
}

function renderClockAnswerButtons() {
    elements.clockAnswerGrid.innerHTML = '';
    
    state.answerOptions.forEach(hour => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = hour;
        btn.dataset.hour = hour;
        btn.addEventListener('click', () => handleClockAnswer(hour, btn));
        elements.clockAnswerGrid.appendChild(btn);
    });
}

function handleClockAnswer(selectedHour, buttonElement) {
    if (state.isProcessing) return;
    
    const isCorrect = selectedHour === state.targetHour;
    const isFirstAttempt = !elements.clockAnswerGrid.querySelector('.answer-btn.wrong');
    
    if (isCorrect) {
        state.isProcessing = true;
        buttonElement.classList.add('correct');
        playSound('correct');
        
        // Uppdatera statistik
        if (isFirstAttempt) {
            state.correctFirstTry++;
        }
        
        // Markera progress
        updateProgressDots(elements.clockProgressDots, state.currentQuestion, 'completed');
        
        // Gå till nästa fråga
        state.currentQuestion++;
        
        setTimeout(() => {
            nextClockQuestion();
        }, CONFIG.delayAfterCorrect);
        
    } else {
        buttonElement.classList.add('wrong');
        buttonElement.disabled = true;
        playSound('wrong');
    }
}

// ========================================
// Spellogik: Hel eller Halvtimme
// ========================================
function startHelHalvGame() {
    // Skapa progress-prickar
    createProgressDots(elements.clockProgressDots, CONFIG.helHalvQuestions);

    // Visa spelskärmen (återanvänder klockskärmen)
    showScreen('clockGame');

    // Uppdatera frågetexten
    const questionText = document.querySelector('.clock-question');
    if (questionText) {
        questionText.textContent = 'ÄR KLOCKAN HEL ELLER HALV?';
    }

    // Spela instruktionsljudet när spelet startar
    setTimeout(() => {
        playSound('instruction-helhalv');
    }, 400);

    // Starta första frågan
    nextHelHalvQuestion();
}

function nextHelHalvQuestion() {
    if (state.currentQuestion >= CONFIG.helHalvQuestions) {
        endGame();
        return;
    }

    // Markera nuvarande fråga
    updateProgressDots(elements.clockProgressDots, state.currentQuestion, null);

    // Avgör visarläge baserat på frågenummer:
    // Fråga 1-2 (index 0-1): Endast timvisare, hel timme
    // Fråga 3-4 (index 2-3): Båda visare, minutvisare på 12, hel timme
    // Fråga 5-8 (index 4-7): Minutvisare på 12 (hel) eller 6 (halv)
    // Fråga 9-10 (index 8-9): Som 5-8 men med lurigt alternativ (HALV X-1)
    let isHalfHour = false;
    let showMinuteHand = false;
    let useTrickyDistractor = false;

    if (state.currentQuestion <= 1) {
        // Fråga 1-2: Endast timvisare
        showMinuteHand = false;
        isHalfHour = false;
    } else if (state.currentQuestion <= 3) {
        // Fråga 3-4: Båda visare på hel timme
        showMinuteHand = true;
        isHalfHour = false;
    } else if (state.currentQuestion <= 7) {
        // Fråga 5-8: Slumpmässigt hel eller halv
        showMinuteHand = true;
        isHalfHour = Math.random() < 0.5;
    } else {
        // Fråga 9-10: Alltid halv timme med lurigt alternativ
        showMinuteHand = true;
        isHalfHour = true;
        useTrickyDistractor = true;
    }

    // Välj en slumpmässig timme som inte använts nyligen
    let availableHours = CONFIG.hours.filter(
        hour => !state.usedHours.includes(hour)
    );

    if (availableHours.length === 0) {
        state.usedHours = [];
        availableHours = [...CONFIG.hours];
    }

    // Slumpa måltimme
    const selectedHour = availableHours[
        Math.floor(Math.random() * availableHours.length)
    ];
    state.usedHours.push(selectedHour);

    // Uppdatera klockan
    setHelHalvClockHands(selectedHour, showMinuteHand, isHalfHour);

    // Bestäm rätt svar
    if (isHalfHour) {
        // För halv: svaret är nästa timme (halv 3 = klockan 2:30)
        const nextHour = selectedHour === 12 ? 1 : selectedHour + 1;
        state.targetHour = nextHour;
        state.isHalfHour = true;
    } else {
        state.targetHour = selectedHour;
        state.isHalfHour = false;
    }

    // Skapa svarsalternativ
    state.answerOptions = generateHelHalvOptions(state.targetHour, state.isHalfHour, useTrickyDistractor);

    // Rendera svarsknappar
    renderHelHalvAnswerButtons();

    state.isProcessing = false;
}

function setHelHalvClockHands(hour, showMinuteHand, isHalfHour) {
    // Timvisaren: 360 grader / 12 timmar = 30 grader per timme
    let hourAngle = (hour % 12) * 30;
    let minuteAngle = 0;

    if (isHalfHour) {
        // Halv timme: minutvisare på 6, timvisare mittemellan
        minuteAngle = 180; // 30 minuter = 180 grader
        // Timvisaren halvvägs till nästa timme
        hourAngle += 15; // Halva vägen (30/2 = 15 grader)
    }

    // Visa/dölj minutvisaren
    if (showMinuteHand) {
        elements.minuteHand.classList.add('visible');
        elements.minuteHand.style.transform =
            `translateX(-50%) translateY(-100%) rotate(${minuteAngle}deg)`;
    } else {
        elements.minuteHand.classList.remove('visible');
    }

    elements.hourHand.style.transform =
        `translateX(-50%) translateY(-100%) rotate(${hourAngle}deg)`;
}

function generateHelHalvOptions(correctHour, isHalfHour, useTrickyDistractor = false) {
    const correctAnswer = isHalfHour ? `HALV ${correctHour}` : `HEL ${correctHour}`;
    const options = [correctAnswer];

    // Lägg till lurigt alternativ om det ska användas
    // "HALV X" där X är siffran innan det korrekta svaret
    if (useTrickyDistractor) {
        const prevHour = correctHour === 1 ? 12 : correctHour - 1;
        const trickyOption = `HALV ${prevHour}`;
        if (!options.includes(trickyOption)) {
            options.push(trickyOption);
        }
    }

    // Skapa resterande alternativ
    const otherHours = CONFIG.hours.filter(h => h !== correctHour);

    while (options.length < 4) {
        const randomHour = otherHours[Math.floor(Math.random() * otherHours.length)];
        // Slumpmässigt välja HEL eller HALV för distraktorer
        const useHalf = Math.random() < 0.5;
        const option = useHalf ? `HALV ${randomHour}` : `HEL ${randomHour}`;

        if (!options.includes(option)) {
            options.push(option);
        }
    }

    // Blanda ordningen
    return shuffleArray(options);
}

function renderHelHalvAnswerButtons() {
    elements.clockAnswerGrid.innerHTML = '';

    state.answerOptions.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = option;
        btn.dataset.answer = option;
        btn.addEventListener('click', () => handleHelHalvAnswer(option, btn));
        elements.clockAnswerGrid.appendChild(btn);
    });
}

function handleHelHalvAnswer(selectedAnswer, buttonElement) {
    if (state.isProcessing) return;

    const correctAnswer = state.isHalfHour ? `HALV ${state.targetHour}` : `HEL ${state.targetHour}`;
    const isCorrect = selectedAnswer === correctAnswer;
    const isFirstAttempt = !elements.clockAnswerGrid.querySelector('.answer-btn.wrong');

    if (isCorrect) {
        state.isProcessing = true;
        buttonElement.classList.add('correct');
        playSound('correct');

        // Uppdatera statistik
        if (isFirstAttempt) {
            state.correctFirstTry++;
        }

        // Markera progress
        updateProgressDots(elements.clockProgressDots, state.currentQuestion, 'completed');

        // Gå till nästa fråga
        state.currentQuestion++;

        setTimeout(() => {
            nextHelHalvQuestion();
        }, CONFIG.delayAfterCorrect);

    } else {
        buttonElement.classList.add('wrong');
        buttonElement.disabled = true;
        playSound('wrong');
    }
}

// ========================================
// Spellogik: Minutvisaren
// ========================================
function startMinutvisarenGame() {
    // Skapa progress-prickar
    createProgressDots(elements.clockProgressDots, CONFIG.minutvisarenQuestions);

    // Visa spelskärmen (återanvänder klockskärmen)
    showScreen('clockGame');

    // Uppdatera frågetexten
    const questionText = document.querySelector('.clock-question');
    if (questionText) {
        questionText.textContent = 'VAD VISAR MINUTVISAREN?';
    }

    // Visa klockan med etiketter, dölj standard-klockan
    if (elements.clockWithLabels) {
        elements.clockWithLabels.classList.add('visible');
    }
    if (elements.clockContainer) {
        elements.clockContainer.style.display = 'none';
    }

    // Dölj timvisaren i standard-klockan
    if (elements.hourHand) {
        elements.hourHand.style.display = 'none';
    }

    // Spela instruktionsljudet när spelet startar
    setTimeout(() => {
        playSound('instruction-minutvisaren');
    }, 400);

    // Starta första frågan
    nextMinutvisarenQuestion();
}

function nextMinutvisarenQuestion() {
    if (state.currentQuestion >= CONFIG.minutvisarenQuestions) {
        // Återställ klockvyn innan vi avslutar
        resetClockView();
        endGame();
        return;
    }

    // Markera nuvarande fråga
    updateProgressDots(elements.clockProgressDots, state.currentQuestion, null);

    // Avgör vilka positioner som är tillåtna baserat på frågenummer:
    // Fråga 1-2 (index 0-1): Endast HEL (12) eller HALV (6)
    // Fråga 3-5 (index 2-4): HEL (12), HALV (6), KVART ÖVER (3), KVART I (9)
    // Fråga 6-10 (index 5-9): Alla positioner (1-12)
    let allowedPositions;

    if (state.currentQuestion <= 1) {
        // Fråga 1-2: Endast hel eller halv
        allowedPositions = [12, 6];
    } else if (state.currentQuestion <= 4) {
        // Fråga 3-5: Hel, halv, kvart över, kvart i
        allowedPositions = [12, 6, 3, 9];
    } else {
        // Fråga 6-10: Alla positioner
        allowedPositions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    }

    // Välj en slumpmässig position som inte använts nyligen (inom tillåtna)
    let availablePositions = allowedPositions.filter(
        pos => !state.usedMinutePositions.includes(pos)
    );

    if (availablePositions.length === 0) {
        // Om alla positioner inom den tillåtna gruppen är använda, återställ
        state.usedMinutePositions = state.usedMinutePositions.filter(
            pos => !allowedPositions.includes(pos)
        );
        availablePositions = [...allowedPositions];
    }

    // Slumpa målposition
    state.targetMinutePosition = availablePositions[
        Math.floor(Math.random() * availablePositions.length)
    ];
    state.usedMinutePositions.push(state.targetMinutePosition);

    // Uppdatera minutvisaren
    setMinutvisarenHand(state.targetMinutePosition);

    // Skapa svarsalternativ
    state.answerOptions = generateMinutvisarenOptions(state.targetMinutePosition, allowedPositions);

    // Rendera svarsknappar
    renderMinutvisarenAnswerButtons();

    state.isProcessing = false;
}

function setMinutvisarenHand(position) {
    // Minutvisaren: position 12 = 0 grader, position 3 = 90 grader, etc.
    // Varje position är 30 grader (360 / 12)
    const angle = (position % 12) * 30;

    if (elements.minuteHandLabeled) {
        elements.minuteHandLabeled.style.transform =
            `translateX(-50%) translateY(-100%) rotate(${angle}deg)`;
    }
}

function generateMinutvisarenOptions(correctPosition, allowedPositions) {
    const correctAnswer = CONFIG.minuteLabels[correctPosition];
    const options = [correctAnswer];

    // Skapa distraktorer från tillåtna positioner
    const otherPositions = allowedPositions.filter(p => p !== correctPosition);

    while (options.length < 4 && otherPositions.length > 0) {
        const randomIndex = Math.floor(Math.random() * otherPositions.length);
        const randomPosition = otherPositions[randomIndex];
        const option = CONFIG.minuteLabels[randomPosition];

        if (!options.includes(option)) {
            options.push(option);
        }
        otherPositions.splice(randomIndex, 1);
    }

    // Om vi inte har tillräckligt med alternativ från tillåtna positioner,
    // lägg till från övriga positioner
    const allPositions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const remainingPositions = allPositions.filter(
        p => p !== correctPosition && !allowedPositions.includes(p)
    );

    while (options.length < 4 && remainingPositions.length > 0) {
        const randomIndex = Math.floor(Math.random() * remainingPositions.length);
        const randomPosition = remainingPositions[randomIndex];
        const option = CONFIG.minuteLabels[randomPosition];

        if (!options.includes(option)) {
            options.push(option);
        }
        remainingPositions.splice(randomIndex, 1);
    }

    // Blanda ordningen
    return shuffleArray(options);
}

function renderMinutvisarenAnswerButtons() {
    elements.clockAnswerGrid.innerHTML = '';

    state.answerOptions.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn minutvisaren-answer';
        btn.textContent = option;
        btn.dataset.answer = option;
        btn.addEventListener('click', () => handleMinutvisarenAnswer(option, btn));
        elements.clockAnswerGrid.appendChild(btn);
    });
}

function handleMinutvisarenAnswer(selectedAnswer, buttonElement) {
    if (state.isProcessing) return;

    const correctAnswer = CONFIG.minuteLabels[state.targetMinutePosition];
    const isCorrect = selectedAnswer === correctAnswer;
    const isFirstAttempt = !elements.clockAnswerGrid.querySelector('.answer-btn.wrong');

    if (isCorrect) {
        state.isProcessing = true;
        buttonElement.classList.add('correct');
        playSound('correct');

        // Uppdatera statistik
        if (isFirstAttempt) {
            state.correctFirstTry++;
        }

        // Markera progress
        updateProgressDots(elements.clockProgressDots, state.currentQuestion, 'completed');

        // Gå till nästa fråga
        state.currentQuestion++;

        setTimeout(() => {
            nextMinutvisarenQuestion();
        }, CONFIG.delayAfterCorrect);

    } else {
        buttonElement.classList.add('wrong');
        buttonElement.disabled = true;
        playSound('wrong');
    }
}

function resetClockView() {
    // Återställ klockvyn till standard
    if (elements.clockWithLabels) {
        elements.clockWithLabels.classList.remove('visible');
        elements.clockWithLabels.classList.remove('hide-labels');
    }
    if (elements.clockContainer) {
        elements.clockContainer.style.display = '';
    }
    if (elements.hourHand) {
        elements.hourHand.style.display = '';
    }
    // Återställ timvisaren i den märkta klockan
    const hourHandLabeled = document.getElementById('hour-hand-labeled');
    if (hourHandLabeled) {
        hourHandLabeled.style.display = '';
    }
}

// ========================================
// Spellogik: Minutvisaren - Svår
// ========================================
function startMinutvisarenHardGame() {
    // Skapa progress-prickar
    createProgressDots(elements.clockProgressDots, CONFIG.minutvisarenHardQuestions);

    // Visa spelskärmen (återanvänder klockskärmen)
    showScreen('clockGame');

    // Uppdatera frågetexten
    const questionText = document.querySelector('.clock-question');
    if (questionText) {
        questionText.textContent = 'VAD VISAR MINUTVISAREN?';
    }

    // Visa klockan med etiketter, dölj standard-klockan
    if (elements.clockWithLabels) {
        elements.clockWithLabels.classList.add('visible');
        elements.clockWithLabels.classList.remove('hide-labels');
    }
    if (elements.clockContainer) {
        elements.clockContainer.style.display = 'none';
    }

    // Visa timvisaren i den märkta klockan (båda visarna ska visas)
    const hourHandLabeled = document.getElementById('hour-hand-labeled');
    if (hourHandLabeled) {
        hourHandLabeled.style.display = 'block';
    }

    // Spela instruktionsljudet när spelet startar
    setTimeout(() => {
        playSound('instruction-minutvisaren');
    }, 400);

    // Starta första frågan
    nextMinutvisarenHardQuestion();
}

function nextMinutvisarenHardQuestion() {
    if (state.currentQuestion >= CONFIG.minutvisarenHardQuestions) {
        // Återställ klockvyn innan vi avslutar
        resetClockView();
        endGame();
        return;
    }

    // Markera nuvarande fråga
    updateProgressDots(elements.clockProgressDots, state.currentQuestion, null);

    // Avgör vilka positioner som är tillåtna och om etiketter ska visas
    // Fråga 1-2 (index 0-1): Hel eller halv (12, 6) - MED etiketter
    // Fråga 3-5 (index 2-4): Alla positioner (1-12) - MED etiketter
    // Fråga 6-8 (index 5-7): Hel, halv, kvart i, kvart över (12, 6, 9, 3) - UTAN etiketter
    // Fråga 9-10 (index 8-9): Alla positioner (1-12) - UTAN etiketter
    let allowedPositions;
    let showLabels = true;

    if (state.currentQuestion <= 1) {
        // Fråga 1-2: Endast hel eller halv, med etiketter
        allowedPositions = [12, 6];
        showLabels = true;
    } else if (state.currentQuestion <= 4) {
        // Fråga 3-5: Alla positioner, med etiketter
        allowedPositions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        showLabels = true;
    } else if (state.currentQuestion <= 7) {
        // Fråga 6-8: Hel, halv, kvart i, kvart över, utan etiketter
        allowedPositions = [12, 6, 3, 9];
        showLabels = false;
    } else {
        // Fråga 9-10: Alla positioner, utan etiketter
        allowedPositions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        showLabels = false;
    }

    // Visa eller dölj etiketter
    if (elements.clockWithLabels) {
        if (showLabels) {
            elements.clockWithLabels.classList.remove('hide-labels');
        } else {
            elements.clockWithLabels.classList.add('hide-labels');
        }
    }

    // Välj en slumpmässig position som inte använts nyligen (inom tillåtna)
    let availablePositions = allowedPositions.filter(
        pos => !state.usedMinutePositions.includes(pos)
    );

    if (availablePositions.length === 0) {
        // Om alla positioner inom den tillåtna gruppen är använda, återställ
        state.usedMinutePositions = state.usedMinutePositions.filter(
            pos => !allowedPositions.includes(pos)
        );
        availablePositions = [...allowedPositions];
    }

    // Slumpa målposition för minutvisaren
    state.targetMinutePosition = availablePositions[
        Math.floor(Math.random() * availablePositions.length)
    ];
    state.usedMinutePositions.push(state.targetMinutePosition);

    // Uppdatera minutvisaren
    setMinutvisarenHand(state.targetMinutePosition);

    // Sätt timvisaren till en slumpmässig timme
    setMinutvisarenHardHourHand();

    // Skapa svarsalternativ
    state.answerOptions = generateMinutvisarenOptions(state.targetMinutePosition, allowedPositions);

    // Rendera svarsknappar
    renderMinutvisarenHardAnswerButtons();

    state.isProcessing = false;
}

function setMinutvisarenHardHourHand() {
    // Sätt timvisaren till en slumpmässig timme
    const randomHour = Math.floor(Math.random() * 12) + 1;
    const hourAngle = (randomHour % 12) * 30;

    // Lägg till lite extra rotation baserat på minutvisarens position för realism
    const minuteOffset = (state.targetMinutePosition % 12) * 2.5; // 0-30 grader extra

    const hourHandLabeled = document.getElementById('hour-hand-labeled');
    if (hourHandLabeled) {
        hourHandLabeled.style.transform =
            `translateX(-50%) translateY(-100%) rotate(${hourAngle + minuteOffset}deg)`;
    }
}

function handleMinutvisarenHardAnswer(selectedAnswer, buttonElement) {
    if (state.isProcessing) return;

    const correctAnswer = CONFIG.minuteLabels[state.targetMinutePosition];
    const isCorrect = selectedAnswer === correctAnswer;
    const isFirstAttempt = !elements.clockAnswerGrid.querySelector('.answer-btn.wrong');

    if (isCorrect) {
        state.isProcessing = true;
        buttonElement.classList.add('correct');
        playSound('correct');

        // Uppdatera statistik
        if (isFirstAttempt) {
            state.correctFirstTry++;
        }

        // Markera progress
        updateProgressDots(elements.clockProgressDots, state.currentQuestion, 'completed');

        // Gå till nästa fråga
        state.currentQuestion++;

        setTimeout(() => {
            nextMinutvisarenHardQuestion();
        }, CONFIG.delayAfterCorrect);

    } else {
        buttonElement.classList.add('wrong');
        buttonElement.disabled = true;
        playSound('wrong');
    }
}

function renderMinutvisarenHardAnswerButtons() {
    elements.clockAnswerGrid.innerHTML = '';

    state.answerOptions.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn minutvisaren-answer';
        btn.textContent = option;
        btn.dataset.answer = option;
        btn.addEventListener('click', () => handleMinutvisarenHardAnswer(option, btn));
        elements.clockAnswerGrid.appendChild(btn);
    });
}

// ========================================
// Spellogik: Tim- och Minutvisaren
// ========================================

// Hjälpfunktion: Bygg svarstext med tidsuttryck + timme
function getClockTimeAnswer(minutePosition, hour) {
    const label = CONFIG.minuteLabels[minutePosition];
    // För positioner 5-11 refererar svenska klockan till NÄSTA timme
    let refHour;
    if (minutePosition >= 5 && minutePosition <= 11) {
        refHour = hour === 12 ? 1 : hour + 1;
    } else {
        refHour = hour;
    }
    // Vid HEL visas bara siffran (t.ex. "3" istället för "HEL 3")
    if (minutePosition === 12) {
        return `${refHour}`;
    }
    return `${label} ${refHour}`;
}

function startTimOchMinutvisarenGame() {
    // Skapa progress-prickar
    createProgressDots(elements.clockProgressDots, CONFIG.timOchMinutvisarenQuestions);

    // Visa spelskärmen (återanvänder klockskärmen)
    showScreen('clockGame');

    // Uppdatera frågetexten
    const questionText = document.querySelector('.clock-question');
    if (questionText) {
        questionText.textContent = 'HUR MYCKET ÄR KLOCKAN?';
    }

    // Visa klockan med etiketter, dölj standard-klockan
    if (elements.clockWithLabels) {
        elements.clockWithLabels.classList.add('visible');
        elements.clockWithLabels.classList.remove('hide-labels');
    }
    if (elements.clockContainer) {
        elements.clockContainer.style.display = 'none';
    }

    // Visa timvisaren i den märkta klockan (båda visarna ska visas)
    const hourHandLabeled = document.getElementById('hour-hand-labeled');
    if (hourHandLabeled) {
        hourHandLabeled.style.display = 'block';
    }

    // Spela instruktionsljudet när spelet startar
    setTimeout(() => {
        playSound('instruction-timochminutvisaren');
    }, 400);

    // Starta första frågan
    nextTimOchMinutvisarenQuestion();
}

function nextTimOchMinutvisarenQuestion() {
    if (state.currentQuestion >= CONFIG.timOchMinutvisarenQuestions) {
        // Återställ klockvyn innan vi avslutar
        resetClockView();
        endGame();
        return;
    }

    // Markera nuvarande fråga
    updateProgressDots(elements.clockProgressDots, state.currentQuestion, null);

    // Avgör vilka minutpositioner som är tillåtna baserat på frågenummer:
    // Fråga 1-3 (index 0-2): Endast HEL (12) eller HALV (6)
    // Fråga 4-6 (index 3-5): HEL (12), HALV (6), KVART ÖVER (3), KVART I (9)
    // Fråga 7-10 (index 6-9): Alla positioner (1-12)
    let allowedPositions;

    if (state.currentQuestion <= 2) {
        allowedPositions = [12, 6];
    } else if (state.currentQuestion <= 5) {
        allowedPositions = [12, 6, 3, 9];
    } else {
        allowedPositions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    }

    // Välj en slumpmässig minutposition som inte använts nyligen (inom tillåtna)
    let availablePositions = allowedPositions.filter(
        pos => !state.usedMinutePositions.includes(pos)
    );

    if (availablePositions.length === 0) {
        state.usedMinutePositions = state.usedMinutePositions.filter(
            pos => !allowedPositions.includes(pos)
        );
        availablePositions = [...allowedPositions];
    }

    // Slumpa målposition för minutvisaren
    state.targetMinutePosition = availablePositions[
        Math.floor(Math.random() * availablePositions.length)
    ];
    state.usedMinutePositions.push(state.targetMinutePosition);

    // Välj en slumpmässig timme som inte använts nyligen
    let availableHours = CONFIG.hours.filter(
        hour => !state.usedHours.includes(hour)
    );

    if (availableHours.length === 0) {
        state.usedHours = [];
        availableHours = [...CONFIG.hours];
    }

    state.targetHour = availableHours[
        Math.floor(Math.random() * availableHours.length)
    ];
    state.usedHours.push(state.targetHour);

    // Sätt båda visarna
    setTimOchMinutvisarenHands(state.targetHour, state.targetMinutePosition);

    // Skapa svarsalternativ
    state.answerOptions = generateTimOchMinutvisarenOptions(
        state.targetMinutePosition, state.targetHour, allowedPositions
    );

    // Rendera svarsknappar
    renderTimOchMinutvisarenAnswerButtons();

    state.isProcessing = false;
}

function setTimOchMinutvisarenHands(hour, minutePosition) {
    // Minutvisaren: position 12 = 0 grader, varje position = 30 grader
    const minuteAngle = (minutePosition % 12) * 30;

    if (elements.minuteHandLabeled) {
        elements.minuteHandLabeled.style.transform =
            `translateX(-50%) translateY(-100%) rotate(${minuteAngle}deg)`;
    }

    // Timvisaren: basvinkel + offset baserat på minuterna
    const hourAngle = (hour % 12) * 30;
    const minuteOffset = (minutePosition % 12) * 2.5; // 0-27.5 grader extra

    const hourHandLabeled = document.getElementById('hour-hand-labeled');
    if (hourHandLabeled) {
        hourHandLabeled.style.transform =
            `translateX(-50%) translateY(-100%) rotate(${hourAngle + minuteOffset}deg)`;
    }
}

function generateTimOchMinutvisarenOptions(minutePosition, hour, allowedPositions) {
    const correctAnswer = getClockTimeAnswer(minutePosition, hour);
    const options = [correctAnswer];

    // 1. Samma tidsuttryck, annan timme (testar timavläsning)
    const otherHours = CONFIG.hours.filter(h => {
        return getClockTimeAnswer(minutePosition, h) !== correctAnswer;
    });
    if (otherHours.length > 0) {
        const randomHour = otherHours[Math.floor(Math.random() * otherHours.length)];
        const distractor = getClockTimeAnswer(minutePosition, randomHour);
        if (!options.includes(distractor)) {
            options.push(distractor);
        }
    }

    // 2. Annan minutposition, samma timme (testar minutavläsning)
    const otherPositions = shuffleArray(allowedPositions.filter(p => p !== minutePosition));
    for (const pos of otherPositions) {
        if (options.length >= 4) break;
        const distractor = getClockTimeAnswer(pos, hour);
        if (!options.includes(distractor)) {
            options.push(distractor);
        }
    }

    // 3. Fyll resterande med slumpmässiga kombinationer
    let attempts = 0;
    while (options.length < 4 && attempts < 50) {
        const randomPos = allowedPositions[Math.floor(Math.random() * allowedPositions.length)];
        const randomHour = CONFIG.hours[Math.floor(Math.random() * CONFIG.hours.length)];
        const distractor = getClockTimeAnswer(randomPos, randomHour);
        if (!options.includes(distractor)) {
            options.push(distractor);
        }
        attempts++;
    }

    return shuffleArray(options);
}

function renderTimOchMinutvisarenAnswerButtons() {
    elements.clockAnswerGrid.innerHTML = '';

    state.answerOptions.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn minutvisaren-answer';
        btn.textContent = option;
        btn.dataset.answer = option;
        btn.addEventListener('click', () => handleTimOchMinutvisarenAnswer(option, btn));
        elements.clockAnswerGrid.appendChild(btn);
    });
}

function handleTimOchMinutvisarenAnswer(selectedAnswer, buttonElement) {
    if (state.isProcessing) return;

    const correctAnswer = getClockTimeAnswer(state.targetMinutePosition, state.targetHour);
    const isCorrect = selectedAnswer === correctAnswer;
    const isFirstAttempt = !elements.clockAnswerGrid.querySelector('.answer-btn.wrong');

    if (isCorrect) {
        state.isProcessing = true;
        buttonElement.classList.add('correct');
        playSound('correct');

        if (isFirstAttempt) {
            state.correctFirstTry++;
        }

        updateProgressDots(elements.clockProgressDots, state.currentQuestion, 'completed');

        state.currentQuestion++;

        setTimeout(() => {
            nextTimOchMinutvisarenQuestion();
        }, CONFIG.delayAfterCorrect);

    } else {
        buttonElement.classList.add('wrong');
        buttonElement.disabled = true;
        playSound('wrong');
    }
}

// ========================================
// Avsluta spel
// ========================================
function endGame() {
    // Beräkna procent rätt
    let totalQuestions;
    if (state.currentGame === 'timvisaren') {
        totalQuestions = CONFIG.clockQuestions;
    } else if (state.currentGame === 'hel-halv') {
        totalQuestions = CONFIG.helHalvQuestions;
    } else if (state.currentGame === 'minutvisaren') {
        totalQuestions = CONFIG.minutvisarenQuestions;
    } else if (state.currentGame === 'minutvisaren-hard') {
        totalQuestions = CONFIG.minutvisarenHardQuestions;
    } else if (state.currentGame === 'tim-och-minutvisaren') {
        totalQuestions = CONFIG.timOchMinutvisarenQuestions;
    } else {
        totalQuestions = CONFIG.totalQuestions;
    }
    
    const percentage = Math.round(
        (state.correctFirstTry / totalQuestions) * 100
    );
    
    // Visa resultatskärmen
    showScreen('result');
    
    // Animera procenttalet
    animateNumber(elements.resultPercentage, 0, percentage, 1000);
    
    // Visa konfetti om bra resultat
    if (percentage >= 50) {
        setTimeout(() => {
            createConfetti();
        }, 500);
    }
}

function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (end - start) * easeOut);
        
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// ========================================
// Konfetti
// ========================================
function createConfetti() {
    elements.confettiContainer.innerHTML = '';
    
    const colors = [
        '#4a7c59', // forest-main
        '#6b9b7a', // forest-light
        '#a8d5b8', // forest-pale
        '#f4d35e', // sun-yellow
        '#faf8f0'  // cream
    ];
    
    for (let i = 0; i < CONFIG.confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        // Slumpmässig position, färg och fördröjning
        const left = Math.random() * 100;
        const delay = Math.random() * 1;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 6 + Math.random() * 8;
        const rotation = Math.random() * 360;
        
        confetti.style.cssText = `
            left: ${left}%;
            animation-delay: ${delay}s;
            background-color: ${color};
            width: ${size}px;
            height: ${size}px;
            border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
            transform: rotate(${rotation}deg);
            opacity: 0.7;
        `;
        
        elements.confettiContainer.appendChild(confetti);
    }
    
    // Rensa konfetti efter animationen
    setTimeout(() => {
        elements.confettiContainer.innerHTML = '';
    }, 4000);
}

// ========================================
// Event Listeners
// ========================================
function setupEventListeners() {
    // Ljudknappar
    elements.soundButtons.forEach(btn => {
        btn.addEventListener('click', toggleSound);
    });
    
    // Tillbaka-knappar
    elements.backButtons.forEach(btn => {
        btn.addEventListener('click', goBack);
    });
    
    // Lärområdes-knappar
    elements.areaButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const area = btn.dataset.area;
            if (area && !btn.disabled) {
                showScreen(area);
            }
        });
    });
    
    // Spelknappar
    elements.gameButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const game = btn.dataset.game;
            if (game && !btn.disabled) {
                startGame(game);
            }
        });
    });
    
    // Spela igen
    elements.playAgainBtn.addEventListener('click', () => {
        startGame(state.currentGame);
    });
    
    // Tillbaka till hem
    elements.goHomeBtn.addEventListener('click', () => {
        showScreen('home');
    });
    
    // Förhindra zoom på dubbelklick (iOS)
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - (document.lastTouchEnd || 0) < 300) {
            e.preventDefault();
        }
        document.lastTouchEnd = now;
    }, { passive: false });
}

// ========================================
// Initialisering
// ========================================
function init() {
    // Ladda ljudfiler
    loadAudio();
    
    // Ladda sparade inställningar
    loadSoundSetting();
    
    // Sätt upp event listeners
    setupEventListeners();
    
    // Visa startsidan efter laddning
    setTimeout(() => {
        showScreen('home');
    }, CONFIG.loadingDuration);
}

// Starta appen när DOM är redo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

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
    hurMycketArKlockanQuestions: 10, // 2 hel/halv + 6 alla utom 5ihalv/5överhalv + 2 alla
    delayAfterCorrect: 1000, // ms
    delayAfterWrong: 300, // ms
    loadingDuration: 1500, // ms
    confettiCount: 30,
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ'.split(''),
    // Svåra bokstäver - lätta att förväxla
    alphabetHard: 'ABDEGIJLNQRTYÅÄÖ'.split(''),
    // Hitta bokstaven - fallande bokstäver
    hittaBokstaven: {
        rounds: 5,               // antal poängrundor
        lettersPerRound: 5,      // bokstäver per runda
        testLetters: 4,          // kalibreringsbokstäver (första ignoreras)
        testFallTime: 4000,      // ms - långsamt fall under testrundan
        baselineMultiplier: 1.3, // runda 1 falltid = snitt-reaktionstid * 1.3
        speedStepUp: 0.12,       // 12% kortare falltid när man klarar >= 3/5
        speedStepDown: 0.12,     // 12% längre falltid när man missar
        passThreshold: 3,        // antal rätt av 5 som krävs för att öka tempo
        minFallTime: 700,        // ms - snabbaste tillåtna fall
        maxFallTime: 6000,       // ms - långsammaste tillåtna fall
        spawnDelay: 600,         // ms paus mellan bokstäver
        roundBannerDelay: 1500   // ms visa rundbanner innan första bokstaven
    },
    // Timmar för klockspelet
    hours: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    // Frågesport
    quizQuestions: 10,
    continentQuestions: 10, // 7 med världskarta + 3 enbart världsdel
    // Länder - antal länder per omgång
    landerQuestions: 10,
    // Länder-spelet: urval av välkända länder att fråga om (ID matchar SVG path-ID:n, utan "land-")
    landerCountries: [
        'sweden', 'norway', 'denmark', 'finland', 'iceland',
        'united-kingdom', 'ireland', 'france', 'spain', 'portugal',
        'italy', 'germany', 'poland', 'netherlands', 'greece',
        'switzerland', 'ukraine', 'russia', 'austria',
        'china', 'japan', 'india', 'thailand', 'indonesia',
        'turkey', 'saudi-arabia', 'iran', 'kazakhstan', 'mongolia',
        'vietnam', 'south-korea', 'pakistan',
        'egypt', 'south-africa', 'morocco', 'nigeria', 'kenya',
        'ethiopia', 'algeria', 'madagascar', 'tanzania', 'libya',
        'united-states-of-america', 'canada', 'mexico', 'greenland', 'cuba',
        'brazil', 'argentina', 'chile', 'peru', 'colombia', 'bolivia', 'venezuela',
        'australia', 'new-zealand'
    ],
    // Alla länder per världsdel (ID matchar SVG path-ID:n, utan "land-").
    // Hela världsdelen ritas ut och alla dess länder kan komma som fråga.
    // Ryssland utelämnas (dess kartyta sträcker sig över hela världskartan).
    continentDisplay: {
        europa: [
            'sweden', 'norway', 'denmark', 'finland', 'iceland',
            'united-kingdom', 'ireland', 'france', 'spain', 'portugal',
            'italy', 'germany', 'poland', 'netherlands', 'greece',
            'switzerland', 'ukraine', 'austria', 'belgium', 'romania', 'hungary',
            'belarus', 'moldova', 'lithuania', 'latvia', 'estonia', 'bulgaria',
            'albania', 'croatia', 'luxembourg', 'slovenia', 'slovakia', 'czechia',
            'bosnia-and-herz', 'north-macedonia', 'serbia', 'montenegro', 'kosovo',
            'cyprus', 'turkey'
        ],
        asien: [
            'russia',
            'china', 'japan', 'india', 'thailand', 'indonesia', 'turkey',
            'saudi-arabia', 'iran', 'kazakhstan', 'mongolia', 'vietnam',
            'south-korea', 'north-korea', 'pakistan', 'iraq', 'bangladesh',
            'philippines', 'malaysia', 'uzbekistan', 'timor-leste', 'cambodia',
            'laos', 'myanmar', 'bhutan', 'nepal', 'afghanistan', 'tajikistan',
            'kyrgyzstan', 'turkmenistan', 'syria', 'armenia', 'azerbaijan',
            'georgia', 'israel', 'lebanon', 'palestine', 'jordan',
            'united-arab-emirates', 'qatar', 'kuwait', 'oman', 'yemen',
            'sri-lanka', 'taiwan', 'brunei'
        ],
        afrika: [
            'tanzania', 'w-sahara', 'dem-rep-congo', 'somalia', 'kenya', 'sudan',
            'chad', 'south-africa', 'lesotho', 'zimbabwe', 'botswana', 'namibia',
            'senegal', 'mali', 'mauritania', 'benin', 'niger', 'nigeria',
            'cameroon', 'togo', 'ghana', 'cote-d-ivoire', 'guinea',
            'guinea-bissau', 'liberia', 'sierra-leone', 'burkina-faso',
            'central-african-rep', 'congo', 'gabon', 'eq-guinea', 'zambia',
            'malawi', 'mozambique', 'eswatini', 'angola', 'burundi', 'madagascar',
            'gambia', 'tunisia', 'algeria', 'morocco', 'egypt', 'libya',
            'ethiopia', 'djibouti', 'somaliland', 'uganda', 'rwanda', 'eritrea',
            's-sudan'
        ],
        nordamerika: [
            'canada', 'united-states-of-america', 'greenland', 'mexico',
            'guatemala', 'belize', 'honduras', 'el-salvador', 'nicaragua',
            'costa-rica', 'panama', 'cuba', 'haiti', 'dominican-rep', 'jamaica',
            'bahamas', 'puerto-rico', 'trinidad-and-tobago'
        ],
        sydamerika: [
            'brazil', 'argentina', 'chile', 'uruguay', 'bolivia', 'peru',
            'colombia', 'venezuela', 'guyana', 'suriname', 'ecuador', 'paraguay',
            'falkland-is'
        ]
    },
    // Världsdelar - ID matchar SVG path ID:n
    continents: [
        { id: 'nordamerika', name: 'NORDAMERIKA' },
        { id: 'sydamerika', name: 'SYDAMERIKA' },
        { id: 'europa', name: 'EUROPA' },
        { id: 'afrika', name: 'AFRIKA' },
        { id: 'asien', name: 'ASIEN' },
        { id: 'oceanien', name: 'OCEANIEN' },
        { id: 'antarktis', name: 'ANTARKTIS' }
    ],
    // Huvudstäder - antal frågor per omgång
    huvudstaderQuestions: 10,
    // Världsdelar som går att välja i Huvudstäder-spelet (Antarktis saknar huvudstäder)
    huvudstaderContinents: [
        { id: 'europa', name: 'EUROPA' },
        { id: 'asien', name: 'ASIEN' },
        { id: 'afrika', name: 'AFRIKA' },
        { id: 'nordamerika', name: 'NORDAMERIKA' },
        { id: 'sydamerika', name: 'SYDAMERIKA' },
        { id: 'oceanien', name: 'OCEANIEN' }
    ],
    // Länder och deras huvudstäder per världsdel
    capitals: {
        europa: [
            { land: 'Sverige', huvudstad: 'Stockholm' },
            { land: 'Norge', huvudstad: 'Oslo' },
            { land: 'Danmark', huvudstad: 'Köpenhamn' },
            { land: 'Finland', huvudstad: 'Helsingfors' },
            { land: 'Island', huvudstad: 'Reykjavik' },
            { land: 'Storbritannien', huvudstad: 'London' },
            { land: 'Irland', huvudstad: 'Dublin' },
            { land: 'Frankrike', huvudstad: 'Paris' },
            { land: 'Spanien', huvudstad: 'Madrid' },
            { land: 'Portugal', huvudstad: 'Lissabon' },
            { land: 'Italien', huvudstad: 'Rom' },
            { land: 'Tyskland', huvudstad: 'Berlin' },
            { land: 'Polen', huvudstad: 'Warszawa' },
            { land: 'Nederländerna', huvudstad: 'Amsterdam' },
            { land: 'Grekland', huvudstad: 'Aten' },
            { land: 'Schweiz', huvudstad: 'Bern' },
            { land: 'Österrike', huvudstad: 'Wien' },
            { land: 'Belgien', huvudstad: 'Bryssel' },
            { land: 'Ukraina', huvudstad: 'Kiev' },
            { land: 'Ryssland', huvudstad: 'Moskva' },
            { land: 'Rumänien', huvudstad: 'Bukarest' },
            { land: 'Ungern', huvudstad: 'Budapest' },
            { land: 'Tjeckien', huvudstad: 'Prag' },
            { land: 'Kroatien', huvudstad: 'Zagreb' },
            { land: 'Serbien', huvudstad: 'Belgrad' },
            { land: 'Bulgarien', huvudstad: 'Sofia' },
            { land: 'Estland', huvudstad: 'Tallinn' },
            { land: 'Lettland', huvudstad: 'Riga' },
            { land: 'Litauen', huvudstad: 'Vilnius' },
            { land: 'Slovakien', huvudstad: 'Bratislava' },
            { land: 'Slovenien', huvudstad: 'Ljubljana' }
        ],
        asien: [
            { land: 'Kina', huvudstad: 'Peking' },
            { land: 'Japan', huvudstad: 'Tokyo' },
            { land: 'Indien', huvudstad: 'New Delhi' },
            { land: 'Thailand', huvudstad: 'Bangkok' },
            { land: 'Indonesien', huvudstad: 'Jakarta' },
            { land: 'Turkiet', huvudstad: 'Ankara' },
            { land: 'Saudiarabien', huvudstad: 'Riyadh' },
            { land: 'Iran', huvudstad: 'Teheran' },
            { land: 'Kazakstan', huvudstad: 'Astana' },
            { land: 'Mongoliet', huvudstad: 'Ulan Bator' },
            { land: 'Vietnam', huvudstad: 'Hanoi' },
            { land: 'Sydkorea', huvudstad: 'Seoul' },
            { land: 'Nordkorea', huvudstad: 'Pyongyang' },
            { land: 'Pakistan', huvudstad: 'Islamabad' },
            { land: 'Irak', huvudstad: 'Bagdad' },
            { land: 'Bangladesh', huvudstad: 'Dhaka' },
            { land: 'Filippinerna', huvudstad: 'Manila' },
            { land: 'Malaysia', huvudstad: 'Kuala Lumpur' },
            { land: 'Nepal', huvudstad: 'Katmandu' },
            { land: 'Afghanistan', huvudstad: 'Kabul' },
            { land: 'Syrien', huvudstad: 'Damaskus' },
            { land: 'Israel', huvudstad: 'Jerusalem' },
            { land: 'Jordanien', huvudstad: 'Amman' },
            { land: 'Sri Lanka', huvudstad: 'Colombo' }
        ],
        afrika: [
            { land: 'Egypten', huvudstad: 'Kairo' },
            { land: 'Sydafrika', huvudstad: 'Pretoria' },
            { land: 'Marocko', huvudstad: 'Rabat' },
            { land: 'Nigeria', huvudstad: 'Abuja' },
            { land: 'Kenya', huvudstad: 'Nairobi' },
            { land: 'Etiopien', huvudstad: 'Addis Abeba' },
            { land: 'Algeriet', huvudstad: 'Alger' },
            { land: 'Tanzania', huvudstad: 'Dodoma' },
            { land: 'Libyen', huvudstad: 'Tripoli' },
            { land: 'Ghana', huvudstad: 'Accra' },
            { land: 'Senegal', huvudstad: 'Dakar' },
            { land: 'Tunisien', huvudstad: 'Tunis' },
            { land: 'Zimbabwe', huvudstad: 'Harare' },
            { land: 'Zambia', huvudstad: 'Lusaka' },
            { land: 'Angola', huvudstad: 'Luanda' },
            { land: 'Moçambique', huvudstad: 'Maputo' },
            { land: 'Uganda', huvudstad: 'Kampala' },
            { land: 'Kamerun', huvudstad: 'Yaoundé' },
            { land: 'Sudan', huvudstad: 'Khartoum' },
            { land: 'Namibia', huvudstad: 'Windhoek' },
            { land: 'Botswana', huvudstad: 'Gaborone' },
            { land: 'Madagaskar', huvudstad: 'Antananarivo' },
            { land: 'Mali', huvudstad: 'Bamako' }
        ],
        nordamerika: [
            { land: 'USA', huvudstad: 'Washington' },
            { land: 'Kanada', huvudstad: 'Ottawa' },
            { land: 'Mexiko', huvudstad: 'Mexico City' },
            { land: 'Kuba', huvudstad: 'Havanna' },
            { land: 'Guatemala', huvudstad: 'Guatemala City' },
            { land: 'Panama', huvudstad: 'Panama City' },
            { land: 'Costa Rica', huvudstad: 'San José' },
            { land: 'Honduras', huvudstad: 'Tegucigalpa' },
            { land: 'Nicaragua', huvudstad: 'Managua' },
            { land: 'Jamaica', huvudstad: 'Kingston' },
            { land: 'Haiti', huvudstad: 'Port-au-Prince' },
            { land: 'Dominikanska republiken', huvudstad: 'Santo Domingo' },
            { land: 'El Salvador', huvudstad: 'San Salvador' },
            { land: 'Belize', huvudstad: 'Belmopan' },
            { land: 'Bahamas', huvudstad: 'Nassau' }
        ],
        sydamerika: [
            { land: 'Brasilien', huvudstad: 'Brasília' },
            { land: 'Argentina', huvudstad: 'Buenos Aires' },
            { land: 'Chile', huvudstad: 'Santiago' },
            { land: 'Peru', huvudstad: 'Lima' },
            { land: 'Colombia', huvudstad: 'Bogotá' },
            { land: 'Venezuela', huvudstad: 'Caracas' },
            { land: 'Bolivia', huvudstad: 'La Paz' },
            { land: 'Ecuador', huvudstad: 'Quito' },
            { land: 'Uruguay', huvudstad: 'Montevideo' },
            { land: 'Paraguay', huvudstad: 'Asunción' },
            { land: 'Guyana', huvudstad: 'Georgetown' },
            { land: 'Surinam', huvudstad: 'Paramaribo' }
        ],
        oceanien: [
            { land: 'Australien', huvudstad: 'Canberra' },
            { land: 'Nya Zeeland', huvudstad: 'Wellington' },
            { land: 'Fiji', huvudstad: 'Suva' },
            { land: 'Papua Nya Guinea', huvudstad: 'Port Moresby' },
            { land: 'Samoa', huvudstad: 'Apia' },
            { land: 'Tonga', huvudstad: 'Nukualofa' }
        ]
    },
    // Frågor för 7 år - blandat (kolumn 1 = fråga, kolumn 2 = rätt svar, kolumn 3-5 = fel svar)
    quiz7arBlandat: [
        { question: 'Vilken färg får man om man blandar rött och blått?', answers: ['Lila', 'Grön', 'Orange', 'Brun'] },
        { question: 'Hur många ben har en spindel?', answers: ['8', '6', '10', '4'] },
        { question: 'Vad heter Sveriges huvudstad?', answers: ['Stockholm', 'Göteborg', 'Malmö', 'Uppsala'] },
        { question: 'Vilket djur är ett däggdjur?', answers: ['Delfin', 'Groda', 'Ödla', 'Fisk'] },
        { question: 'Vilken av dessa är inte ett väder?', answers: ['Skugga', 'Regn', 'Blåsigt', 'Molnigt'] },
        { question: 'Vad kallas ett barn till en häst?', answers: ['Föl', 'Kalv', 'Kid', 'Lamm'] },
        { question: 'Vilket tal är störst?', answers: ['41', '14', '32', '24'] },
        { question: 'Vad betyder ordet "först"?', answers: ['Tidigast', 'Sist', 'Snabbast', 'Längst'] },
        { question: 'Vilket av dessa är en frukt?', answers: ['Äpple', 'Morot', 'Gurka', 'Potatis'] },
        { question: 'Vilket material kommer papper från?', answers: ['Träd', 'Sten', 'Plast', 'Metall'] },
        { question: 'Vilket land ligger bredvid Sverige?', answers: ['Norge', 'Spanien', 'Finland', 'Tyskland'] },
        { question: 'Vad gör en domare i en fotbollsmatch?', answers: ['Dömer matchen', 'Gör mål', 'Spelar i laget', 'Tränar spelarna'] },
        { question: 'Vad är ett rim till ordet "boll"?', answers: ['Koll', 'Bil', 'Stol', 'Bal'] },
        { question: 'Hur många minuter är det på en timme?', answers: ['60', '50', '100', '30'] },
        { question: 'Vilket instrument har tangenter?', answers: ['Piano', 'Trumma', 'Gitarr', 'Flöjt'] },
        { question: 'Vilken form har alla hörn lika långa sidor?', answers: ['Kvadrat', 'Rektangel', 'Cirkel', 'Triangel'] },
        { question: 'Vad är en regel?', answers: ['Något man följer', 'Något man ritar', 'Något man äter', 'Något man leker med'] },
        { question: 'Vilken av dessa hör till kroppen?', answers: ['Armbåge', 'Stol', 'Ryggsäck', 'Jacka'] },
        { question: 'Vad är 5 + 5?', answers: ['10', '15', '11', '9'] },
        { question: 'Vad händer med vatten när det fryser?', answers: ['Det blir is', 'Det försvinner', 'Det blir gas', 'Det blir varmare'] },
        { question: 'Vilket djur är ett rovdjur?', answers: ['Lejon', 'Kanin', 'Ko', 'Häst'] },
        { question: 'Vad betyder "lika mycket"?', answers: ['Samma mängd', 'Olika', 'Större', 'Mindre'] },
        { question: 'Vad är motsatsen till "stor"?', answers: ['Liten', 'Lång', 'Tung', 'Snabb'] },
        { question: 'Vilken av dessa är en kontinent?', answers: ['Europa', 'Sverige', 'Stockholm', 'Norden'] },
        { question: 'Vad heter Sveriges kung?', answers: ['Carl XVI Gustaf', 'Olof Palme', 'Gustav Vasa', 'Stefan Löfven'] },
        { question: 'Vad gör man oftast i ett klassrum?', answers: ['Lär sig saker', 'Sover', 'Tränar', 'Handlar'] },
        { question: 'Vilket tal är jämnt?', answers: ['12', '7', '9', '15'] },
        { question: 'Vad är en karta till för?', answers: ['Visa var saker finns', 'Mäta tid', 'Rita bilder', 'Skriva texter'] },
        { question: 'Vilket av dessa är ett bränsle?', answers: ['Bensin', 'Vatten', 'Sand', 'Glas'] },
        { question: 'Vad är "hello" på svenska?', answers: ['Hej', 'Hej då', 'Tack', 'Snälla'] },
        { question: 'Vilken form har ett hjul?', answers: ['Cirkel', 'Fyrkant', 'Triangel', 'Rektangel'] },
        { question: 'Vad är ett verb?', answers: ['Ett ord som visar vad man gör', 'Ett namn', 'Ett ord som beskriver', 'Ett räkneord'] },
        { question: 'Vilken av dessa är ett hjälpmedel i trafiken?', answers: ['Övergångsställe', 'Lekplats', 'Park', 'Affär'] },
        { question: 'Vilket djur lägger ägg?', answers: ['Höna', 'Ko', 'Häst', 'Gris'] },
        { question: 'Vad betyder "ansvar"?', answers: ['Något man måste ta hand om', 'Något man glömmer', 'Något man leker', 'Något man äter'] },
        { question: 'Vad är 10 − 3?', answers: ['7', '6', '8', '5'] },
        { question: 'Vilket av dessa ord är ett sammansatt ord?', answers: ['Solglasögon', 'Sol', 'Boll', 'Se'] },
        { question: 'Vad används elektricitet till?', answers: ['Få saker att fungera', 'Andas', 'Odla växter', 'Mäta längd'] },
        { question: 'Vad heter vår närmaste stjärna?', answers: ['Solen', 'Månen', 'Mars', 'Venus'] },
        { question: 'Vad är ett dygn?', answers: ['24 timmar', '6 timmar', '12 timmar', '48 timmar'] },
        { question: 'Vilken av dessa är en lag?', answers: ['Att stanna vid rött ljus', 'Att borsta tänderna', 'Att leka ute', 'Att läsa böcker'] },
        { question: 'Vad gör lungorna?', answers: ['Andas', 'Tänker', 'Smälter mat', 'Hör'] },
        { question: 'Vilket av dessa är ett yrke?', answers: ['Lärare', 'Boll', 'Stol', 'Regn'] },
        { question: 'Vad är ett material?', answers: ['Något man bygger med', 'En färg', 'Ett djur', 'Ett land'] },
        { question: 'Vilket land ligger längst bort?', answers: ['Australien', 'Danmark', 'Norge', 'Finland'] },
        { question: 'Vad betyder "framtid"?', answers: ['Det som ska hända', 'Det som hände', 'Det som händer nu', 'Det som aldrig händer'] },
        { question: 'Vilket av dessa är ett flytande ämne?', answers: ['Vatten', 'Sten', 'Is', 'Trä'] },
        { question: 'Vad gör en författare?', answers: ['Skriver böcker', 'Ritar', 'Sjunger', 'Filmar'] },
        { question: 'Vad är ett mönster?', answers: ['Något som upprepas', 'Något som går sönder', 'Något som är osynligt', 'Något som är slump'] },
        { question: 'Varför har vi regler i samhället?', answers: ['För att alla ska vara trygga', 'För att leka', 'För att tävla', 'För att vinna'] }
    ],
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
    returnToArea: 'home', // Vilken skärm man ska återvända till
    // Frågesport
    quizSelectedQuestions: [], // De 10 slumpvalda frågorna för aktuell omgång
    quizCorrectAnswer: '', // Rätt svar för aktuell fråga
    // Världsdelar-spelet
    continentOrder: [], // Slumpad ordning av världsdelar för omgången
    continentCorrectAnswer: '', // Rätt världsdel för aktuell fråga
    // Länder-spelet
    landerOrder: [], // Slumpad ordning av länder-ID:n för omgången
    landerCorrectSlug: '', // Rätt lands-ID för aktuell fråga
    landerWrongThisQuestion: false, // Om spelaren tryckt fel på aktuell fråga
    landerListenersBound: false, // Om klick-lyssnare på länder är bundna
    landerContinent: 'world', // Vald världsdel ('world' = hela världen)
    // Huvudstäder-spelet
    huvudstaderSelected: [], // Valda världsdelar (id:n) för omgången
    huvudstaderOrder: [], // Slumpad ordning av frågor { land, huvudstad } för omgången
    huvudstaderCorrectAnswer: '', // Rätt huvudstad för aktuell fråga
    huvudstaderTotal: 10, // Antal frågor i aktuell omgång
    huvudstaderPool: [], // Alla länder i de valda världsdelarna (för svarsalternativ)
    landerTotal: 10, // Antal frågor i aktuell omgång (kan vara färre än 10 i små världsdelar)
    landerBounds: null, // Yttre gräns för zoom/pan (hela kartan eller inzoomad världsdel)
    landerView: { x: 0, y: 0, w: 1000, h: 500 }, // Aktuell viewBox för zoom/pan
    landerPreviewInterval: null, // Timer för förhandsvisningen av alla ländernamn
    landerPreviewActive: false, // Om förhandsvisningen (namnen på kartan) pågår
    // Hitta bokstaven
    hb: {
        phase: 'idle',           // 'calibration' | 'round' | 'ended' | 'idle'
        round: 0,                // 0 = kalibrering, 1..5 = poängrundor
        letterIndex: 0,          // bokstav inom aktuell fas
        fallTime: 0,             // aktuell falltid (ms)
        baselineReaction: 0,     // snitt av sista 3 kalibreringsreaktionerna
        calibrationTimes: [],    // reaktionstider under testrundan
        targetLetter: '',        // aktuell bokstav (versal)
        lastLetter: '',          // föregående bokstav (undvik direkt upprepning)
        spawnTime: 0,            // performance.now() vid spawn
        rafId: null,             // aktivt requestAnimationFrame-id
        travel: 0,               // px boxen ska falla denna spawn
        roundCorrect: 0,         // rätt i aktuell runda
        totalCorrect: 0,         // rätt totalt (poängrundor)
        fastestFallTime: Infinity, // för "högsta hastighet"
        isProcessing: false,     // hindrar dubbelhantering mellan spawns
        isComposing: false,      // IME-skydd
        listenersBound: false    // input-lyssnare bundna en gång
    }
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
        fragesport: document.getElementById('fragesport-screen'),
        geografi: document.getElementById('geografi-screen'),
        quizGame: document.getElementById('quiz-game-screen'),
        landerSelect: document.getElementById('lander-select-screen'),
        landerGame: document.getElementById('lander-game-screen'),
        huvudstaderSelect: document.getElementById('huvudstader-select-screen'),
        huvudstaderGame: document.getElementById('huvudstader-game-screen'),
        game: document.getElementById('game-screen'),
        clockGame: document.getElementById('clock-game-screen'),
        hittaBokstaven: document.getElementById('hitta-bokstaven-screen'),
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
    // Frågesport-element
    quizProgressDots: document.getElementById('quiz-progress-dots'),
    quizQuestionText: document.getElementById('quiz-question-text'),
    quizAnswerGrid: document.getElementById('quiz-answer-grid'),
    // Världsdelar-element
    continentMapSection: document.getElementById('continent-map-section'),
    worldMapSvg: document.getElementById('world-map-svg'),
    // Länder-element
    landerProgressDots: document.getElementById('lander-progress-dots'),
    landerCountryName: document.getElementById('lander-country-name'),
    landerMapViewport: document.getElementById('lander-map-viewport'),
    countryMapSvg: document.getElementById('country-map-svg'),
    landerZoomIn: document.getElementById('lander-zoom-in'),
    landerZoomOut: document.getElementById('lander-zoom-out'),
    landerZoomReset: document.getElementById('lander-zoom-reset'),
    // Huvudstäder-element
    huvudstaderProgressDots: document.getElementById('huvudstader-progress-dots'),
    huvudstaderCountry: document.getElementById('huvudstader-country'),
    huvudstaderAnswerGrid: document.getElementById('huvudstader-answer-grid'),
    huvudstaderOptions: document.getElementById('huvudstader-options'),
    huvudstaderStartBtn: document.getElementById('huvudstader-start-btn'),
    // Resultat
    resultPercentage: document.getElementById('result-percentage'),
    playAgainBtn: document.getElementById('play-again-btn'),
    goHomeBtn: document.getElementById('go-home-btn'),
    confettiContainer: document.getElementById('confetti-container'),
    hamsterCelebration: document.getElementById('hamster-celebration'),
    // Hitta bokstaven
    hbArea: document.getElementById('hb-area'),
    hbBox: document.getElementById('hb-box'),
    hbInput: document.getElementById('hb-input'),
    hbBanner: document.getElementById('hb-banner'),
    hbBannerTitle: document.getElementById('hb-banner-title'),
    hbBannerSub: document.getElementById('hb-banner-sub'),
    hbSpeed: document.getElementById('hb-speed'),
    hbRound: document.getElementById('hb-round'),
    hbCleared: document.getElementById('hb-cleared'),
    hbEnd: document.getElementById('hb-end'),
    hbEndSpeed: document.getElementById('hb-end-speed'),
    hbEndCorrect: document.getElementById('hb-end-correct'),
    hbPlayAgain: document.getElementById('hb-play-again'),
    hbGoHome: document.getElementById('hb-go-home')
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
    audio.forsok = new Audio('audio/forsok.mp3');

    // Sätt volym (subtil)
    audio.correct.volume = 0.5;
    audio.wrong.volume = 0.4;
    audio.instructionLetter.volume = 0.7;
    audio.instructionClock.volume = 0.7;
    audio.instructionHelHalv.volume = 0.7;
    audio.instructionMinutvisaren.volume = 0.7;
    audio.instructionTimOchMinutvisaren.volume = 0.7;
    audio.forsok.volume = 0.7;
    
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
    } else if (soundType === 'forsok') {
        audioElement = audio.forsok;
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
        case 'fragesport':
        case 'geografi':
            showScreen('home');
            break;
        case 'landerSelect':
            showScreen('geografi');
            break;
        case 'huvudstaderSelect':
            showScreen('geografi');
            break;
        case 'huvudstaderGame':
            showScreen(state.returnToArea);
            break;
        case 'game':
            showScreen(state.returnToArea);
            break;
        case 'hittaBokstaven':
            stopHittaBokstaven();
            showScreen(state.returnToArea);
            break;
        case 'clockGame':
            showScreen('klockan');
            break;
        case 'quizGame':
            elements.continentMapSection.style.display = 'none';
            elements.worldMapSvg.classList.remove('continent-solo-mode');
            showScreen(state.returnToArea);
            break;
        case 'landerGame':
            finishLanderPreview();
            showScreen(state.returnToArea);
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
    if (['timvisaren', 'hel-halv', 'minutvisaren', 'minutvisaren-hard', 'tim-och-minutvisaren', 'hur-mycket-ar-klockan'].includes(gameType)) {
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
    } else if (gameType === 'hur-mycket-ar-klockan') {
        state.returnToArea = 'klockan';
        startHurMycketArKlockanGame();
    } else if (gameType === 'quiz-7ar-blandat') {
        state.returnToArea = 'fragesport';
        startQuizGame();
    } else if (gameType === 'quiz-varldsdelar') {
        state.returnToArea = 'geografi';
        startContinentGame();
    } else if (gameType === 'lander') {
        state.returnToArea = 'landerSelect';
        startLanderGame();
    } else if (gameType === 'huvudstader') {
        state.returnToArea = 'huvudstaderSelect';
        startHuvudstaderGame();
    } else if (gameType === 'hitta-bokstaven') {
        state.returnToArea = 'svenska';
        startHittaBokstavenGame();
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

    // Uppdatera frågetexten
    const questionText = document.querySelector('.clock-question');
    if (questionText) {
        questionText.textContent = 'VILKEN TIMME PEKAR TIMVISAREN PÅ?';
    }

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

    // Dölj timvisaren i den märkta klockan (endast minutvisaren ska synas)
    const hourHandLabeled = document.getElementById('hour-hand-labeled');
    if (hourHandLabeled) {
        hourHandLabeled.style.display = 'none';
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

    // Visa klockan utan etiketter, dölj standard-klockan
    if (elements.clockWithLabels) {
        elements.clockWithLabels.classList.add('visible');
        elements.clockWithLabels.classList.add('hide-labels');
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

    // Avgör vilka positioner som är tillåtna (inga etiketter visas i detta spel)
    // Fråga 1-2 (index 0-1): Hel eller halv (12, 6)
    // Fråga 3-5 (index 2-4): Alla positioner (1-12)
    // Fråga 6-8 (index 5-7): Hel, halv, kvart i, kvart över (12, 6, 9, 3)
    // Fråga 9-10 (index 8-9): Alla positioner (1-12)
    let allowedPositions;

    if (state.currentQuestion <= 1) {
        // Fråga 1-2: Endast hel eller halv
        allowedPositions = [12, 6];
    } else if (state.currentQuestion <= 4) {
        // Fråga 3-5: Alla positioner
        allowedPositions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    } else if (state.currentQuestion <= 7) {
        // Fråga 6-8: Hel, halv, kvart i, kvart över
        allowedPositions = [12, 6, 3, 9];
    } else {
        // Fråga 9-10: Alla positioner
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
// Spellogik: Hur mycket är klockan?
// ========================================

function startHurMycketArKlockanGame() {
    // Skapa progress-prickar
    createProgressDots(elements.clockProgressDots, CONFIG.hurMycketArKlockanQuestions);

    // Visa spelskärmen (återanvänder klockskärmen)
    showScreen('clockGame');

    // Uppdatera frågetexten
    const questionText = document.querySelector('.clock-question');
    if (questionText) {
        questionText.textContent = 'HUR MYCKET ÄR KLOCKAN?';
    }

    // Visa klockan med etiketter-layout men DÖLJ etiketterna
    if (elements.clockWithLabels) {
        elements.clockWithLabels.classList.add('visible');
        elements.clockWithLabels.classList.add('hide-labels');
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
    nextHurMycketArKlockanQuestion();
}

function nextHurMycketArKlockanQuestion() {
    if (state.currentQuestion >= CONFIG.hurMycketArKlockanQuestions) {
        // Återställ klockvyn innan vi avslutar
        resetClockView();
        endGame();
        return;
    }

    // Markera nuvarande fråga
    updateProgressDots(elements.clockProgressDots, state.currentQuestion, null);

    // Avgör vilka minutpositioner som är tillåtna baserat på frågenummer:
    // Fråga 1-2 (index 0-1): Endast HEL (12) eller HALV (6)
    // Fråga 3-8 (index 2-7): Allt utom FEM I HALV (5) och FEM ÖVER HALV (7)
    // Fråga 9-10 (index 8-9): Alla positioner (1-12)
    let allowedPositions;

    if (state.currentQuestion <= 1) {
        allowedPositions = [12, 6];
    } else if (state.currentQuestion <= 7) {
        allowedPositions = [1, 2, 3, 4, 6, 8, 9, 10, 11, 12];
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

    // Sätt båda visarna (återanvänder samma funktion som tim-och-minutvisaren)
    setTimOchMinutvisarenHands(state.targetHour, state.targetMinutePosition);

    // Skapa svarsalternativ
    state.answerOptions = generateTimOchMinutvisarenOptions(
        state.targetMinutePosition, state.targetHour, allowedPositions
    );

    // Rendera svarsknappar
    renderHurMycketArKlockanAnswerButtons();

    state.isProcessing = false;
}

function renderHurMycketArKlockanAnswerButtons() {
    elements.clockAnswerGrid.innerHTML = '';

    state.answerOptions.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn minutvisaren-answer';
        btn.textContent = option;
        btn.dataset.answer = option;
        btn.addEventListener('click', () => handleHurMycketArKlockanAnswer(option, btn));
        elements.clockAnswerGrid.appendChild(btn);
    });
}

function handleHurMycketArKlockanAnswer(selectedAnswer, buttonElement) {
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
            nextHurMycketArKlockanQuestion();
        }, CONFIG.delayAfterCorrect);

    } else {
        buttonElement.classList.add('wrong');
        buttonElement.disabled = true;
        playSound('wrong');
    }
}

// ========================================
// Spellogik: Frågesport
// ========================================
function startQuizGame() {
    // Välj 10 slumpade frågor från poolen
    const allQuestions = [...CONFIG.quiz7arBlandat];
    const shuffled = shuffleArray(allQuestions);
    state.quizSelectedQuestions = shuffled.slice(0, CONFIG.quizQuestions);

    // Dölj världskarta (om den var synlig från annat spel)
    elements.continentMapSection.style.display = 'none';

    // Skapa progress-prickar
    createProgressDots(elements.quizProgressDots, CONFIG.quizQuestions);

    // Visa spelskärmen
    showScreen('quizGame');

    // Starta första frågan
    nextQuizQuestion();
}

function nextQuizQuestion() {
    if (state.currentQuestion >= CONFIG.quizQuestions) {
        endGame();
        return;
    }

    // Markera nuvarande fråga
    updateProgressDots(elements.quizProgressDots, state.currentQuestion, null);

    // Hämta aktuell fråga
    const questionData = state.quizSelectedQuestions[state.currentQuestion];

    // Rätt svar är alltid answers[0]
    state.quizCorrectAnswer = String(questionData.answers[0]);

    // Blanda svarsalternativen (kopiera arrayen först, konvertera allt till strängar)
    const shuffledAnswers = shuffleArray(questionData.answers.map(a => String(a)));

    // Visa frågan
    elements.quizQuestionText.textContent = questionData.question;

    // Rendera svarsknappar
    renderQuizAnswerButtons(shuffledAnswers);

    state.isProcessing = false;
}

function renderQuizAnswerButtons(answers) {
    elements.quizAnswerGrid.innerHTML = '';

    answers.forEach(answer => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn quiz-answer';
        btn.textContent = answer;
        btn.dataset.answer = answer;
        btn.addEventListener('click', () => handleQuizAnswer(answer, btn));
        elements.quizAnswerGrid.appendChild(btn);
    });
}

function handleQuizAnswer(selectedAnswer, buttonElement) {
    if (state.isProcessing) return;

    const isCorrect = selectedAnswer === state.quizCorrectAnswer;
    const isFirstAttempt = !elements.quizAnswerGrid.querySelector('.answer-btn.wrong');

    if (isCorrect) {
        state.isProcessing = true;
        buttonElement.classList.add('correct');
        playSound('correct');

        if (isFirstAttempt) {
            state.correctFirstTry++;
        }

        updateProgressDots(elements.quizProgressDots, state.currentQuestion, 'completed');

        state.currentQuestion++;

        setTimeout(() => {
            nextQuizQuestion();
        }, CONFIG.delayAfterCorrect);

    } else {
        buttonElement.classList.add('wrong');
        buttonElement.disabled = true;
        playSound('wrong');
    }
}

// ========================================
// Spellogik: Världsdelarna
// ========================================
function startContinentGame() {
    // Skapa en slumpad ordning av alla 7 världsdelar
    const shuffledContinents = shuffleArray([...CONFIG.continents]);
    // De första 7 frågorna: världskarta med markerad världsdel
    // De sista 3 frågorna: enbart världsdelen (utan karta), centrerad och förstorad
    // Välj 3 slumpade världsdelar för de sista frågorna
    const extraContinents = shuffleArray([...CONFIG.continents]).slice(0, 3);
    state.continentOrder = [...shuffledContinents, ...extraContinents];

    // Skapa progress-prickar
    createProgressDots(elements.quizProgressDots, CONFIG.continentQuestions);

    // Visa spelskärmen
    showScreen('quizGame');

    // Visa kartansektionen
    elements.continentMapSection.style.display = '';

    // Starta första frågan
    nextContinentQuestion();
}

function nextContinentQuestion() {
    if (state.currentQuestion >= CONFIG.continentQuestions) {
        // Dölj kartan och återställ
        elements.continentMapSection.style.display = 'none';
        elements.worldMapSvg.classList.remove('continent-solo-mode');
        endGame();
        return;
    }

    // Markera nuvarande fråga
    updateProgressDots(elements.quizProgressDots, state.currentQuestion, null);

    // Hämta aktuell världsdel
    const currentContinent = state.continentOrder[state.currentQuestion];
    state.continentCorrectAnswer = currentContinent.name;

    // Visa frågetext
    elements.quizQuestionText.textContent = 'VILKEN VÄRLDSDEL?';

    const isMapRound = state.currentQuestion < 7;

    // Återställ alla världsdelar
    CONFIG.continents.forEach(c => {
        const path = document.getElementById('continent-' + c.id);
        if (path) {
            path.classList.remove('continent-highlight');
            path.style.display = '';
        }
    });

    if (isMapRound) {
        // Världskarta-läge: visa alla, markera en
        elements.worldMapSvg.classList.remove('continent-solo-mode');
        // Ta bort eventuellt solo-viewBox
        elements.worldMapSvg.setAttribute('viewBox', '30.767 241.591 784.077 510');

        const highlightPath = document.getElementById('continent-' + currentContinent.id);
        if (highlightPath) {
            highlightPath.classList.add('continent-highlight');
        }
    } else {
        // Solo-läge: visa enbart den aktuella världsdelen, centrerad och förstorad
        elements.worldMapSvg.classList.add('continent-solo-mode');

        // Dölj alla andra världsdelar
        CONFIG.continents.forEach(c => {
            const path = document.getElementById('continent-' + c.id);
            if (path) {
                if (c.id === currentContinent.id) {
                    path.style.display = '';
                    path.classList.add('continent-highlight');
                } else {
                    path.style.display = 'none';
                }
            }
        });

        // Zooma in på den enskilda världsdelen
        const soloPath = document.getElementById('continent-' + currentContinent.id);
        if (soloPath) {
            const bbox = soloPath.getBBox();
            const padding = 30;
            const vbX = bbox.x - padding;
            const vbY = bbox.y - padding;
            const vbW = bbox.width + padding * 2;
            const vbH = bbox.height + padding * 2;
            elements.worldMapSvg.setAttribute('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`);
        }
    }

    // Skapa svarsalternativ: rätt svar + 3 felaktiga
    const wrongContinents = CONFIG.continents.filter(c => c.name !== currentContinent.name);
    const shuffledWrong = shuffleArray(wrongContinents).slice(0, 3);
    const allAnswers = shuffleArray([currentContinent.name, ...shuffledWrong.map(c => c.name)]);

    // Rendera svarsknappar
    renderContinentAnswerButtons(allAnswers);

    state.isProcessing = false;
}

function renderContinentAnswerButtons(answers) {
    elements.quizAnswerGrid.innerHTML = '';

    answers.forEach(answer => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn quiz-answer';
        btn.textContent = answer;
        btn.dataset.answer = answer;
        btn.addEventListener('click', () => handleContinentAnswer(answer, btn));
        elements.quizAnswerGrid.appendChild(btn);
    });
}

function handleContinentAnswer(selectedAnswer, buttonElement) {
    if (state.isProcessing) return;

    const isCorrect = selectedAnswer === state.continentCorrectAnswer;
    const isFirstAttempt = !elements.quizAnswerGrid.querySelector('.answer-btn.wrong');

    if (isCorrect) {
        state.isProcessing = true;
        buttonElement.classList.add('correct');
        playSound('correct');

        if (isFirstAttempt) {
            state.correctFirstTry++;
        }

        updateProgressDots(elements.quizProgressDots, state.currentQuestion, 'completed');

        state.currentQuestion++;

        setTimeout(() => {
            nextContinentQuestion();
        }, CONFIG.delayAfterCorrect);

    } else {
        buttonElement.classList.add('wrong');
        buttonElement.disabled = true;
        playSound('wrong');
    }
}

// ========================================
// Spellogik: Huvudstäder
// ========================================
function startHuvudstaderGame() {
    // Bygg pool av länder från de valda världsdelarna
    const selected = state.huvudstaderSelected.length
        ? state.huvudstaderSelected
        : CONFIG.huvudstaderContinents.map(c => c.id);

    let pool = [];
    selected.forEach(id => {
        if (CONFIG.capitals[id]) {
            pool = pool.concat(CONFIG.capitals[id]);
        }
    });

    // Slumpa och begränsa antalet frågor (aldrig fler än det finns länder)
    const shuffled = shuffleArray([...pool]);
    state.huvudstaderTotal = Math.min(CONFIG.huvudstaderQuestions, shuffled.length);
    state.huvudstaderOrder = shuffled.slice(0, state.huvudstaderTotal);

    // Alla huvudstäder i poolen används som felaktiga svarsalternativ
    state.huvudstaderPool = pool;

    // Skapa progress-prickar
    createProgressDots(elements.huvudstaderProgressDots, state.huvudstaderTotal);

    // Visa spelskärmen
    showScreen('huvudstaderGame');

    // Starta första frågan
    nextHuvudstaderQuestion();
}

function nextHuvudstaderQuestion() {
    if (state.currentQuestion >= state.huvudstaderTotal) {
        endGame();
        return;
    }

    // Markera nuvarande fråga
    updateProgressDots(elements.huvudstaderProgressDots, state.currentQuestion, null);

    // Hämta aktuellt land
    const current = state.huvudstaderOrder[state.currentQuestion];
    state.huvudstaderCorrectAnswer = current.huvudstad;

    // Visa landets namn
    elements.huvudstaderCountry.textContent = current.land;

    // Skapa svarsalternativ: rätt huvudstad + 3 felaktiga från poolen
    const wrong = state.huvudstaderPool
        .filter(c => c.huvudstad !== current.huvudstad)
        .map(c => c.huvudstad);
    const uniqueWrong = [...new Set(wrong)];
    const shuffledWrong = shuffleArray(uniqueWrong).slice(0, 3);
    const allAnswers = shuffleArray([current.huvudstad, ...shuffledWrong]);

    // Rendera svarsknappar
    renderHuvudstaderAnswerButtons(allAnswers);

    state.isProcessing = false;
}

function renderHuvudstaderAnswerButtons(answers) {
    elements.huvudstaderAnswerGrid.innerHTML = '';

    answers.forEach(answer => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn quiz-answer';
        btn.textContent = answer;
        btn.dataset.answer = answer;
        btn.addEventListener('click', () => handleHuvudstaderAnswer(answer, btn));
        elements.huvudstaderAnswerGrid.appendChild(btn);
    });
}

function handleHuvudstaderAnswer(selectedAnswer, buttonElement) {
    if (state.isProcessing) return;

    const isCorrect = selectedAnswer === state.huvudstaderCorrectAnswer;
    const isFirstAttempt = !elements.huvudstaderAnswerGrid.querySelector('.answer-btn.wrong');

    if (isCorrect) {
        state.isProcessing = true;
        buttonElement.classList.add('correct');
        playSound('correct');

        if (isFirstAttempt) {
            state.correctFirstTry++;
        }

        updateProgressDots(elements.huvudstaderProgressDots, state.currentQuestion, 'completed');

        state.currentQuestion++;

        setTimeout(() => {
            nextHuvudstaderQuestion();
        }, CONFIG.delayAfterCorrect);

    } else {
        buttonElement.classList.add('wrong');
        buttonElement.disabled = true;
        playSound('wrong');
    }
}

// Bygg världsdelsvalet (kryssrutor) för Huvudstäder
function setupHuvudstaderSelect() {
    if (!elements.huvudstaderOptions) return;

    // Rensa och bygg kryssrutor
    elements.huvudstaderOptions.innerHTML = '';

    // "Hela världen"-knapp överst
    const worldBtn = document.createElement('button');
    worldBtn.className = 'hs-option hs-option-world';
    worldBtn.dataset.hsWorld = 'true';
    worldBtn.innerHTML = '<span class="hs-check" aria-hidden="true"></span><span class="hs-option-label">HELA VÄRLDEN</span>';
    elements.huvudstaderOptions.appendChild(worldBtn);

    // En knapp per världsdel
    CONFIG.huvudstaderContinents.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'hs-option';
        btn.dataset.hsContinent = c.id;
        btn.innerHTML = `<span class="hs-check" aria-hidden="true"></span><span class="hs-option-label">${c.name}</span>`;
        elements.huvudstaderOptions.appendChild(btn);
    });

    // Klick-lyssnare
    elements.huvudstaderOptions.querySelectorAll('.hs-option').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.hsWorld) {
                // Växla alla världsdelar på/av
                const turnOn = !btn.classList.contains('selected');
                elements.huvudstaderOptions.querySelectorAll('.hs-option').forEach(b => {
                    b.classList.toggle('selected', turnOn);
                });
            } else {
                btn.classList.toggle('selected');
            }
            syncHuvudstaderSelection();
        });
    });

    resetHuvudstaderSelect();
}

// Återställ valet (inget markerat)
function resetHuvudstaderSelect() {
    if (!elements.huvudstaderOptions) return;
    elements.huvudstaderOptions.querySelectorAll('.hs-option').forEach(b => {
        b.classList.remove('selected');
    });
    syncHuvudstaderSelection();
}

// Uppdatera "Hela världen"-status, valt tillstånd och start-knappen
function syncHuvudstaderSelection() {
    const continentBtns = [...elements.huvudstaderOptions.querySelectorAll('.hs-option[data-hs-continent]')];
    const selectedIds = continentBtns
        .filter(b => b.classList.contains('selected'))
        .map(b => b.dataset.hsContinent);

    state.huvudstaderSelected = selectedIds;

    // "Hela världen" markeras när alla världsdelar är valda
    const worldBtn = elements.huvudstaderOptions.querySelector('.hs-option-world');
    if (worldBtn) {
        worldBtn.classList.toggle('selected', selectedIds.length === continentBtns.length);
    }

    // Start-knappen aktiveras när minst en världsdel är vald
    if (elements.huvudstaderStartBtn) {
        elements.huvudstaderStartBtn.disabled = selectedIds.length === 0;
    }
}

// ========================================
// Spellogik: Länder (världskarta)
// ========================================
const LANDER_MAP = { W: 1000, H: 631.4, MIN_W: 40 }; // Mercator-karta; MIN_W = maximal inzoomning (mindre = mer zoom)
// Länder vars kartyta täcker hela kartan (Ryssland wrap:ar över antimeridianen) och
// därför inte ska påverka inzoomningen av en världsdel – de ritas ut men ramar inte in vyn.
const LANDER_BBOX_EXCLUDE = ['russia'];

function startLanderGame() {
    const continent = state.landerContinent || 'world';

    // Välj länderurval: alla länder i världen, eller alla länder i vald världsdel
    const pool = continent === 'world'
        ? getAllCountrySlugs()
        : (CONFIG.continentDisplay[continent] || getAllCountrySlugs());

    // Antal frågor: högst landerQuestions, men aldrig fler än det finns länder
    state.landerTotal = Math.min(CONFIG.landerQuestions, pool.length);

    // Slumpa länder ur urvalet
    state.landerOrder = shuffleArray([...pool]).slice(0, state.landerTotal);

    // Skapa progress-prickar
    createProgressDots(elements.landerProgressDots, state.landerTotal);

    // Visa spelskärmen (måste ske före getBBox så att kartan är utlagd)
    showScreen('landerGame');

    // Bind klick-/zoom-lyssnare en gång
    bindLanderInteractions();

    // Ställ in världsdelsläge (visa endast vald världsdel) och beräkna zoom-gräns
    setupLanderContinent(continent);

    // Återställ kartvyn till gränsen (hela världen eller inzoomad världsdel)
    resetLanderView();

    // Rensa markeringar
    clearLanderHighlights();

    // Ta bort ev. kvarvarande förhandsvisning från en tidigare omgång
    finishLanderPreview();

    // Endast de världsdelskopplade varianterna visar ländernas namn i förväg.
    // Varianten "hela världen" startar direkt utan förhandsvisning.
    if (continent === 'world') {
        nextLanderQuestion();
    } else {
        // Visa namnen på alla länder på kartan i 10 sekunder, starta sedan omgången
        showLanderPreview(continent, () => nextLanderQuestion());
    }
}

// Antal sekunder som ländernas namn visas på kartan innan omgången börjar
const LANDER_PREVIEW_SECONDS = 10;

// Rita ut namnen på alla länder (hela världen eller vald världsdel) ovanpå kartan
// en kort stund så barnet hinner lära sig dem innan omgången startar.
function showLanderPreview(continent, onDone) {
    const svg = elements.countryMapSvg;
    const viewport = elements.landerMapViewport;
    if (!svg || !viewport) { onDone(); return; }

    // Vilka länder ska namnges? Alla på kartan i det aktuella läget.
    const slugs = continent === 'world'
        ? getAllCountrySlugs()
        : (CONFIG.continentDisplay[continent] || getAllCountrySlugs());

    // Textstorlek i kartkoordinater, relativt aktuell vy, så etiketterna blir
    // ungefär lika stora på skärmen oavsett hur långt kartan är inzoomad.
    const viewW = (state.landerView && state.landerView.w) || LANDER_MAP.W;
    const fontSize = viewW / 45;

    // En grupp med alla ländernamn, ritad i samma koordinatsystem som kartan
    // (följer med vid zoom/pan) och utan att fånga klick.
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('id', 'lander-preview-labels');
    group.setAttribute('pointer-events', 'none');

    slugs.forEach(slug => {
        const path = document.getElementById('land-' + slug);
        if (!path) return;
        let b;
        try { b = path.getBBox(); } catch (e) { return; }
        if (!b || (b.width === 0 && b.height === 0)) return;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', b.x + b.width / 2);
        text.setAttribute('y', b.y + b.height / 2);
        text.setAttribute('class', 'country-label');
        text.setAttribute('font-size', fontSize);
        text.textContent = path.dataset.name || slug;
        group.appendChild(text);
    });
    svg.appendChild(group);

    // Liten banner med nedräkning ovanpå kartan
    const banner = document.createElement('div');
    banner.className = 'lander-preview-banner';
    viewport.appendChild(banner);

    state.landerPreviewActive = true;
    state.isProcessing = true; // hindra klick medan namnen visas

    let secondsLeft = LANDER_PREVIEW_SECONDS;
    const render = () => {
        banner.textContent = `Lär dig länderna! Spelet börjar om ${secondsLeft} s`;
    };
    render();

    state.landerPreviewInterval = setInterval(() => {
        secondsLeft -= 1;
        if (secondsLeft <= 0) {
            finishLanderPreview();
            onDone();
        } else {
            render();
        }
    }, 1000);
}

// Avsluta/städa upp förhandsvisningen (timer, etiketter och banner)
function finishLanderPreview() {
    if (state.landerPreviewInterval) {
        clearInterval(state.landerPreviewInterval);
        state.landerPreviewInterval = null;
    }
    state.landerPreviewActive = false;
    const group = document.getElementById('lander-preview-labels');
    if (group && group.parentNode) group.parentNode.removeChild(group);
    if (elements.landerMapViewport) {
        const banner = elements.landerMapViewport.querySelector('.lander-preview-banner');
        if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    }
}

// Alla länder som är utritade på kartan (för Världen-varianten)
function getAllCountrySlugs() {
    if (!elements.countryMapSvg) return CONFIG.landerCountries;
    const slugs = Array.from(elements.countryMapSvg.querySelectorAll('.country-path'))
        .map(p => p.id.replace(/^land-/, ''))
        .filter(Boolean);
    return slugs.length ? slugs : CONFIG.landerCountries;
}

// Slå ihop landdelar som inte är egna länder med sitt huvudland (t.ex. Nordcypern → Cypern).
// Källans kartyta läggs till målets väg och källvägen tas bort, så hela ön blir en enhet.
function mergeCountries() {
    const merges = [
        { into: 'cyprus', from: 'n-cyprus' } // Nordcypern är inget eget land
    ];
    merges.forEach(({ into, from }) => {
        const target = document.getElementById('land-' + into);
        const source = document.getElementById('land-' + from);
        if (!target || !source) return;
        target.setAttribute('d', (target.getAttribute('d') || '') + (source.getAttribute('d') || ''));
        source.parentNode.removeChild(source);
    });
}

// Plocka bort avlägsna landdelar (t.ex. Svalbard och Franska Guyana) ur några länders
// vägar och lägg dem i separata, icke-klickbara vägar. De syns bara i Världen-läget och
// påverkar därför inte inzoomningen av världsdelarna.
function splitOutlierTerritories() {
    const splits = [
        { slug: 'norway', keep: s => s.minY >= 130 }, // behåll fastlandet, ta bort Svalbard (norrut)
        { slug: 'france', keep: s => s.minY < 400 }   // behåll Europa-delen, ta bort Franska Guyana (söderut)
    ];
    splits.forEach(cfg => {
        const path = document.getElementById('land-' + cfg.slug);
        if (!path) return;
        const d = path.getAttribute('d');
        if (!d) return;
        const subs = d.split(/(?=M)/).filter(s => s.trim().length);
        const keep = [], extra = [];
        subs.forEach(sub => {
            const nums = (sub.match(/-?\d+(\.\d+)?/g) || []).map(Number);
            let minY = Infinity, maxY = -Infinity;
            for (let i = 1; i < nums.length; i += 2) {
                if (nums[i] < minY) minY = nums[i];
                if (nums[i] > maxY) maxY = nums[i];
            }
            (cfg.keep({ minY, maxY }) ? keep : extra).push(sub);
        });
        if (!extra.length) return;
        path.setAttribute('d', keep.join(''));
        const extraPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        extraPath.setAttribute('class', 'country-extra');
        extraPath.setAttribute('d', extra.join(''));
        extraPath.id = 'extra-' + cfg.slug;
        path.parentNode.appendChild(extraPath);
    });
}

// Ställ in vilka länder som visas och beräkna zoom-/pan-gränsen för vald världsdel
function setupLanderContinent(continent) {
    const svg = elements.countryMapSvg;
    if (!svg) {
        state.landerBounds = { x: 0, y: 0, w: LANDER_MAP.W, h: LANDER_MAP.H };
        return;
    }

    // Nollställ tidigare markeringar av aktiva länder
    svg.querySelectorAll('.country-path').forEach(p => p.classList.remove('country-active'));

    if (continent === 'world') {
        svg.classList.remove('country-map-svg--solo');
        // Passa in hela världen efter kartrutans form (fyller rutan, hela världen syns)
        state.landerBounds = fitBoxToAspect(
            { x: 0, y: 0, w: LANDER_MAP.W, h: LANDER_MAP.H }, 0, landerAspect()
        );
        return;
    }

    // Endast vald världsdel ska synas – rita ut alla dess länder
    svg.classList.add('country-map-svg--solo');
    const shown = CONFIG.continentDisplay[continent] || [];
    shown.forEach(slug => {
        const p = document.getElementById('land-' + slug);
        if (p) p.classList.add('country-active');
    });

    // Beräkna gemensam bounding box för hela världsdelen och zooma in på den.
    // Ryssland utelämnas ur ramberäkningen eftersom dess kartyta sträcker sig runt
    // hela kartan – annars zoomas världsdelen ut helt. Landet ritas ändå ut och
    // kan klickas/frågas (den del som ligger inom vyn syns).
    const framed = shown.filter(slug => !LANDER_BBOX_EXCLUDE.includes(slug));
    const bbox = computeSlugsBBox(framed.length ? framed : shown);
    state.landerBounds = bbox
        ? fitBoxToAspect(bbox, 0.06, landerAspect())
        : fitBoxToAspect({ x: 0, y: 0, w: LANDER_MAP.W, h: LANDER_MAP.H }, 0, landerAspect());
}

// Kartrutans faktiska bildförhållande (bredd/höjd i pixlar)
function landerAspect() {
    const r = elements.landerMapViewport ? elements.landerMapViewport.getBoundingClientRect() : null;
    if (r && r.width > 0 && r.height > 0) return r.width / r.height;
    return LANDER_MAP.W / LANDER_MAP.H;
}

// Gemensam bounding box (i kartkoordinater) för en lista av länder
function computeSlugsBBox(slugs) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let found = false;
    slugs.forEach(slug => {
        const p = document.getElementById('land-' + slug);
        if (!p) return;
        let b;
        try { b = p.getBBox(); } catch (e) { return; }
        if (!b || (b.width === 0 && b.height === 0)) return;
        found = true;
        minX = Math.min(minX, b.x);
        minY = Math.min(minY, b.y);
        maxX = Math.max(maxX, b.x + b.width);
        maxY = Math.max(maxY, b.y + b.height);
    });
    if (!found) return null;
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

// Expandera en bounding box (med marginal) till ett givet bildförhållande A (bredd/höjd)
// så att den fyller kartrutan utan att beskäras. Omgivande yta blir hav.
function fitBoxToAspect(bbox, padFrac, A) {
    const padX = bbox.w * padFrac;
    const padY = bbox.h * padFrac;
    let x = bbox.x - padX;
    let y = bbox.y - padY;
    let w = bbox.w + 2 * padX;
    let h = bbox.h + 2 * padY;

    // Expandera smalaste ledden så förhållandet matchar kartrutan
    if (w / h < A) {
        const nw = h * A;
        x -= (nw - w) / 2;
        w = nw;
    } else {
        const nh = w / A;
        y -= (nh - h) / 2;
        h = nh;
    }

    return { x, y, w, h };
}

function clearLanderHighlights() {
    if (!elements.countryMapSvg) return;
    elements.countryMapSvg.querySelectorAll('.country-path').forEach(p => {
        p.classList.remove('country-correct', 'country-wrong', 'country-reveal');
    });
}

function nextLanderQuestion() {
    if (state.currentQuestion >= state.landerTotal) {
        endGame();
        return;
    }

    // Markera nuvarande fråga
    updateProgressDots(elements.landerProgressDots, state.currentQuestion, null);

    clearLanderHighlights();
    state.landerWrongThisQuestion = false;
    state.isProcessing = false;

    // Aktuellt land
    const slug = state.landerOrder[state.currentQuestion];
    state.landerCorrectSlug = slug;

    const path = document.getElementById('land-' + slug);
    const name = path ? (path.dataset.name || slug) : slug;
    elements.landerCountryName.textContent = name.toUpperCase();
}

function handleLanderClick(clickedSlug, pathElement) {
    if (state.isProcessing) return;

    if (clickedSlug === state.landerCorrectSlug) {
        // Rätt!
        state.isProcessing = true;
        pathElement.classList.add('country-correct');
        playSound('correct');

        if (!state.landerWrongThisQuestion) {
            state.correctFirstTry++;
        }

        updateProgressDots(elements.landerProgressDots, state.currentQuestion, 'completed');
        state.currentQuestion++;

        setTimeout(() => {
            nextLanderQuestion();
        }, CONFIG.delayAfterCorrect);
    } else {
        // Fel - markera rött och visa var det rätta landet ligger
        state.landerWrongThisQuestion = true;
        pathElement.classList.add('country-wrong');
        playSound('wrong');

        // Visa det rätta landet så barnet får lära sig
        const correctPath = document.getElementById('land-' + state.landerCorrectSlug);
        if (correctPath) {
            correctPath.classList.add('country-reveal');
        }

        setTimeout(() => {
            pathElement.classList.remove('country-wrong');
        }, 600);
    }
}

// ---- Zoom & pan för världskartan ----
function applyLanderView() {
    const v = state.landerView;
    if (elements.countryMapSvg) {
        elements.countryMapSvg.setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h}`);
    }
}

function resetLanderView() {
    const b = state.landerBounds || { x: 0, y: 0, w: LANDER_MAP.W, h: LANDER_MAP.H };
    state.landerView = { x: b.x, y: b.y, w: b.w, h: b.h };
    applyLanderView();
}

// Beräkna det faktiskt ritade kartområdet inuti viewporten (hänsyn till letterbox)
function getLanderDrawnRect() {
    const rect = elements.landerMapViewport.getBoundingClientRect();
    const aspect = landerAspect(); // viewBox följer kartrutans form, så letterbox ≈ 0
    const containerAspect = rect.width / rect.height;
    let drawnW, drawnH, offsetX, offsetY;
    if (containerAspect > aspect) {
        drawnH = rect.height;
        drawnW = drawnH * aspect;
        offsetX = (rect.width - drawnW) / 2;
        offsetY = 0;
    } else {
        drawnW = rect.width;
        drawnH = drawnW / aspect;
        offsetX = 0;
        offsetY = (rect.height - drawnH) / 2;
    }
    return { left: rect.left + offsetX, top: rect.top + offsetY, width: drawnW, height: drawnH };
}

function clampLanderView() {
    const v = state.landerView;
    const b = state.landerBounds || { x: 0, y: 0, w: LANDER_MAP.W, h: LANDER_MAP.H };
    const aspect = landerAspect();
    // Behåll kartans bildförhållande
    v.h = v.w / aspect;
    // Begränsa zoom: aldrig utanför gränsen (världsdel eller hela kartan)
    if (v.w > b.w) { v.w = b.w; v.h = v.w / aspect; }
    if (v.w < LANDER_MAP.MIN_W) { v.w = LANDER_MAP.MIN_W; v.h = v.w / aspect; }
    // Håll vyn inom gränsen
    if (v.x < b.x) v.x = b.x;
    if (v.y < b.y) v.y = b.y;
    if (v.x + v.w > b.x + b.w) v.x = b.x + b.w - v.w;
    if (v.y + v.h > b.y + b.h) v.y = b.y + b.h - v.h;
}

function zoomLanderAt(clientX, clientY, factor) {
    const draw = getLanderDrawnRect();
    const v = state.landerView;
    // Förhållande av pekpunkten inom det ritade området (0-1)
    let rx = (clientX - draw.left) / draw.width;
    let ry = (clientY - draw.top) / draw.height;
    rx = Math.max(0, Math.min(1, rx));
    ry = Math.max(0, Math.min(1, ry));
    // Punkt i kartkoordinater
    const px = v.x + rx * v.w;
    const py = v.y + ry * v.h;
    // Ny bredd
    const maxW = (state.landerBounds && state.landerBounds.w) || LANDER_MAP.W;
    let newW = v.w / factor;
    newW = Math.max(LANDER_MAP.MIN_W, Math.min(maxW, newW));
    const newH = newW / landerAspect();
    // Behåll punkten under pekaren
    v.x = px - rx * newW;
    v.y = py - ry * newH;
    v.w = newW;
    v.h = newH;
    clampLanderView();
    applyLanderView();
}

function bindLanderInteractions() {
    if (state.landerListenersBound) return;
    state.landerListenersBound = true;

    const svg = elements.countryMapSvg;
    const viewport = elements.landerMapViewport;
    if (!svg || !viewport) return;

    // Klick på länder
    svg.querySelectorAll('.country-path').forEach(path => {
        path.addEventListener('click', (e) => {
            if (viewport.dataset.dragged === 'true') return; // ignorera klick efter panorering
            const slug = path.id.replace(/^land-/, '');
            handleLanderClick(slug, path);
        });
    });

    // Zoomknappar
    if (elements.landerZoomIn) {
        elements.landerZoomIn.addEventListener('click', () => {
            const r = viewport.getBoundingClientRect();
            zoomLanderAt(r.left + r.width / 2, r.top + r.height / 2, 1.6);
        });
    }
    if (elements.landerZoomOut) {
        elements.landerZoomOut.addEventListener('click', () => {
            const r = viewport.getBoundingClientRect();
            zoomLanderAt(r.left + r.width / 2, r.top + r.height / 2, 1 / 1.6);
        });
    }
    if (elements.landerZoomReset) {
        elements.landerZoomReset.addEventListener('click', () => resetLanderView());
    }

    // Hjulzoom
    viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
        zoomLanderAt(e.clientX, e.clientY, factor);
    }, { passive: false });

    // Pekare för panorering + nypzoom
    const pointers = new Map();
    let last = null;         // senaste position för en-fingers panorering
    let startPos = null;     // startposition för att skilja tryck från drag
    let pinchDist = 0;       // avstånd mellan två fingrar
    let captured = false;    // om vi fångat pekaren för aktiv drag/pan

    function onPointerDown(e) {
        // Låt zoomknapparna hantera sina egna klick
        if (e.target.closest('.lander-zoom-controls')) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.size === 1) {
            viewport.dataset.dragged = 'false';
            last = { x: e.clientX, y: e.clientY };
            startPos = { x: e.clientX, y: e.clientY };
        } else if (pointers.size === 2) {
            const pts = [...pointers.values()];
            pinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            // Två fingrar = zoom, aldrig ett landval
            viewport.dataset.dragged = 'true';
        }
    }

    function onPointerMove(e) {
        if (!pointers.has(e.pointerId)) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pointers.size === 2) {
            // Nypzoom
            const pts = [...pointers.values()];
            const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            if (pinchDist > 0) {
                const factor = dist / pinchDist;
                const midX = (pts[0].x + pts[1].x) / 2;
                const midY = (pts[0].y + pts[1].y) / 2;
                zoomLanderAt(midX, midY, factor);
            }
            pinchDist = dist;
            viewport.dataset.dragged = 'true';
            return;
        }

        if (pointers.size === 1 && last) {
            const moved = startPos ? Math.hypot(e.clientX - startPos.x, e.clientY - startPos.y) : 0;
            // Börja panorera först när rörelsen är tydlig (så tapp på land inte blir drag)
            if (!captured && moved <= 6) { last = { x: e.clientX, y: e.clientY }; return; }
            if (!captured) {
                captured = true;
                viewport.dataset.dragged = 'true';
                try { viewport.setPointerCapture(e.pointerId); } catch (err) {}
            }
            const draw = getLanderDrawnRect();
            const v = state.landerView;
            const dx = e.clientX - last.x;
            const dy = e.clientY - last.y;
            v.x -= dx / draw.width * v.w;
            v.y -= dy / draw.height * v.h;
            clampLanderView();
            applyLanderView();
            last = { x: e.clientX, y: e.clientY };
        }
    }

    function onPointerUp(e) {
        if (!pointers.has(e.pointerId)) return;
        pointers.delete(e.pointerId);
        if (pointers.size < 2) pinchDist = 0;
        try { viewport.releasePointerCapture(e.pointerId); } catch (err) {}
        if (pointers.size === 0) {
            last = null;
            startPos = null;
            captured = false;
            // Nollställ drag-flaggan strax efter så efterföljande klick tillåts
            setTimeout(() => { viewport.dataset.dragged = 'false'; }, 0);
        }
    }

    viewport.addEventListener('pointerdown', onPointerDown);
    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', onPointerUp);
    viewport.addEventListener('pointercancel', onPointerUp);
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
    } else if (state.currentGame === 'quiz-7ar-blandat') {
        totalQuestions = CONFIG.quizQuestions;
    } else if (state.currentGame === 'quiz-varldsdelar') {
        totalQuestions = CONFIG.continentQuestions;
    } else if (state.currentGame === 'lander') {
        totalQuestions = state.landerTotal;
    } else if (state.currentGame === 'huvudstader') {
        totalQuestions = state.huvudstaderTotal;
    } else {
        totalQuestions = CONFIG.totalQuestions;
    }
    
    const percentage = Math.round(
        (state.correctFirstTry / totalQuestions) * 100
    );
    
    // Visa resultatskärmen
    showScreen('result');

    // Dölj/visa hamster-animation beroende på resultat
    if (percentage === 100) {
        elements.hamsterCelebration.classList.remove('visible');
        // Liten fördröjning så att animationen triggas korrekt
        requestAnimationFrame(() => {
            elements.hamsterCelebration.classList.add('visible');
        });
    } else {
        elements.hamsterCelebration.classList.remove('visible');
    }

    // Animera procenttalet
    animateNumber(elements.resultPercentage, 0, percentage, 1000);

    // Visa konfetti och spela ljud baserat på resultat
    if (percentage >= 70) {
        setTimeout(() => {
            createConfetti();
            playConfettiSound();
        }, 500);
    } else {
        setTimeout(() => {
            playSound('forsok');
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
function playConfettiSound() {
    if (!state.soundEnabled) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.12);
            osc.stop(ctx.currentTime + i * 0.12 + 0.4);
        });
    } catch (e) {
        console.log('Kunde inte spela konfetti-ljud');
    }
}

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
// Spellogik: Hitta bokstaven
// ========================================
function startHittaBokstavenGame() {
    const cfg = CONFIG.hittaBokstaven;

    // Nollställ tillstånd
    state.hb.phase = 'calibration';
    state.hb.round = 0;
    state.hb.letterIndex = 0;
    state.hb.fallTime = cfg.testFallTime;
    state.hb.baselineReaction = 0;
    state.hb.calibrationTimes = [];
    state.hb.targetLetter = '';
    state.hb.lastLetter = '';
    state.hb.roundCorrect = 0;
    state.hb.totalCorrect = 0;
    state.hb.fastestFallTime = Infinity;
    state.hb.isProcessing = false;
    state.hb.isComposing = false;

    cancelAnimationFrame(state.hb.rafId);

    // Återställ UI
    elements.hbEnd.hidden = true;
    elements.hbBox.classList.remove('correct', 'wrong', 'hidden');
    elements.hbBox.style.transform = 'translateY(0)';
    elements.hbCleared.textContent = '0';
    elements.hbRound.textContent = 'Test';
    elements.hbSpeed.textContent = '–';

    // Bind input-lyssnare en gång
    bindHittaBokstavenListeners();

    // Visa skärm och öppna tangentbordet (sker inom klick-gesten)
    showScreen('hittaBokstaven');
    focusHbInput();

    runTestRound();
}

function bindHittaBokstavenListeners() {
    if (state.hb.listenersBound) return;
    state.hb.listenersBound = true;

    elements.hbInput.addEventListener('input', (e) => {
        if (state.hb.isComposing || e.isComposing) return;
        const value = elements.hbInput.value;
        elements.hbInput.value = '';
        if (!value) return; // tom (t.ex. radering)
        const char = value.slice(-1);
        handleHittaBokstavenKey(char);
    });

    elements.hbInput.addEventListener('compositionstart', () => {
        state.hb.isComposing = true;
    });

    elements.hbInput.addEventListener('compositionend', (e) => {
        state.hb.isComposing = false;
        elements.hbInput.value = '';
        const char = (e.data || '').slice(-1);
        if (char) handleHittaBokstavenKey(char);
    });

    // Håll fokus medan spelet är aktivt (tapp i ytan öppnar tangentbordet igen)
    elements.hbArea.addEventListener('pointerdown', () => {
        if (isHbActive()) focusHbInput();
    });

    elements.hbInput.addEventListener('blur', () => {
        if (isHbActive()) {
            // Återta fokus på nästa tick så att tangentbordet inte stängs
            setTimeout(() => {
                if (isHbActive()) focusHbInput();
            }, 50);
        }
    });
}

function isHbActive() {
    return state.currentScreen === 'hittaBokstaven' &&
        (state.hb.phase === 'calibration' || state.hb.phase === 'round');
}

function focusHbInput() {
    try {
        elements.hbInput.focus({ preventScroll: true });
    } catch (e) {
        elements.hbInput.focus();
    }
}

function stopHittaBokstaven() {
    cancelAnimationFrame(state.hb.rafId);
    state.hb.phase = 'idle';
    elements.hbInput.blur();
}

function runTestRound() {
    const cfg = CONFIG.hittaBokstaven;
    state.hb.phase = 'calibration';
    state.hb.letterIndex = 0;
    state.hb.fallTime = cfg.testFallTime;

    elements.hbRound.textContent = 'Test';
    elements.hbSpeed.textContent = '–';
    elements.hbCleared.textContent = '0';

    showHbBanner('TESTRUNDA', 'Tryck på bokstaven innan den når marken');

    setTimeout(() => {
        hideHbBanner();
        spawnLetter();
    }, cfg.roundBannerDelay);
}

function spawnLetter() {
    const cfg = CONFIG.hittaBokstaven;

    // Klar med aktuell fas?
    if (state.hb.phase === 'calibration' && state.hb.letterIndex >= cfg.testLetters) {
        finishCalibration();
        return;
    }
    if (state.hb.phase === 'round' && state.hb.letterIndex >= cfg.lettersPerRound) {
        endRound();
        return;
    }

    // Slumpa bokstav (undvik direkt upprepning)
    let available = CONFIG.alphabet.filter(l => l !== state.hb.lastLetter);
    const letter = available[Math.floor(Math.random() * available.length)];
    state.hb.targetLetter = letter;
    state.hb.lastLetter = letter;

    // Förbered box
    const box = elements.hbBox;
    box.classList.remove('correct', 'wrong', 'hidden');
    box.textContent = letter;
    box.style.transform = 'translateY(0)';
    // Trigga reflow så att en eventuell pop-animation startar om
    box.offsetHeight;

    // Mät fallsträcka (marklinjen ligger längst ner i ytan)
    const areaHeight = elements.hbArea.clientHeight;
    const boxHeight = box.offsetHeight;
    const groundOffset = 6; // höjd på marklinjen
    state.hb.travel = Math.max(0, areaHeight - boxHeight - groundOffset);

    state.hb.isProcessing = false;
    state.hb.spawnTime = performance.now();

    elements.hbInput.value = '';
    if (isHbActive()) focusHbInput();

    cancelAnimationFrame(state.hb.rafId);
    state.hb.rafId = requestAnimationFrame(fallLoop);
}

function fallLoop(now) {
    const progress = (now - state.hb.spawnTime) / state.hb.fallTime;

    if (progress >= 1) {
        elements.hbBox.style.transform = `translateY(${state.hb.travel}px)`;
        onLetterMissed('ground');
        return;
    }

    elements.hbBox.style.transform = `translateY(${progress * state.hb.travel}px)`;
    state.hb.rafId = requestAnimationFrame(fallLoop);
}

function handleHittaBokstavenKey(char) {
    if (state.hb.isProcessing) return;
    if (state.hb.phase !== 'calibration' && state.hb.phase !== 'round') return;
    if (!state.hb.targetLetter) return;

    const typed = char.toUpperCase();
    if (typed === state.hb.targetLetter) {
        const reaction = performance.now() - state.hb.spawnTime;
        onLetterCleared(reaction);
    } else {
        onLetterMissed('wrong');
    }
}

function onLetterCleared(reaction) {
    const cfg = CONFIG.hittaBokstaven;
    state.hb.isProcessing = true;
    cancelAnimationFrame(state.hb.rafId);

    elements.hbBox.classList.add('correct');
    playSound('correct');

    if (state.hb.phase === 'calibration') {
        state.hb.calibrationTimes.push(reaction);
    } else {
        state.hb.roundCorrect++;
        state.hb.totalCorrect++;
        elements.hbCleared.textContent = String(state.hb.roundCorrect);
    }

    state.hb.letterIndex++;
    setTimeout(spawnLetter, cfg.spawnDelay);
}

function onLetterMissed(reason) {
    const cfg = CONFIG.hittaBokstaven;
    state.hb.isProcessing = true;
    cancelAnimationFrame(state.hb.rafId);

    elements.hbBox.classList.add('wrong');
    playSound('wrong');

    if (state.hb.phase === 'calibration') {
        // Missad testbokstav ger en långsam baslinje istället för att utebli
        state.hb.calibrationTimes.push(cfg.testFallTime);
    }
    // I poängrundor: ingen ökning av roundCorrect (räknas som miss)

    state.hb.letterIndex++;
    setTimeout(() => {
        elements.hbBox.classList.add('hidden');
        spawnLetter();
    }, cfg.spawnDelay);
}

function finishCalibration() {
    const cfg = CONFIG.hittaBokstaven;

    // Hoppa över första bokstaven, snitta resten
    const times = state.hb.calibrationTimes.slice(1);
    let avg;
    if (times.length > 0) {
        avg = times.reduce((sum, t) => sum + t, 0) / times.length;
    } else {
        avg = 1200; // fallback om inga tider finns
    }
    state.hb.baselineReaction = avg;
    state.hb.fallTime = clampFallTime(avg * cfg.baselineMultiplier);
    state.hb.fastestFallTime = Math.min(state.hb.fastestFallTime, state.hb.fallTime);

    // Starta runda 1
    state.hb.phase = 'round';
    state.hb.round = 1;
    state.hb.roundCorrect = 0;
    state.hb.letterIndex = 0;

    elements.hbRound.textContent = `${state.hb.round} / ${cfg.rounds}`;
    elements.hbCleared.textContent = '0';
    updateSpeedDisplay();

    showHbBanner(`OMGÅNG ${state.hb.round}`, `Hastighet ${speedLevelFromFallTime(state.hb.fallTime)}`);
    setTimeout(() => {
        hideHbBanner();
        spawnLetter();
    }, cfg.roundBannerDelay);
}

function endRound() {
    const cfg = CONFIG.hittaBokstaven;

    // Adaptiv justering: minst 3 av 5 -> snabbare, annars långsammare
    if (state.hb.roundCorrect >= cfg.passThreshold) {
        state.hb.fallTime = clampFallTime(state.hb.fallTime * (1 - cfg.speedStepUp));
    } else {
        state.hb.fallTime = clampFallTime(state.hb.fallTime * (1 + cfg.speedStepDown));
    }
    state.hb.fastestFallTime = Math.min(state.hb.fastestFallTime, state.hb.fallTime);

    state.hb.round++;
    if (state.hb.round > cfg.rounds) {
        showHittaBokstavenEnd();
        return;
    }

    state.hb.roundCorrect = 0;
    state.hb.letterIndex = 0;

    elements.hbRound.textContent = `${state.hb.round} / ${cfg.rounds}`;
    elements.hbCleared.textContent = '0';
    updateSpeedDisplay();

    showHbBanner(`OMGÅNG ${state.hb.round}`, `Hastighet ${speedLevelFromFallTime(state.hb.fallTime)}`);
    setTimeout(() => {
        hideHbBanner();
        spawnLetter();
    }, cfg.roundBannerDelay);
}

function showHittaBokstavenEnd() {
    const cfg = CONFIG.hittaBokstaven;
    state.hb.phase = 'ended';
    cancelAnimationFrame(state.hb.rafId);
    elements.hbInput.blur();

    elements.hbBox.classList.add('hidden');
    elements.hbEndSpeed.textContent = speedLevelFromFallTime(state.hb.fastestFallTime);
    elements.hbEndCorrect.textContent = String(state.hb.totalCorrect);
    elements.hbEnd.hidden = false;

    if (state.hb.totalCorrect >= cfg.rounds * cfg.lettersPerRound * 0.7) {
        createConfetti();
        playConfettiSound();
    }
}

function clampFallTime(ms) {
    const cfg = CONFIG.hittaBokstaven;
    return Math.min(cfg.maxFallTime, Math.max(cfg.minFallTime, ms));
}

// Vänligt hastighetstal: snabbare fall -> högre tal (1 decimal)
function speedLevelFromFallTime(ms) {
    if (!isFinite(ms) || ms <= 0) return '0';
    const ratio = (CONFIG.hittaBokstaven.testFallTime / ms) * 10;
    return (Math.round(ratio * 10) / 10).toFixed(1);
}

function updateSpeedDisplay() {
    elements.hbSpeed.textContent = speedLevelFromFallTime(state.hb.fallTime);
}

function showHbBanner(title, sub) {
    elements.hbBannerTitle.textContent = title;
    elements.hbBannerSub.textContent = sub;
    elements.hbBanner.classList.remove('hidden');
}

function hideHbBanner() {
    elements.hbBanner.classList.add('hidden');
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

    // Länder: öppna världsdelsval
    document.querySelectorAll('[data-lander-select]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!btn.disabled) showScreen('landerSelect');
        });
    });

    // Länder: välj världsdel och starta spelet
    document.querySelectorAll('[data-lander-continent]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.disabled) return;
            state.landerContinent = btn.dataset.landerContinent;
            startGame('lander');
        });
    });

    // Huvudstäder: öppna världsdelsval (kryssrutor)
    document.querySelectorAll('[data-huvudstader-select]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!btn.disabled) showScreen('huvudstaderSelect');
        });
    });

    // Huvudstäder: bygg kryssrutorna och koppla start-knappen
    setupHuvudstaderSelect();
    if (elements.huvudstaderStartBtn) {
        elements.huvudstaderStartBtn.addEventListener('click', () => {
            if (!elements.huvudstaderStartBtn.disabled) startGame('huvudstader');
        });
    }
    
    // Spela igen
    elements.playAgainBtn.addEventListener('click', () => {
        startGame(state.currentGame);
    });
    
    // Tillbaka till hem
    elements.goHomeBtn.addEventListener('click', () => {
        showScreen('home');
    });

    // Hitta bokstaven - slutknappar
    if (elements.hbPlayAgain) {
        elements.hbPlayAgain.addEventListener('click', () => {
            elements.hbEnd.hidden = true;
            startHittaBokstavenGame();
        });
    }
    if (elements.hbGoHome) {
        elements.hbGoHome.addEventListener('click', () => {
            stopHittaBokstaven();
            elements.hbEnd.hidden = true;
            showScreen('home');
        });
    }

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

    // Slå ihop delar som inte är egna länder (Nordcypern → Cypern)
    mergeCountries();

    // Bryt ut avlägsna landdelar (Svalbard, Franska Guyana) så de inte stör världsdelarna
    splitOutlierTerritories();

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

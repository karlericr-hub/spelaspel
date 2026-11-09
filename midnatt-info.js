"use strict";

/* Midnatt: informationsruta på startsidan.
   Steg 1 berättar om spelet, steg 2 är en vuxenspärr (ett mattetal som
   8–9-åringar inte klarar) och steg 3 visar förberedelserna.
   OBS: Ändras koderna i midnatt/midnatt.js behöver förberedelserna i
   index.html (#midnatt-info) uppdateras också. */
(function () {
    const overlay = document.getElementById('midnatt-info');
    const link = document.querySelector('.midnatt-link');
    if (!overlay || !link) return;

    const steps = overlay.querySelectorAll('.mn-step');
    const form = overlay.querySelector('.mn-math');
    const questionEl = document.getElementById('mn-question');
    const answerEl = document.getElementById('mn-answer');
    const feedbackEl = document.getElementById('mn-feedback');
    const closeBtn = overlay.querySelector('.mn-close');
    let correctAnswer = null;
    let unlocked = false;
    let lastFocus = null;

    function rand(min, max) {
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    // Tal som kräver vuxen huvudräkning: tvåsiffrig multiplikation eller procent.
    function newProblem() {
        if (Math.random() < 0.5) {
            const a = rand(13, 19);
            const b = rand(12, 19);
            questionEl.textContent = `Vad är ${a} × ${b}?`;
            correctAnswer = a * b;
        } else {
            const pct = [15, 25, 75][rand(0, 2)];
            const base = pct === 15 ? rand(3, 12) * 20 : rand(5, 20) * 12;
            questionEl.textContent = `Vad är ${pct} % av ${base}?`;
            correctAnswer = base * pct / 100;
        }
        answerEl.value = '';
    }

    function showStep(name) {
        if (name === 'math' && unlocked) name = 'prep';
        steps.forEach(s => { s.hidden = s.dataset.step !== name; });
        overlay.querySelector('.mn-modal').scrollTop = 0;
        if (name === 'math') {
            newProblem();
            feedbackEl.textContent = '';
            feedbackEl.className = 'mn-feedback';
            answerEl.focus();
        } else {
            const first = overlay.querySelector(`.mn-step[data-step="${name}"] .mn-btn`);
            if (first) first.focus();
        }
    }

    function open() {
        lastFocus = document.activeElement;
        overlay.hidden = false;
        document.body.classList.add('mn-open');
        showStep('info');
    }

    function close() {
        overlay.hidden = true;
        document.body.classList.remove('mn-open');
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    link.addEventListener('click', (e) => {
        e.preventDefault();
        open();
    });

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !overlay.hidden) close();
    });

    overlay.querySelectorAll('[data-goto]').forEach(btn => {
        btn.addEventListener('click', () => showStep(btn.dataset.goto));
    });

    answerEl.addEventListener('input', () => {
        answerEl.value = answerEl.value.replace(/[^0-9]/g, '').slice(0, 5);
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!answerEl.value) return;
        if (Number(answerEl.value) === correctAnswer) {
            unlocked = true;
            showStep('prep');
        } else {
            feedbackEl.textContent = 'Fel svar. Här kommer ett nytt tal.';
            feedbackEl.className = 'mn-feedback mn-err';
            form.classList.remove('mn-shake');
            void form.offsetWidth;
            form.classList.add('mn-shake');
            newProblem();
            answerEl.focus();
        }
    });
})();

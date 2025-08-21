document.addEventListener('DOMContentLoaded', () => {
    
    // =================================
    //  GLOBAL SCRIPTS (Run on every page)
    // =================================
    
    // --- Reusable Footer Loader ---
    fetch("footer.html")
        .then(response => response.text())
        .then(data => {
            const placeholder = document.getElementById("footer-placeholder");
            if (placeholder) placeholder.innerHTML = data;
        });

    // --- Reusable Navigation Bar Logic ---
    const nav = document.querySelector('nav');
    if (nav) {
        let lastScrollTop = 0;
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) { nav.classList.add('scrolled'); } 
            else { nav.classList.remove('scrolled'); }
            
            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > lastScrollTop) { nav.classList.add('nav-up'); } 
            else { nav.classList.remove('nav-up'); }
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        });
    }

    // --- Intersection Observer for Animations ---
    const animatedElements = document.querySelectorAll('.topic-section');
    if (animatedElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        animatedElements.forEach(el => observer.observe(el));
    }

    // --- Reusable Quiz Logic ---
    function setupQuiz(quizId, correctAnswers) {
        const quizForm = document.getElementById(quizId);
        if (!quizForm) return;

        const button = quizForm.querySelector('.cta-button');
        const resultsDiv = quizForm.nextElementSibling; // CORRECTED SELECTOR

        button.addEventListener('click', function() {
            let score = 0;
            const totalQuestions = Object.keys(correctAnswers).length;
            for (const question in correctAnswers) {
                if (quizForm.elements[question] && quizForm.elements[question].value === correctAnswers[question]) {
                    score++;
                }
            }
            resultsDiv.innerHTML = `You scored ${score} out of ${totalQuestions}!`;
            resultsDiv.style.display = 'block';
            resultsDiv.className = 'quiz-results ' + ((score === totalQuestions) ? 'correct' : 'incorrect');
        });
    }

    // --- Quiz Initializations ---
    setupQuiz('genetics-quiz', { q1: 'actn3', q2: 'allele', q3: 'endurance' });
    setupQuiz('motor-quiz', { q1: 'brain', q2: 'cerebellum', q3: 'myelination' });
    // Add other quiz initializations here
});
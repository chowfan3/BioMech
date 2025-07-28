// --- Reusable Navigation Bar Logic ---
const nav = document.querySelector('nav');
let lastScrollTop = 0;

function handleNavBackground() {
  if (window.scrollY > 50) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
}

function handleNavVisibility() {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > lastScrollTop) {
        nav.classList.add('nav-up');
    } else {
        nav.classList.remove('nav-up');
    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; 
}

window.addEventListener('scroll', () => {
    handleNavBackground();
    handleNavVisibility();
});

// --- Reusable Quiz Logic ---
function setupQuiz(quizId, correctAnswers) {
  const quizForm = document.getElementById(quizId);
  if (!quizForm) return;

  const resultsDiv = quizForm.nextElementSibling;

  quizForm.addEventListener('submit', function(event) {
    event.preventDefault();
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

// --- Reusable Interactive Diagram Logic ---
function setupInteractiveDiagram(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return; 

  const buttons = container.querySelectorAll('.control-btn');
  const panels = container.querySelectorAll('.content-panel');

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.target;
      const targetPanel = document.getElementById(targetId);

      buttons.forEach(btn => btn.classList.remove('active'));
      panels.forEach(panel => panel.classList.remove('active'));

      button.classList.add('active');
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}

// --- Initialize All Scripts on Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    // Setup for Genetics Page Quiz
    setupQuiz('genetics-quiz', { q1: 'actn3', q2: 'allele', q3: 'endurance' });

    // Setup for Muscles Page Quiz
    setupQuiz('muscles-quiz', { q1: 'actin-myosin', q2: 'sarcomere', q3: 'atp' });
    
    // Setup for Energy Systems Page Quiz
    setupQuiz('energy-quiz', { q1: 'phosphagen', q2: 'glycolytic', q3: 'oxidative' });

    // Setup for Energy Systems Diagram
    setupInteractiveDiagram('.interactive-diagram');
});
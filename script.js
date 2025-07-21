// MBTI Test Application
class MBTITest {
    constructor() {
        this.questions = [];
        this.personalities = {};
        this.currentQuestion = 0;
        this.answers = [];
        this.progress = null;
        
        this.init();
    }

    async init() {
        await this.loadData();
        this.bindEvents();
        this.checkProgress();
    }

    async loadData() {
        try {
            // Load questions
            const questionsResponse = await fetch('data/questions.json');
            this.questions = await questionsResponse.json();
            
            // Load personality data
            const personalitiesResponse = await fetch('data/personalities.json');
            this.personalities = await personalitiesResponse.json();
        } catch (error) {
            console.error('Error loading data:', error);
            alert('데이터를 불러오는 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
        }
    }

    bindEvents() {
        // Welcome screen events
        document.getElementById('start-test')?.addEventListener('click', () => {
            this.startTest();
        });

        document.getElementById('continue-test')?.addEventListener('click', () => {
            this.continueTest();
        });

        document.getElementById('restart-test')?.addEventListener('click', () => {
            this.restartTest();
        });

        // Test navigation events
        document.getElementById('prev-btn')?.addEventListener('click', () => {
            this.previousQuestion();
        });

        document.getElementById('next-btn')?.addEventListener('click', () => {
            this.nextQuestion();
        });

        // Option selection events
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectOption(e.target.closest('.option-btn'));
            });
        });

        // Home button events
        document.querySelectorAll('#home-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.goHome();
            });
        });
    }

    checkProgress() {
        this.progress = JSON.parse(localStorage.getItem('mbti_progress'));
        if (this.progress) {
            document.getElementById('continue-section').style.display = 'block';
        }
    }

    startTest() {
        this.currentQuestion = 0;
        this.answers = [];
        this.saveProgress();
        this.showScreen('test-screen');
        this.displayQuestion();
    }

    continueTest() {
        if (this.progress) {
            this.currentQuestion = this.progress.currentQuestion;
            this.answers = this.progress.answers;
            this.showScreen('test-screen');
            this.displayQuestion();
        }
    }

    restartTest() {
        localStorage.removeItem('mbti_progress');
        this.startTest();
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    displayQuestion() {
        if (this.currentQuestion >= this.questions.length) {
            this.calculateResult();
            return;
        }

        const question = this.questions[this.currentQuestion];
        document.getElementById('question-text').textContent = question.text;
        
        // Update progress
        const progress = ((this.currentQuestion + 1) / this.questions.length) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
        document.getElementById('progress-text').textContent = `${this.currentQuestion + 1} / ${this.questions.length}`;

        // Clear previous selections and remove focus
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('selected');
            btn.blur(); // Remove focus from buttons
        });

        // Show previous answer if exists
        if (this.answers[this.currentQuestion]) {
            const selectedBtn = document.querySelector(`[data-value="${this.answers[this.currentQuestion]}"]`);
            if (selectedBtn) {
                selectedBtn.classList.add('selected');
            }
        }

        // Update navigation buttons
        document.getElementById('prev-btn').disabled = this.currentQuestion === 0;
        document.getElementById('next-btn').disabled = !this.answers[this.currentQuestion];

        this.saveProgress();
    }

    selectOption(button) {
        // Clear previous selections
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        // Select current option
        button.classList.add('selected');

        // Save answer
        const value = button.getAttribute('data-value');
        this.answers[this.currentQuestion] = value;

        // Enable next button
        document.getElementById('next-btn').disabled = false;

        this.saveProgress();

        // Auto advance to next question after a short delay
        setTimeout(() => {
            this.nextQuestion();
        }, 300);
    }

    previousQuestion() {
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            this.displayQuestion();
        }
    }

    nextQuestion() {
        if (this.currentQuestion < this.questions.length - 1) {
            this.currentQuestion++;
            this.displayQuestion();
        } else {
            this.calculateResult();
        }
    }

    saveProgress() {
        const progress = {
            currentQuestion: this.currentQuestion,
            answers: this.answers,
            timestamp: Date.now()
        };
        localStorage.setItem('mbti_progress', JSON.stringify(progress));
    }

    calculateResult() {
        this.showScreen('loading-screen');

        setTimeout(() => {
            const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

            // Calculate scores based on answers with weights and reverse questions
            this.answers.forEach((answer, index) => {
                const question = this.questions[index];
                let answerWeight = this.getAnswerWeight(answer);
                const questionWeight = this.getQuestionWeight(question);
                const isReverse = this.isReverseQuestion(question);
                
                // Apply reverse scoring if needed
                if (isReverse) {
                    answerWeight = 6 - answerWeight;
                }
                
                // Apply question weight
                const finalScore = answerWeight * questionWeight;
                const oppositeScore = (6 - answerWeight) * questionWeight;
                
                if (question.dimension === 'EI') {
                    if (question.trait === 'E') {
                        scores.E += finalScore;
                        scores.I += oppositeScore;
                    } else {
                        scores.I += finalScore;
                        scores.E += oppositeScore;
                    }
                } else if (question.dimension === 'SN') {
                    if (question.trait === 'S') {
                        scores.S += finalScore;
                        scores.N += oppositeScore;
                    } else {
                        scores.N += finalScore;
                        scores.S += oppositeScore;
                    }
                } else if (question.dimension === 'TF') {
                    if (question.trait === 'T') {
                        scores.T += finalScore;
                        scores.F += oppositeScore;
                    } else {
                        scores.F += finalScore;
                        scores.T += oppositeScore;
                    }
                } else if (question.dimension === 'JP') {
                    if (question.trait === 'J') {
                        scores.J += finalScore;
                        scores.P += oppositeScore;
                    } else {
                        scores.P += finalScore;
                        scores.J += oppositeScore;
                    }
                }
            });

            // Determine MBTI type
            const type = (scores.E > scores.I ? 'E' : 'I') +
                        (scores.S > scores.N ? 'S' : 'N') +
                        (scores.T > scores.F ? 'T' : 'F') +
                        (scores.J > scores.P ? 'J' : 'P');

            // Calculate percentages
            const totalEI = scores.E + scores.I;
            const totalSN = scores.S + scores.N;
            const totalTF = scores.T + scores.F;
            const totalJP = scores.J + scores.P;

            const dimensions = {
                [scores.E > scores.I ? 'E' : 'I']: Math.round((Math.max(scores.E, scores.I) / totalEI) * 100),
                [scores.S > scores.N ? 'S' : 'N']: Math.round((Math.max(scores.S, scores.N) / totalSN) * 100),
                [scores.T > scores.F ? 'T' : 'F']: Math.round((Math.max(scores.T, scores.F) / totalTF) * 100),
                [scores.J > scores.P ? 'J' : 'P']: Math.round((Math.max(scores.J, scores.P) / totalJP) * 100)
            };

            const personality = this.personalities[type];
            const result = {
                type: type,
                title: personality.title,
                summary: personality.summary,
                description: personality.description,
                strengths: personality.strengths,
                weaknesses: personality.weaknesses,
                careers: personality.careers,
                compatibility: personality.compatibility,
                dimensions: dimensions,
                timestamp: Date.now()
            };

            // Save result and redirect
            localStorage.setItem('mbti_result', JSON.stringify(result));
            localStorage.removeItem('mbti_progress');
            
            window.location.href = 'result.html';
        }, 3000);
    }

    getAnswerWeight(answer) {
        const weights = {
            'disagree': 1,
            'neutral': 3,
            'agree': 5
        };
        return weights[answer] || 3;
    }

    getQuestionWeight(question) {
        return question.weight || 1;
    }

    isReverseQuestion(question) {
        return question.reverse || false;
    }

    goHome() {
        if (confirm('현재 진행 상황이 저장됩니다. 홈으로 이동하시겠습니까?')) {
            this.showScreen('welcome-screen');
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize test on main page
    if (document.getElementById('welcome-screen')) {
        new MBTITest();
    }
});

// Utility functions for result page
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Export for use in result page
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MBTITest;
}

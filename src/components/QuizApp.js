import React, { useState, useEffect } from 'react';
import { Timer, Circle, CircleDot } from 'lucide-react';
import quizData from '../quiz.json';

const API_URL = process.env.NODE_ENV === 'production'
    ? 'https://quiz-app-backend-sable.vercel.app/api'
    : 'http://localhost:3000/api';

const QuizApp = () => {
  const [screen, setScreen] = useState('start');
  const [userName, setUserName] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(20);
  const [timerProgress, setTimerProgress] = useState(100);
  const [isAnswered, setIsAnswered] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState(null);

  // Fetch leaderboard on mount and when updated
  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Timer effect
  useEffect(() => {
    if (screen === 'question' && timeLeft > 0 && !isAnswered) {
      const countdownTimer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      const startTime = Date.now();
      const duration = timeLeft * 1000;
      
      const progressTimer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, duration - elapsed);
        const progress = (remaining / (20 * 1000)) * 100;
        setTimerProgress(progress);
      }, 16);

      return () => {
        clearInterval(countdownTimer);
        clearInterval(progressTimer);
      };
    }

    if (timeLeft === 0 && !isAnswered) {
      handleAnswer();
    }
  }, [timeLeft, screen, isAnswered]);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${API_URL}/leaderboard`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      const data = await response.json();
      setLeaderboard(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
    }
  };

  const handleStart = () => {
    if (userName.trim()) {
      setScreen('question');
      setTimeLeft(20);
    }
  };

  const handleAnswer = () => {
    const currentQ = quizData.questions[currentQuestion];
    const isCorrect = selectedAnswer === currentQ.correctAnswer;
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setIsAnswered(true);
  };

  const handleNext = async () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer('');
      setIsAnswered(false);
      setTimeLeft(20);
      setTimerProgress(100);
    } else {
      try {
        const response = await fetch(`${API_URL}/score`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: userName,
            score: score
          })
        });

        if (!response.ok) {
          throw new Error('Failed to save score');
        }

        await fetchLeaderboard();
        setScreen('completed');
        setError(null);
      } catch (err) {
        console.error('Error saving score:', err);
        setError('Failed to save score');
      }
    }
  };

  // Start Screen
  if (screen === 'start') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg">
          <div className="p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Christmas Quiz</h2>
              <span className="text-xl text-white">Welcome</span>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Welcome to the 10 Squared Mince Pie Quiz 2024
              </h3>
            </div>
            <img
              src="/images/welcome.jpg"
              alt="Welcome"
              className="w-full rounded-lg mb-6"
            />
            <div className="mb-6">
              <p className="text-lg text-white mb-4">Quiz Rules:</p>
              <ul className="space-y-3">
                {[
                  'You have 20 seconds to answer each question',
                  'Each correct answer is worth 1 point',
                  'You can only select one answer per question',
                  'Your score will be added to the leaderboard'
                ].map((rule, index) => (
                  <li key={index} className="flex items-center text-lg text-white">
                    <Circle className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter your first name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white border-gray-600"
              />
              <div className="flex justify-center">
                <button
                  onClick={handleStart}
                  disabled={!userName.trim()}
                  className={`px-8 py-2 rounded-full text-xl font-semibold transition-colors
                    ${!userName.trim() 
                      ? 'bg-green-500/50 text-white cursor-not-allowed' 
                      : 'bg-green-500 hover:bg-green-600 text-white cursor-pointer'
                    }`}
                >
                  Start Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Question Screen
  if (screen === 'question') {
    const currentQ = quizData.questions[currentQuestion];
    
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg">
          <div className="p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Christmas Quiz</h2>
              <span className="text-xl text-white">{userName}</span>
            </div>
            
            <div className="flex justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex-1 mr-4">{currentQ.question}</h3>
              <span className="text-xl text-white whitespace-nowrap">
                {currentQuestion + 1}/{quizData.questions.length}
              </span>
            </div>

            {currentQ.image && (
              <img
                src={`/images/${currentQ.image}`}
                alt="Question"
                className="w-full rounded-lg mb-6"
              />
            )}

            <div className="mb-6 w-full">
              <div className="flex items-center mb-2">
                <Timer className="text-green-500 w-6 h-6 mr-1" />
                <span className="text-green-500 text-xl font-medium mr-4">{timeLeft}</span>
                <div className="flex-1 relative h-2 bg-gray-700 rounded">
                  <div
                    className="absolute inset-y-0 left-0 bg-green-500 rounded transition-all ease-linear duration-100"
                    style={{ width: `${timerProgress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {currentQ.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !isAnswered && setSelectedAnswer(option)}
                  className={`w-full p-4 rounded text-left text-lg ${
                    selectedAnswer === option
                      ? 'bg-green-800 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                  disabled={isAnswered}
                >
                  <div className="flex items-center">
                    {selectedAnswer === option ? (
                      <CircleDot className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" strokeWidth={2.5} fill="currentColor" />
                    ) : (
                      <Circle className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />
                    )}
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </div>

            {!isAnswered ? (
              <div className="flex justify-center">
                <button
                  onClick={handleAnswer}
                  disabled={!selectedAnswer}
                  className={`px-8 py-2 rounded-full text-xl font-semibold transition-colors
                    ${!selectedAnswer 
                      ? 'bg-green-500/50 text-white cursor-not-allowed' 
                      : 'bg-green-500 hover:bg-green-600 text-white cursor-pointer'
                    }`}
                >
                  Submit
                </button>
              </div>
            ) : (
              <div>
                <div className="text-center text-lg text-white mb-4">
                  {selectedAnswer === currentQ.correctAnswer
                    ? "Well done, that's correct!"
                    : "Unlucky, that was incorrect"}
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={handleNext}
                    className="px-8 py-2 rounded-full text-xl font-semibold bg-green-500 hover:bg-green-600 text-white cursor-pointer transition-colors"
                  >
                    Next Question
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Completed Screen
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 relative">
      <div className="relative z-10">
        <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg">
          <div className="p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Christmas Quiz</h2>
              <span className="text-xl text-white">{userName}</span>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-4">Quiz Complete!</h3>
              {error && (
                <div className="text-red-500 mb-4">
                  {error}
                </div>
              )}
              <div className="bg-green-600 text-white p-6 rounded-lg shadow-lg mb-4">
                <h4 className="text-2xl font-bold mb-2">Thanks {userName}!</h4>
                <p className="text-lg">for playing the 10Squared Mince Pie Quiz</p>
                <p className="text-xl font-semibold mt-4">Well done, your score is {score} points</p>
              </div>
            </div>
            <img
              src="/images/complete.jpg"
              alt="Complete"
              className="w-full rounded-lg mb-6"
            />
            <h2 className="text-xl font-bold text-white mb-6">Leaderboard</h2>
            <div className="space-y-4">
              {leaderboard.map((entry, index) => (
                <div
                  key={index}
                  className="flex justify-between p-4 bg-gray-700 rounded items-center"
                >
                  <div className="flex items-center">
                    <Circle className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />
                    <span className="text-lg text-white">{entry.name}</span>
                  </div>
                  <span className="text-lg text-white">{entry.score} points</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizApp;
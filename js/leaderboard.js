let leaderboardData = JSON.parse(localStorage.getItem('leaderboard')) || [
  { name: 'Tony', score: 0, avatar: 'assets/images/avatar_tony.png' },
  { name: 'Mina', score: 0, avatar: 'assets/images/avatar_mina.png' },
  { name: 'Sorato', score: 0, avatar: 'assets/images/avatar_sorato.png' },
  { name: 'Kaito', score: 0, avatar: 'assets/images/avatar_kaito.png' },
  { name: 'Maria', score: 0, avatar: 'assets/images/avatar_maria.png' }
];

function updateLeaderboard(currentScore) {
  const username = document.getElementById('username').value;
  const userEntry = leaderboardData.find(entry => entry.name === username);
  if (userEntry && currentScore > userEntry.score) {
    userEntry.score = currentScore;
    localStorage.setItem('leaderboard', JSON.stringify(leaderboardData));
  }
  leaderboardData = leaderboardData.sort((entry, index) => entry.score - index.score).slice(0, 5);
  const leaderboardList = document.getElementById('leaderboardList');
  const endLeaderboard = document.getElementById('endLeaderboard');
  leaderboardList.innerHTML = '';
  endLeaderboard.innerHTML = '';
  leaderboardData.forEach(entry => {
    const li = document.createElement('li');
    li.innerHTML = `<img src="${entry.avatar}" alt="${entry.name}"> ${entry.name}: ${entry.score}`;
    if (entry.name === username) {
      li.classList.add('current-user');
    }
    leaderboardList.appendChild(li);
    endLeaderboard.appendChild(li.cloneNode(true)
  });
}

export { updateLeaderboard, leaderboardData };

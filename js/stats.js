(() => {
  const STAT_OPTIONS = [
    { id: 'players', name: 'Players' },
    { id: 'characters', name: 'Characters' }
  ];

  const seqTo3 = ['Any%', 'Any%', 'Captain', 'Captain', 'All Bosses'];
  const seqTo4 = ['Any%', 'Any%', 'Any%', 'Captain', 'Captain', 'All Bosses', 'All Bosses'];

  function q(id) { return document.getElementById(id); }

  function parseScore(scoreStr) {
    if (!scoreStr) return null;
    const parts = scoreStr.split('-').map(s => s.trim());
    if (parts.length !== 2) return null;
    const a = parseInt(parts[0], 10);
    const b = parseInt(parts[1], 10);
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    return { a, b };
  }

  function computeStats(matches) {
    const stats = {
      totalMatches: matches.length,
      matchesByDate: {},
      matchTypeCounts: { to3: 0, to4: 0 },
      scoreDistribution: {},
      players: {},
      charPicks: {},
      charWins: {},
      charByCategory: {},
      charMatrix: {},
      charList: {},
      totalRounds: 0,
      head2head: {},
      matchesRaw: matches
    };

    function ensurePlayer(p) {
      if (!stats.players[p]) stats.players[p] = { matchesPlayed: 0, matchesWon: 0, matchesLost: 0, roundsWon: 0, roundsLost: 0, picks: {} };
      return stats.players[p];
    }

    matches.forEach(m => {
      const scoreObj = parseScore(m.score || '');
      const maxScore = scoreObj ? Math.max(scoreObj.a, scoreObj.b) : 0;
      const type = maxScore >= 4 ? 'to4' : 'to3';
      stats.matchTypeCounts[type]++;

      if (m.date) stats.matchesByDate[m.date] = (stats.matchesByDate[m.date] || 0) + 1;
      if (m.score) stats.scoreDistribution[m.score] = (stats.scoreDistribution[m.score] || 0) + 1;

      const p1 = m.player1 || 'Unknown';
      const p2 = m.player2 || 'Unknown';
      const pl1 = ensurePlayer(p1);
      const pl2 = ensurePlayer(p2);
      pl1.matchesPlayed++; pl2.matchesPlayed++;

      if (scoreObj) {
        if (scoreObj.a > scoreObj.b) { pl1.matchesWon++; pl2.matchesLost++; }
        else if (scoreObj.b > scoreObj.a) { pl2.matchesWon++; pl1.matchesLost++; }
      }

      if (m.rounds && Array.isArray(m.rounds)) {
        const seq = type === 'to4' ? seqTo4 : seqTo3;
        m.rounds.forEach((r, idx) => {
          const category = seq[idx] || 'Any%';
            const c1 = r.player1Char; const c2 = r.player2Char;
            stats.totalRounds += (c1 && c2 && c1 === c2) ? 2 : 1;
          if (c1) { stats.charPicks[c1] = (stats.charPicks[c1] || 0) + 1; pl1.picks[c1] = (pl1.picks[c1] || 0) + 1; stats.charList[c1]=true; }
          if (c2) { stats.charPicks[c2] = (stats.charPicks[c2] || 0) + 1; pl2.picks[c2] = (pl2.picks[c2] || 0) + 1; stats.charList[c2]=true; }

          stats.charByCategory[category] = stats.charByCategory[category] || { picks: {}, wins: {} };
          if (c1) stats.charByCategory[category].picks[c1] = (stats.charByCategory[category].picks[c1] || 0) + 1;
          if (c2) stats.charByCategory[category].picks[c2] = (stats.charByCategory[category].picks[c2] || 0) + 1;

          stats.charMatrix[category] = stats.charMatrix[category] || {};
          stats.charMatrix['All'] = stats.charMatrix['All'] || {};

          function recordPair(matrix, x, y, winnerSide) {
            if (!x || !y) return;
            const a = x < y ? x : y;
            const b = x < y ? y : x;
            const key = a + '||' + b;
            if (!matrix[key]) matrix[key] = { a, b, count: 0, winsA: 0, winsB: 0 };
            if (x === y) matrix[key].count += 2; else matrix[key].count++;
            if (winnerSide === 'player1') {
              if (x === a) matrix[key].winsA++; else matrix[key].winsB++;
            } else if (winnerSide === 'player2') {
              if (y === a) matrix[key].winsA++; else matrix[key].winsB++;
            }
          }

          recordPair(stats.charMatrix[category], c1, c2, r.winner);
          recordPair(stats.charMatrix['All'], c1, c2, r.winner);

          const winner = r.winner;
          if (winner === 'player1') {
            pl1.roundsWon++; pl2.roundsLost++;
            if (c1) { stats.charWins[c1] = (stats.charWins[c1] || 0) + 1; stats.charByCategory[category].wins[c1] = (stats.charByCategory[category].wins[c1] || 0) + 1; }
          } else if (winner === 'player2') {
            pl2.roundsWon++; pl1.roundsLost++;
            if (c2) { stats.charWins[c2] = (stats.charWins[c2] || 0) + 1; stats.charByCategory[category].wins[c2] = (stats.charByCategory[category].wins[c2] || 0) + 1; }
          }
        });
      }

      const key = [p1, p2].sort().join('||');
      stats.head2head[key] = stats.head2head[key] || { players: [p1, p2], matches: 0, wins: {} };
      stats.head2head[key].matches++;
      if (scoreObj) {
        if (scoreObj.a > scoreObj.b) stats.head2head[key].wins[p1] = (stats.head2head[key].wins[p1] || 0) + 1;
        else if (scoreObj.b > scoreObj.a) stats.head2head[key].wins[p2] = (stats.head2head[key].wins[p2] || 0) + 1;
      }
    });

    return stats;
  }

  function makeTable(columns, rows) {
    const table = document.createElement('table');
    table.className = 'statTable';
    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    columns.forEach(c => {
      const th = document.createElement('th');
      th.style.border = '1px solid #bbb';
      th.style.padding = '6px';
      if (c instanceof Node) th.appendChild(c);
      else th.textContent = c;
      trh.appendChild(th);
    });
    thead.appendChild(trh); table.appendChild(thead);
    const tbody = document.createElement('tbody');
    rows.forEach(r => {
      const tr = document.createElement('tr');
      r.forEach(cell => {
        const td = document.createElement('td');
        td.style.border = '1px solid #ddd';
        td.style.padding = '6px';
        if (cell instanceof Node) td.appendChild(cell); else td.textContent = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    return table;
  }


  function renderPlayers(stats, filterPlayer) {
    const rows = Object.entries(stats.players).map(([name, p]) => {
      if (filterPlayer && !name.toLowerCase().includes(filterPlayer.toLowerCase())) return null;
      return [name, p.matchesPlayed, p.matchesWon, p.matchesLost, p.roundsWon, p.roundsLost];
    }).filter(Boolean).sort((a,b)=>b[1]-a[1]);
    return makeTable(['Player','Matches','Match Wins','Match Losses','Round Wins','Round Losses'], rows);
  }

  function renderCharacters(stats, filterPlayer) {
    // render character vs character matchup matrix for selected category
    const categorySelect = q('charCategorySelect');
    const category = categorySelect ? categorySelect.value : 'All';

    // determine character list for this category (or all)
    let chars = [];
    if (category === 'All') {
      chars = Object.keys(stats.charList || {});
    } else {
      chars = Object.keys((stats.charByCategory[category] && stats.charByCategory[category].picks) || {});
    }
    // sort by overall picks desc
    chars.sort((a,b) => (stats.charPicks[b] || 0) - (stats.charPicks[a] || 0));

    // build header
    const blank = document.createElement('div');
    const headerIcons = chars.map(c => {
      const img = document.createElement('img'); img.src = 'characters/' + c; img.alt = c; img.style.width = '32px'; img.style.height = '32px'; img.style.objectFit = 'contain'; img.title = c;
      const w = document.createElement('div'); w.style.display = 'flex'; w.style.justifyContent = 'center'; w.appendChild(img); return w;
    });
    const headerCols = [blank].concat(headerIcons).concat(['Avg WR']);

    const rows = chars.map(r => {
      const row = [];
      // row header (image)
      const imgR = document.createElement('img'); imgR.src = 'characters/' + r; imgR.alt = r; imgR.style.width = '32px'; imgR.style.height = '32px'; imgR.style.objectFit = 'contain'; imgR.title = r;
      const cellHeader = document.createElement('div'); cellHeader.style.display = 'flex'; cellHeader.style.justifyContent = 'center'; cellHeader.appendChild(imgR);
      row.push(cellHeader);

      chars.forEach(c => {
        if (r === c) {
          const keySame = r + '||' + r;
          const entrySame = (stats.charMatrix[category] && stats.charMatrix[category][keySame]) || null;
          if (entrySame) {
            const winsForR = (entrySame.a === r) ? entrySame.winsA : entrySame.winsB;
            const total = entrySame.count || 0;
            const pct = total ? ((winsForR / total) * 100).toFixed(1) + '%' : '-';
            row.push(pct + ' (' + winsForR + '/' + total + ')');
          } else {
            row.push('-');
          }
        } else {
          const a = r < c ? r : c; const b = r < c ? c : r; const key = a + '||' + b;
          const entry = (stats.charMatrix[category] && stats.charMatrix[category][key]) || null;
          if (!entry) { row.push('-'); }
          else {
            const winsForR = (entry.a === r) ? entry.winsA : entry.winsB;
            const total = entry.count || 0;
            const pct = total ? ((winsForR / total) * 100).toFixed(1) + '%' : '-';
            row.push(pct + ' (' + winsForR + '/' + total + ')');
          }
        }
      });

      const totalPicks = stats.charPicks[r] || 0; const totalWins = stats.charWins[r] || 0;
      const avg = totalPicks ? ((totalWins / totalPicks) * 100).toFixed(1) + '%' : '-';
      row.push(avg);
      return row;
    });

    return makeTable(headerCols, rows);
  }

  

  function wireUI(stats) {
    const select = q('statSelect');
    STAT_OPTIONS.forEach(opt => { const o = document.createElement('option'); o.value = opt.id; o.textContent = opt.name; select.appendChild(o); });

    const charCatSelect = q('charCategorySelect');
    const charCatLabel = q('charCategoryLabel');

    function renderSelected() {
      const out = q('statOutput'); out.innerHTML = '';
      const sel = select.value; const playerFilter = q('playerFilter').value.trim();

      // show/hide category selector
      if (sel === 'characters') {
        if (charCatSelect) charCatSelect.style.display = 'inline-block';
        if (charCatLabel) charCatLabel.style.display = 'inline-block';
      } else {
        if (charCatSelect) charCatSelect.style.display = 'none';
        if (charCatLabel) charCatLabel.style.display = 'none';
      }

      let node = document.createElement('div');
      if (sel === 'players') node = renderPlayers(stats, playerFilter);
      else if (sel === 'characters') node = renderCharacters(stats, playerFilter);
      out.appendChild(node);
    }

    select.addEventListener('change', renderSelected);
    if (charCatSelect) charCatSelect.addEventListener('change', renderSelected);
    q('refreshBtn').addEventListener('click', renderSelected);
    q('playerFilter').addEventListener('keyup', e => { if (e.key === 'Enter') renderSelected(); });
    select.value = 'players'; renderSelected();
  }

  fetch('matches.json').then(r => r.json()).then(matches => {
    const stats = computeStats(matches);
    wireUI(stats);
  }).catch(err => { const out = q('statOutput'); if (out) out.textContent = 'Failed to load matches.json: ' + err; });

})();

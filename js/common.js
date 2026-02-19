function computeWinner(match){
  if(match.score){
    const s = match.score.match(/(\d+)\s*-\s*(\d+)/)
    if(s){
      const a = parseInt(s[1],10), b = parseInt(s[2],10)
      if(a>b) return 'player1'
      if(b>a) return 'player2'
      return 'draw'
    }
  }
  if(match.rounds && match.rounds.length){
    let c1=0,c2=0
    match.rounds.forEach(r=>{
      if(r.winner==='player1') c1++
      else if(r.winner==='player2') c2++
    })
    if(c1>c2) return 'player1'
    if(c2>c1) return 'player2'
    return 'draw'
  }
  return null
}

function hasResult(m){
  return m.score || (m.rounds && m.rounds.length)
}

function buildMetaLine(m){
  const metaLine = document.createElement('div')
  metaLine.className = 'match-meta'
  const parts = []
  if(m.matchNumber) parts.push('#' + m.matchNumber)
  if(m.date) parts.push(m.date)
  if(m.time) parts.push(m.time + ' UTC')
  metaLine.textContent = parts.join(' · ')
  return metaLine
}

function buildRoundsDiv(m, flipSides){
  const roundsDiv = document.createElement('div')
  roundsDiv.className = 'rounds'

  ;(m.rounds||[]).forEach((r, idx) => {
    const rEl = document.createElement('div')
    rEl.className = 'round'

    const num = document.createElement('div')
    num.className = 'round-number'
    num.textContent = 'R' + (idx+1)

    const left = document.createElement('div')
    left.className = 'round-player'
    const right = document.createElement('div')
    right.className = 'round-opponent'

    const leftChar = flipSides ? r.player2Char : r.player1Char
    const rightChar = flipSides ? r.player1Char : r.player2Char

    if(leftChar){
      const img = document.createElement('img')
      img.src = 'characters/' + leftChar
      img.alt = leftChar
      left.appendChild(img)
    }
    if(rightChar){
      const img = document.createElement('img')
      img.src = 'characters/' + rightChar
      img.alt = rightChar
      right.appendChild(img)
    }

    const leftBadge = document.createElement('div')
    leftBadge.className = 'side-badge'
    const rightBadge = document.createElement('div')
    rightBadge.className = 'side-badge'

    if(r.winner === 'draw'){
      leftBadge.textContent = 'Draw'
      rightBadge.textContent = 'Draw'
    } else if(r.winner){
      const winnerIsLeft = flipSides ? r.winner === 'player2' : r.winner === 'player1'
      if(winnerIsLeft){
        leftBadge.textContent = 'Winner'
        leftBadge.classList.add('win')
        rightBadge.textContent = 'Loser'
        rightBadge.classList.add('lose')
      } else {
        leftBadge.textContent = 'Loser'
        leftBadge.classList.add('lose')
        rightBadge.textContent = 'Winner'
        rightBadge.classList.add('win')
      }
    }

    rEl.appendChild(num)
    left.insertBefore(leftBadge, left.firstChild)
    rEl.appendChild(left)
    const vsDiv = document.createElement('div')
    vsDiv.className = 'vs'
    vsDiv.textContent = 'vs.'
    rEl.appendChild(vsDiv)
    right.appendChild(rightBadge)
    rEl.appendChild(right)

    if(r.stage || r.note || r.info){
      const details = document.createElement('div')
      details.className = 'round-details'
      if(r.stage){ const s = document.createElement('div'); s.textContent = 'Stage: ' + r.stage; details.appendChild(s) }
      if(r.note){ const n = document.createElement('div'); n.textContent = r.note; details.appendChild(n) }
      if(r.info){ const i = document.createElement('div'); i.textContent = r.info; details.appendChild(i) }
      roundsDiv.appendChild(rEl)
      roundsDiv.appendChild(details)
    } else {
      roundsDiv.appendChild(rEl)
    }
  })

  return roundsDiv
}

function attachRoundsToggle(headerEl, roundsDiv){
  headerEl.addEventListener('click', ()=>{
    roundsDiv.classList.toggle('open')
  })
}

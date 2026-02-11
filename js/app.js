let participants = []
let matches = []

async function loadData(){
  try{
    participants = await fetch('participants.json').then(r=>r.json())
    matches = await fetch('matches.json').then(r=>r.json())
    renderParticipants()
  }catch(e){
    console.error('Failed to load data', e)
  }
}

function renderParticipants(){
  const ul = document.getElementById('participantsList')
  ul.innerHTML = ''
  participants.forEach(p=>{
    const li = document.createElement('li')
    li.textContent = p.name
    li.addEventListener('click', ()=>selectPlayer(p.name))
    ul.appendChild(li)
  })
}

function selectPlayer(name){
  const profile = participants.find(p=>p.name===name)
  const header = document.getElementById('playerHeader')
  if(profile && profile.twitch){
    header.innerHTML = `<a href="${profile.twitch}" target="_blank" rel="noopener noreferrer">${profile.name || name}</a>`
  } else {
    header.textContent = name
  }
  const container = document.getElementById('matchHistory')
  container.innerHTML = ''
  const playerMatches = matches.filter(m=>m.player1===name || m.player2===name)
  if(playerMatches.length===0){ container.textContent = 'No history' ; return }

  playerMatches.forEach(m=>{
    const isPlayer1 = (m.player1 === name)
    const leftName = isPlayer1 ? m.player1 : m.player2
    const rightName = isPlayer1 ? m.player2 : m.player1

    const el = document.createElement('div')
    el.className = 'match'

    const headerEl = document.createElement('div')
    headerEl.className = 'match-header'
    const namesLine = document.createElement('div')
    namesLine.innerHTML = `<strong>${leftName}</strong> vs <strong>${rightName}</strong>`
    const scoreLine = document.createElement('div')
    scoreLine.className = 'score-line'
    scoreLine.textContent = `Score: ${m.score || ''}`
    const dateSpan = document.createElement('span')
    dateSpan.className = 'match-date'
    dateSpan.textContent = m.date || ''
    scoreLine.appendChild(dateSpan)
    headerEl.appendChild(namesLine)
    headerEl.appendChild(scoreLine)
    el.appendChild(headerEl)

    const roundsDiv = document.createElement('div')
    roundsDiv.className = 'rounds'

    function computeMatchWinner(match){
      if(match.score){
        const m = match.score.match(/(\d+)\s*-\s*(\d+)/)
        if(m){
          const a = parseInt(m[1],10), b = parseInt(m[2],10)
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

    const matchWinner = computeMatchWinner(m)

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

      const leftChar = isPlayer1 ? r.player1Char : r.player2Char
      const rightChar = isPlayer1 ? r.player2Char : r.player1Char

      if(leftChar){
        const img1 = document.createElement('img')
        img1.src = 'characters/' + leftChar
        img1.alt = leftChar
        left.appendChild(img1)
      }
      if(rightChar){
        const img2 = document.createElement('img')
        img2.src = 'characters/' + rightChar
        img2.alt = rightChar
        right.appendChild(img2)
      }

      const leftBadge = document.createElement('div')
      leftBadge.className = 'side-badge'
      const rightBadge = document.createElement('div')
      rightBadge.className = 'side-badge'
      if(r.winner === 'draw'){
        leftBadge.textContent = 'Draw'
        rightBadge.textContent = 'Draw'
      } else if(r.winner){
        const winnerIsLeft = (r.winner === 'player1') === isPlayer1
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
        if(r.stage){ const stage = document.createElement('div'); stage.textContent = `Stage: ${r.stage}`; details.appendChild(stage) }
        if(r.note){ const note = document.createElement('div'); note.textContent = r.note; details.appendChild(note) }
        if(r.info){ const info = document.createElement('div'); info.textContent = r.info; details.appendChild(info) }
        roundsDiv.appendChild(rEl)
        roundsDiv.appendChild(details)
      } else {
        roundsDiv.appendChild(rEl)
      }
    })
    el.appendChild(roundsDiv)

    const matchBadge = document.createElement('div')
    matchBadge.className = 'match-badge'
    if(matchWinner === 'draw'){
      matchBadge.textContent = 'Draw'
    } else if(matchWinner){
      const winnerIsSelected = matchWinner === (isPlayer1 ? 'player1' : 'player2')
      matchBadge.textContent = winnerIsSelected ? 'Winner' : 'Loser'
      matchBadge.classList.add(winnerIsSelected ? 'win' : 'lose')
    }
    headerEl.appendChild(matchBadge)

    headerEl.addEventListener('click', ()=>{
      const opening = !roundsDiv.classList.contains('open')
      if(opening){
        roundsDiv.classList.add('open')
      } else {
        roundsDiv.classList.remove('open')
      }
    })

    container.appendChild(el)
  })
}

document.addEventListener('DOMContentLoaded', ()=>{
  loadData()
})

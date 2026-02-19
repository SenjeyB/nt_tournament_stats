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
  if(playerMatches.length===0){ container.textContent = 'No matches'; return }

  playerMatches.forEach(m=>{
    const isPlayer1 = (m.player1 === name)
    const leftName = isPlayer1 ? m.player1 : m.player2
    const rightName = isPlayer1 ? m.player2 : m.player1
    const result = hasResult(m)

    const el = document.createElement('div')
    el.className = 'match'

    const headerEl = document.createElement('div')
    headerEl.className = 'match-header'

    headerEl.appendChild(buildMetaLine(m))

    const namesLine = document.createElement('div')
    namesLine.innerHTML = `<strong>${leftName}</strong> vs <strong>${rightName}</strong>`
    headerEl.appendChild(namesLine)

    if(result){
      const scoreLine = document.createElement('div')
      scoreLine.className = 'score-line'
      scoreLine.textContent = m.score ? 'Score: ' + m.score : ''
      headerEl.appendChild(scoreLine)
    } else {
      const pending = document.createElement('div')
      pending.className = 'match-pending'
      pending.textContent = 'Pending'
      headerEl.appendChild(pending)
    }

    el.appendChild(headerEl)

    const flipSides = !isPlayer1
    const roundsDiv = buildRoundsDiv(m, flipSides)
    el.appendChild(roundsDiv)

    const matchWinner = computeWinner(m)
    if(matchWinner){
      const matchBadge = document.createElement('div')
      matchBadge.className = 'match-badge'
      if(matchWinner === 'draw'){
        matchBadge.textContent = 'Draw'
      } else {
        const winnerIsSelected = matchWinner === (isPlayer1 ? 'player1' : 'player2')
        matchBadge.textContent = winnerIsSelected ? 'Winner' : 'Loser'
        matchBadge.classList.add(winnerIsSelected ? 'win' : 'lose')
      }
      headerEl.appendChild(matchBadge)
    }

    if(result) attachRoundsToggle(headerEl, roundsDiv)

    container.appendChild(el)
  })
}

document.addEventListener('DOMContentLoaded', ()=>{
  loadData()
})

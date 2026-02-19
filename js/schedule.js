async function loadSchedule(){
  try{
    const matches = await fetch('matches.json').then(r=>r.json())
    const sorted = matches.slice().sort((a,b)=>{
      if(a.date !== b.date) return a.date < b.date ? -1 : 1
      if(a.time && b.time) return a.time < b.time ? -1 : 1
      return 0
    })
    renderSchedule(sorted)
  }catch(e){
    document.getElementById('scheduleList').textContent = 'Failed to load schedule'
    console.error(e)
  }
}

function renderSchedule(matches){
  const container = document.getElementById('scheduleList')
  container.innerHTML = ''
  let currentDate = ''

  matches.forEach(m=>{
    if(m.date && m.date !== currentDate){
      currentDate = m.date
      const dateHeader = document.createElement('div')
      dateHeader.className = 'schedule-date-header'
      dateHeader.textContent = currentDate
      container.appendChild(dateHeader)
    }

    const result = hasResult(m)
    const winner = computeWinner(m)

    const el = document.createElement('div')
    el.className = 'match schedule-match'

    const headerEl = document.createElement('div')
    headerEl.className = 'match-header'

    const metaLine = buildMetaLine(m)
    headerEl.appendChild(metaLine)

    const namesLine = document.createElement('div')
    namesLine.className = 'schedule-names'

    const p1span = document.createElement('span')
    p1span.className = 'schedule-player'
    if(winner === 'player1') p1span.classList.add('winner')
    if(winner === 'player2') p1span.classList.add('loser')
    p1span.textContent = m.player1

    const vsSpan = document.createElement('span')
    vsSpan.className = 'schedule-vs'
    vsSpan.textContent = ' vs '

    const p2span = document.createElement('span')
    p2span.className = 'schedule-player'
    if(winner === 'player2') p2span.classList.add('winner')
    if(winner === 'player1') p2span.classList.add('loser')
    p2span.textContent = m.player2

    namesLine.appendChild(p1span)
    namesLine.appendChild(vsSpan)
    namesLine.appendChild(p2span)
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

    const roundsDiv = buildRoundsDiv(m, false)
    el.appendChild(roundsDiv)

    if(winner){
      const matchBadge = document.createElement('div')
      matchBadge.className = 'match-badge'
      if(winner === 'draw'){
        matchBadge.textContent = 'Draw'
      } else {
        matchBadge.textContent = winner === 'player1' ? m.player1 + ' wins' : m.player2 + ' wins'
        matchBadge.classList.add('win')
      }
      headerEl.appendChild(matchBadge)
    }

    if(result) attachRoundsToggle(headerEl, roundsDiv)

    container.appendChild(el)
  })
}

document.addEventListener('DOMContentLoaded', loadSchedule)

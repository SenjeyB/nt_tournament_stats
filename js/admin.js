const CHARACTERS = [
  'chicken','crystal','eyes','fish','frog','horror','melting',
  'plant','rebel','robot','rogue','skeleton','steroids','yc','yv'
]

let matches = []
let participants = []

async function loadAdmin(){
  try{
    participants = await fetch('participants.json?_=' + Date.now()).then(r=>r.json())
  }catch(e){
    console.warn('Could not fetch participants.json, player dropdowns will be empty')
  }
  try{
    matches = await fetch('matches.json?_=' + Date.now()).then(r=>r.json())
    render()
    toast('Loaded ' + matches.length + ' matches')
  }catch(e){
    document.getElementById('matchList').textContent = 'Failed to load matches.json'
  }
}

function loadFromFile(){
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.addEventListener('change', () => {
    const file = input.files[0]
    if(!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try{
        matches = JSON.parse(reader.result)
        render()
        toast('Loaded: ' + file.name)
      }catch(e){
        toast('Invalid JSON')
      }
    }
    reader.readAsText(file)
  })
  input.click()
}

function saveJSON(){
  const data = buildExportData()
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], {type:'application/json'})
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'matches.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(a.href)
  toast('Saved — replace file in project folder')
}

function render(){
  const container = document.getElementById('matchList')
  container.innerHTML = ''

  matches.forEach((m, mi) => {
    const card = document.createElement('div')
    card.className = 'match-card'
    card.dataset.idx = mi

    const del = document.createElement('button')
    del.className = 'delete-match'
    del.textContent = '✕'
    del.title = 'Delete match'
    del.addEventListener('click', () => { deleteMatch(mi) })
    card.appendChild(del)

    const hdr = document.createElement('div')
    hdr.className = 'match-card-header'

    hdr.appendChild(makeField('#', 'number', m.matchNumber, v => { m.matchNumber = parseInt(v)||0 }))
    hdr.appendChild(makeField('Date', 'text', m.date||'', v => { m.date = v }, 'short'))
    hdr.appendChild(makeField('Time', 'text', m.time||'', v => { m.time = v }, 'short'))
    hdr.appendChild(makePlayerSelect('Player 1', m.player1, v => { m.player1 = v }))
    hdr.appendChild(makePlayerSelect('Player 2', m.player2, v => { m.player2 = v }))
    hdr.appendChild(makeField('Score', 'text', m.score||'', v => { m.score = v }, 'score-field'))

    const collapseBtn = document.createElement('button')
    collapseBtn.className = 'collapse-btn'
    collapseBtn.textContent = '▼'
    collapseBtn.addEventListener('click', () => {
      card.classList.toggle('collapsed')
      collapseBtn.textContent = card.classList.contains('collapsed') ? '▶' : '▼'
    })
    hdr.appendChild(collapseBtn)

    card.appendChild(hdr)

    const roundsSec = document.createElement('div')
    roundsSec.className = 'rounds-section'

    const roundsHeader = document.createElement('h4')
    roundsHeader.textContent = 'Rounds'
    const addRoundBtn = document.createElement('button')
    addRoundBtn.textContent = '+ Round'
    addRoundBtn.style.fontSize = '9px'
    addRoundBtn.style.padding = '4px 8px'
    addRoundBtn.addEventListener('click', () => { addRound(mi) })
    roundsHeader.appendChild(addRoundBtn)
    roundsSec.appendChild(roundsHeader)

    ;(m.rounds||[]).forEach((r, ri) => {
      roundsSec.appendChild(buildRoundEditor(m, mi, r, ri))
    })

    card.appendChild(roundsSec)
    container.appendChild(card)
  })
}

function makeField(label, type, value, onChange, cls){
  const wrap = document.createElement('div')
  wrap.className = 'field'
  const lbl = document.createElement('label')
  lbl.textContent = label
  const inp = document.createElement('input')
  inp.type = type
  inp.value = value
  if(cls) inp.className = cls
  inp.addEventListener('change', () => onChange(inp.value))
  wrap.appendChild(lbl)
  wrap.appendChild(inp)
  return wrap
}

function makePlayerSelect(label, current, onChange){
  const wrap = document.createElement('div')
  wrap.className = 'field'
  const lbl = document.createElement('label')
  lbl.textContent = label
  const sel = document.createElement('select')

  const emptyOpt = document.createElement('option')
  emptyOpt.value = ''
  emptyOpt.textContent = '—'
  sel.appendChild(emptyOpt)

  participants.forEach(p => {
    const opt = document.createElement('option')
    opt.value = p.name
    opt.textContent = p.name
    if(p.name === current) opt.selected = true
    sel.appendChild(opt)
  })

  if(current && !participants.find(p => p.name === current)){
    const opt = document.createElement('option')
    opt.value = current
    opt.textContent = current + ' (custom)'
    opt.selected = true
    sel.appendChild(opt)
  }

  sel.addEventListener('change', () => onChange(sel.value))
  wrap.appendChild(lbl)
  wrap.appendChild(sel)
  return wrap
}

function buildRoundEditor(match, mi, round, ri){
  const row = document.createElement('div')
  row.className = 'round-edit'

  const label = document.createElement('div')
  label.className = 'round-label'
  label.textContent = 'R' + (ri+1)
  row.appendChild(label)

  const p1side = document.createElement('div')
  p1side.className = 'player-side'
  const p1lbl = document.createElement('div')
  p1lbl.className = 'side-label'
  p1lbl.textContent = match.player1 || 'P1'
  p1side.appendChild(p1lbl)
  p1side.appendChild(buildCharPicker(round.player1Char, c => { round.player1Char = c }))
  row.appendChild(p1side)

  const vsCol = document.createElement('div')
  vsCol.className = 'vs-col'
  vsCol.textContent = 'vs'
  row.appendChild(vsCol)

  const p2side = document.createElement('div')
  p2side.className = 'player-side'
  const p2lbl = document.createElement('div')
  p2lbl.className = 'side-label'
  p2lbl.textContent = match.player2 || 'P2'
  p2side.appendChild(p2lbl)
  p2side.appendChild(buildCharPicker(round.player2Char, c => { round.player2Char = c }))
  row.appendChild(p2side)

  const winnerDiv = document.createElement('div')
  winnerDiv.className = 'winner-select'
  const winLabel = document.createElement('div')
  winLabel.className = 'side-label'
  winLabel.textContent = 'Winner'
  winnerDiv.appendChild(winLabel)

  const radioName = 'winner_' + mi + '_' + ri
  ;['player1','player2'].forEach(val => {
    const lbl = document.createElement('label')
    const radio = document.createElement('input')
    radio.type = 'radio'
    radio.name = radioName
    radio.value = val
    if(round.winner === val) radio.checked = true
    radio.addEventListener('change', () => { round.winner = val })
    lbl.appendChild(radio)
    const txt = val === 'player1' ? 'P1' : 'P2'
    lbl.appendChild(document.createTextNode(txt))
    winnerDiv.appendChild(lbl)
  })
  row.appendChild(winnerDiv)

  const delBtn = document.createElement('button')
  delBtn.className = 'delete-round'
  delBtn.textContent = '✕'
  delBtn.title = 'Delete round'
  delBtn.addEventListener('click', () => { deleteRound(mi, ri) })
  row.appendChild(delBtn)

  return row
}

function buildCharPicker(current, onChange){
  const picker = document.createElement('div')
  picker.className = 'char-picker'

  CHARACTERS.forEach(c => {
    const img = document.createElement('img')
    img.src = 'characters/' + c + '.png'
    img.alt = c
    img.title = c
    if(current === c + '.png') img.classList.add('selected')
    img.addEventListener('click', () => {
      const prev = picker.querySelector('.selected')
      if(prev) prev.classList.remove('selected')
      if(current === c + '.png'){
        onChange('')
        current = ''
      } else {
        img.classList.add('selected')
        onChange(c + '.png')
        current = c + '.png'
      }
    })
    picker.appendChild(img)
  })

  return picker
}

function addMatch(){
  const maxNum = matches.reduce((mx, m) => Math.max(mx, m.matchNumber||0), 0)
  matches.push({matchNumber: maxNum+1, date:'', time:'', player1:'', player2:'', score:'', rounds:[]})
  render()
  toast('Match added')
}

function deleteMatch(idx){
  if(!confirm('Delete match #' + (matches[idx].matchNumber||idx+1) + '?')) return
  matches.splice(idx, 1)
  render()
  toast('Match deleted')
}

function addRound(mi){
  if(!matches[mi].rounds) matches[mi].rounds = []
  matches[mi].rounds.push({player1Char:'', player2Char:'', winner:''})
  render()
}

function deleteRound(mi, ri){
  matches[mi].rounds.splice(ri, 1)
  render()
}

function autoScore(){
  matches.forEach(m => {
    if(!m.rounds || !m.rounds.length) return
    let c1=0, c2=0
    m.rounds.forEach(r => {
      if(r.winner === 'player1') c1++
      else if(r.winner === 'player2') c2++
    })
    m.score = c1 + ' - ' + c2
  })
  render()
  toast('Scores updated')
}

function buildExportData(){
  return matches.map(m => {
    const obj = {}
    if(m.matchNumber !== undefined) obj.matchNumber = m.matchNumber
    if(m.date) obj.date = m.date
    if(m.time) obj.time = m.time
    obj.player1 = m.player1 || ''
    obj.player2 = m.player2 || ''
    if(m.score) obj.score = m.score
    if(m.rounds && m.rounds.length){
      obj.rounds = m.rounds.map(r => {
        const ro = {}
        if(r.player1Char) ro.player1Char = r.player1Char
        if(r.player2Char) ro.player2Char = r.player2Char
        if(r.winner) ro.winner = r.winner
        if(r.stage) ro.stage = r.stage
        if(r.note) ro.note = r.note
        if(r.info) ro.info = r.info
        return ro
      })
    }
    return obj
  })
}

function copyJSON(){
  const data = buildExportData()
  navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
    toast('JSON copied to clipboard')
  }).catch(() => {
    toast('Copy failed')
  })
}

function toast(msg){
  const el = document.getElementById('toast')
  el.textContent = msg
  el.classList.add('show')
  setTimeout(() => { el.classList.remove('show') }, 2000)
}

document.addEventListener('DOMContentLoaded', loadAdmin)

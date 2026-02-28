import json
from collections import defaultdict

with open('matches.json', encoding='utf-8-sig') as f:
    matches = json.load(f)

seqTo3 = ['Any%', 'Any%', 'Captain', 'Captain', 'All Bosses']
seqTo4 = ['Any%', 'Any%', 'Any%', 'Captain', 'Captain', 'All Bosses', 'All Bosses']

char_by_cat_picks = defaultdict(lambda: defaultdict(int))
char_matrix = defaultdict(lambda: defaultdict(lambda: {'count':0,'winsA':0,'winsB':0}))
char_picks = defaultdict(int)

for m in matches:
    score = m.get('score','')
    parts = [p.strip() for p in score.split('-')] if score else []
    maxscore = 0
    if len(parts)==2:
        try:
            maxscore = max(int(parts[0]), int(parts[1]))
        except:
            maxscore = 0
    matchType = 'to4' if maxscore>=4 else 'to3'
    rounds = m.get('rounds', [])
    seq = seqTo4 if matchType=='to4' else seqTo3
    for idx,r in enumerate(rounds):
        cat = seq[idx] if idx < len(seq) else 'Any%'
        c1 = r.get('player1Char')
        c2 = r.get('player2Char')
        if c1:
            char_picks[c1]+=1
            char_by_cat_picks[cat][c1]+=1
        if c2:
            char_picks[c2]+=1
            char_by_cat_picks[cat][c2]+=1
        if not c1 or not c2:
            continue
        a,b = (c1,c2) if c1<=c2 else (c2,c1)
        key = a+'||'+b
        if c1==c2:
            char_matrix[cat][key]['count']+=2
            char_matrix['All'][key]['count']+=2
        else:
            char_matrix[cat][key]['count']+=1
            char_matrix['All'][key]['count']+=1
        winner = r.get('winner')
        if winner=='player1':
            if c1==a:
                char_matrix[cat][key]['winsA']+=1
                char_matrix['All'][key]['winsA']+=1
            else:
                char_matrix[cat][key]['winsB']+=1
                char_matrix['All'][key]['winsB']+=1
        elif winner=='player2':
            if c2==a:
                char_matrix[cat][key]['winsA']+=1
                char_matrix['All'][key]['winsA']+=1
            else:
                char_matrix[cat][key]['winsB']+=1
                char_matrix['All'][key]['winsB']+=1

# report
print('Steroids picks in Captain:', char_by_cat_picks['Captain'].get('steroids.png',0))
print('Total steroids picks:', char_picks.get('steroids.png',0))

rogue_key = 'rogue.png||rogue.png'
print('rogue||rogue in All matrix:', char_matrix['All'].get(rogue_key))
print('rogue||rogue in Captain matrix:', char_matrix['Captain'].get(rogue_key))

# list pairs where a==b
same_pairs_all = [(k,v) for k,v in char_matrix['All'].items() if k.split('||')[0]==k.split('||')[1]]
print('Same-character pairs in All (count, wins):')
for k,v in same_pairs_all:
    print(k, v)

# top 10 pairs by count in Captain
pairs = sorted(char_matrix['Captain'].items(), key=lambda kv: kv[1]['count'], reverse=True)
print('\nTop pairs in Captain:')
for k,v in pairs[:20]:
    print(k, v)

# total entries
print('\nTotal characters seen:', len(char_picks))
print('Characters in Captain:', len(char_by_cat_picks['Captain']))

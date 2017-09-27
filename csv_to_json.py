import os
import json
# csv_file = 'big.csv'
# json_file = 'big.json'
# csv_file = 'small.csv'
# json_file = 'small.json'

csv_file = 'large.csv'
json_file = 'large.json'

lines = []
with open(csv_file) as f:
    lines = f.readlines()
    lines = lines[1:]    
    lines = list(map(lambda x: x.strip().split(';'), lines))

graph = {}
nodes = []
links = []

nodes_set = set()
for line in lines:
    nodes_set.add(line[0])
    nodes_set.add(line[1])
    
    weight = float(line[2])
    links.append(
        {"source": line[0], "target": line[1], "value": weight},
    )

for node in nodes_set:
    nodes.append(
        {'id': node}
    )

graph = {'nodes': nodes, 'links': links}
json_str = json.dumps(graph, indent=1)
with open(json_file, 'w') as f:
    f.write(json_str)

import json
import os

def MakeOneToOne(rel, locale, relationships):
    if not relationships[rel['name']]:
        relationships[rel['name']] = {
            'type': 'OneToOne',
            'obj1': rel['obj1']['group'],
            'obj2': rel['obj2']['group']
        }
    relationships[rel['name']][rel['obj1']['id']] = rel['obj2']['id']
    relationships[rel['name']][rel['obj2']['id']] = rel['obj1']['id']
    with open(locale + '/relationships.json', 'w') as outfile:
        json.dump(relationships, outfile, indent=4, separators=(',', ': '), sort_keys=True)
    
def MakeManyToOne(rel, locale, relationships):
    if not relationships[rel['name']]:
        relationships[rel['name']] = {
            'type': 'ManyToOne',
            'obj1': rel['obj1']['group'],
            'obj2': rel['obj2']['group']
        }
        relationships[rel['name']][rel['obj1']['id']] = rel['obj2']['id']
        with open(locale + '/relationships.json', 'w') as outfile:
            json.dump(relationships, outfile, indent=4, separators=(',', ': '), sort_keys=True)

def MakeOneToMany(rel, locale, relationships):
    if not relationships[rel['name']]:
        relationships[rel['name']] = {
            'type:': 'OneToMany',
            'obj1': rel['obj1']['group'],
            'obj2': rel['obj2']['group']
        }
    if not relationships[rel['name']][rel['obj1']['id']]:
        relationships[rel['name']][rel['obj1']['id']] = {}
    relationships[rel['name']][rel['obj1']['id']][rel['obj2']['id']] = rel['obj2']['id']
    with open(locale + '/relationships.json', 'w') as outfile:
            json.dump(relationships, outfile, indent=4, separators=(',', ': '), sort_keys=True)

def MakeManyToMany(rel, locale, relationships):
    if not relationships[rel['name']]:
        relationships[rel['name']] = {
            'type': 'ManyToMany',
            'obj1': rel['obj1']['group'],
            'obj2': rel['obj2']['group']
        }
    if not relationships[rel['name']][rel['obj1']['id']]:
        relationships[rel['name']][rel['obj1']['id']] = {}
    if not relationships[rel['name']][rel['obj2']['id']]:
        relationships[rel['name']][rel['obj2']['id']] = {}
    relationships[rel['name']][rel['obj1']['id']][rel['obj2']['id']] = rel['obj2']['id']
    relationships[rel['name']][rel['obj2']['id']][rel['obj1']['id']] = rel['obj1']['id']
    with open(locale + '/relationships.json', 'w') as outfile:
            json.dump(relationships, outfile, indent=4, separators=(',', ': '), sort_keys=True)

def Joining(obj, factor, locale):
    relationships = {}
    if os.path.isfile(locale + "/relationships.json"):
        relationships = json.load(locale + "/relationships.json")
    else:
        relationships = False
    if not relationships:
        return obj
    for key in relationships:
        current = relationships[key]
        if current['type'] == 'OneToMany' and current['obj1'] == obj['group'] and current[obj['id']]:
            group = json.load(locale + '/library' + current['obj2' + '.json'])
            for i in current[obj['id']]:
                tempObj = group[current[obj['id']][i]]
                if factor > 0:
                    tempObj = Joining(tempObj, factor - 1, locale)
                if not obj[key]:
                    obj[key] = {}
                obj[key][tempObj['id']] = tempObj
        if current['type'] == 'ManyToOne' and current['obj1'] == obj['group'] and current[obj['id']]:
            group = json.load(locale + '/library/' + current['obj2'] + '.json')
            tempObj = group[current[obj['id']]]
            if factor > 0:
                tempObj = Joining(tempObj, factor - 1, locale)
            if not obj[key]:
                obj[key] = {}
            obj[key] = tempObj
        if current['type'] == 'OneToOne' and current['obj1'] == obj['group'] and current[obj['id']]:
            group = json.load(locale + '/library/' + current['obj2'] + '.json')
            tempObj = group[current[obj['id']]]
            if factor > 0:
                tempObj = Joining(tempObj, factor - 1, locale)
            if not obj[key]:
                obj[key] = {}
            obj[key][tempObj['id']] = tempObj
        if current['type'] == 'ManyToMany' and current['obj1'] == obj['group'] and current[obj['id']]:
            group = json.load(locale + '/library/' + current['obj2'] + '.json')
            for i in current[obj['id']]:
                tempObj = group[current[obj['id']][i]]
                if factor > 0:
                    tempObj = Joining(tempObj, factor - 1, locale)
                if not obj[key]:
                    obj[key] = {}
                obj[key][tempObj['id']] = tempObj
    return obj
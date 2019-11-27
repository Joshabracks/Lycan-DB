import json
import os

def MakeOneToOne(rel, locale, relationships):
    if not relationships[rel['name']]:
        relationships[rel['name']] = {
            'type': 'OneToOne',
            'obj1': rel['obj1']['group'],
            'obj2': rel['obj2']['group']
        }
    relationships[rel['name']][rel['obj1']['_id']] = rel['obj2']['_id']
    relationships[rel['name']][rel['obj2']['_id']] = rel['obj1']['_id']
    with open(locale + '/relationships.json', 'w') as outfile:
        json.dump(relationships, outfile, indent=4, separators=(',', ': '), sort_keys=True)
    
def MakeManyToOne(rel, locale, relationships):
    if not relationships[rel['name']]:
        relationships[rel['name']] = {
            'type': 'ManyToOne',
            'obj1': rel['obj1']['group'],
            'obj2': rel['obj2']['group']
        }
        relationships[rel['name']][rel['obj1']['_id']] = rel['obj2']['_id']
        with open(locale + '/relationships.json', 'w') as outfile:
            json.dump(relationships, outfile, indent=4, separators=(',', ': '), sort_keys=True)

def MakeOneToMany(rel, locale, relationships):
    if not relationships[rel['name']]:
        relationships[rel['name']] = {
            'type:': 'OneToMany',
            'obj1': rel['obj1']['group'],
            'obj2': rel['obj2']['group']
        }
    if not relationships[rel['name']][rel['obj1']['_id']]:
        relationships[rel['name']][rel['obj1']['_id']] = {}
    relationships[rel['name']][rel['obj1']['_id']][rel['obj2']['_id']] = rel['obj2']['_id']
    with open(locale + '/relationships.json', 'w') as outfile:
            json.dump(relationships, outfile, indent=4, separators=(',', ': '), sort_keys=True)

def MakeManyToMany(rel, locale, relationships):
    if not relationships[rel['name']]:
        relationships[rel['name']] = {
            'type': 'ManyToMany',
            'obj1': rel['obj1']['group'],
            'obj2': rel['obj2']['group']
        }
    if not relationships[rel['name']][rel['obj1']['_id']]:
        relationships[rel['name']][rel['obj1']['_id']] = {}
    if not relationships[rel['name']][rel['obj2']['_id']]:
        relationships[rel['name']][rel['obj2']['_id']] = {}
    relationships[rel['name']][rel['obj1']['_id']][rel['obj2']['_id']] = rel['obj2']['_id']
    relationships[rel['name']][rel['obj2']['_id']][rel['obj1']['_id']] = rel['obj1']['_id']
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
        if current['type'] == 'OneToMany' and current['obj1'] == obj['group'] and current[obj['_id']]:
            group = json.load(locale + '/library' + current['obj2' + '.json'])
            for i in current[obj['_id']]:
                tempObj = group[current[obj['_id']][i]]
                if factor > 0:
                    tempObj = Joining(tempObj, factor - 1, locale)
                if not obj[key]:
                    obj[key] = {}
                obj[key][tempObj['_id']] = tempObj
        if current['type'] == 'ManyToOne' and current['obj1'] == obj['group'] and current[obj['_id']]:
            group = json.load(locale + '/library/' + current['obj2'] + '.json')
            tempObj = group[current[obj['_id']]]
            if factor > 0:
                tempObj = Joining(tempObj, factor - 1, locale)
            if not obj[key]:
                obj[key] = {}
            obj[key] = tempObj
        if current['type'] == 'OneToOne' and current['obj1'] == obj['group'] and current[obj['_id']]:
            group = json.load(locale + '/library/' + current['obj2'] + '.json')
            tempObj = group[current[obj['_id']]]
            if factor > 0:
                tempObj = Joining(tempObj, factor - 1, locale)
            if not obj[key]:
                obj[key] = {}
            obj[key][tempObj['_id']] = tempObj
        if current['type'] == 'ManyToMany' and current['obj1'] == obj['group'] and current[obj['_id']]:
            group = json.load(locale + '/library/' + current['obj2'] + '.json')
            for i in current[obj['_id']]:
                tempObj = group[current[obj['_id']][i]]
                if factor > 0:
                    tempObj = Joining(tempObj, factor - 1, locale)
                if not obj[key]:
                    obj[key] = {}
                obj[key][tempObj['_id']] = tempObj
    return obj

def Validate(obj, parameter, locale, _type):
    relationships = {}
    if os.path.isfile(locale + '/relationships.json'):
        relationships = json.load(locale + '/relationships.json')
    else:
        relationships = {}
    if _type == 'OneToOne':
        rel = {
            'name': parameter,
            'obj1': obj,
            'obj2': obj[parameter]
        }
        return MakeOneToOne(rel, locale, relationships)
    if _type == 'OneToMany':
        result = []
        for key in object[parameter]:
            rel = {
                'name': parameter + '_of',
                'obj1': obj,
                'obj2': obj[parameter][key],
                'secret': 'OneToMany'
            }
            result.append(MakeOneToMany(rel, locale, relationships))
            rel2 = {
                'name': parameter,
                'obj1': obj[parameter],
                'obj2': obj
            }
            result.append(MakeManyToOne(rel2, locale, relationships))
        return result
    if _type == 'ManyToOne':
        result = []
        rel = {
            'name': parameter + '_of',
            'obj1': obj[parameter],
            'obj2': obj
        }
        rel2 = {
            'name': parameter,
            'obj1': obj,
            'obj2': obj[parameter]
        }
        result.append(MakeOneToMany(rel, locale, relationships))
        result.append(MakeManyToOne(rel2, locale, relationships))
        return result
    if _type == 'ManyToMany':
        for key in obj[parameter]:
            rel = {
                'name': parameter,
                'obj1': obj,
                'obj2': obj[parameter][key]
            }
            return MakeManyToMany(rel, locale, relationships)

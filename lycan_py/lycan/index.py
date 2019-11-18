import json
import os

crypt = False
auto = True
curator = {}
crypt: False
locale = '/'

def local(location, models, options):
    if options:
        if options.crypt:
            options = options.crypt
    locale = location
    if os.path.isfile(location + '/curator.json'):
        curator = json.load(location + '/curator.json')
    if models:
        for model in models:
            if not curator[model]:
                models[model].tally = 0
                curator[model] = models[model]
            else:
                for key in models[model]:
                    curator[model][key] = models[model][key]
    if not os.path.isdir(location):
        os.mkdir(location)
        os.mkdir(location + "/library")
    with open('curator.json', 'w') as outfile:
        json.dump(curator, outfile)

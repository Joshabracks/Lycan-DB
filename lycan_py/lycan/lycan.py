import json
import os
import lycan_py.lycan.jana as jana
import lycan_py.lycan.hestia as hestia

crypt = False
auto = True
crypt: False
locale = '/'
curator = {}

def local(location='../db', models=False, options=False):
    global curator
    global locale
    if options:
        if options.crypt:
            options = options.crypt
    locale = location
    if os.path.isfile(location + '/curator.json'):
        curator = json.load(location + '/curator.json')
    if models:
        curator = {}
        for model in models:
            if model not in curator:
                models[model]['tally'] = 0
                curator[model] = models[model]
            else:
                for key in models[model]:
                    curator[model][key] = models[model][key]
    if not os.path.isdir(location):
        os.mkdir(location)
        os.mkdir(location + "/library")
    with open(location + '/curator.json', 'w') as outfile:
        json.dump(curator, outfile, indent=4, separators=(',', ': '), sort_keys=True)

def Add(groupName, obj):
    global curator
    errors = {}
    group = {}
    if os.path.isfile(locale + '/library/' + groupName + '.json'):
        group = json.load(locale + '/library' + groupName + '.json')
    if type(groupName) != 'str':
        errors['groupNameType'] = 'groupName must be of type "str"'
    if type(obj) != 'dict':
        errors['objType'] = 'obj must by of type "dict"'
    if not curator[groupName]:
        errors['groupNameExist'] = 'A group of ' + groupName + ' does not exist.'
    model = curator[groupName]
    if not model['tally']:
        model['tally'] = 0
    obj['group'] = groupName
    validations = runValidations(model, obj)
    obj = validations['obj']
    err = validations['err']
    if len(err) > 0:
        for error in err:
            errors['error'] = err['error']
    if len(errors) > 0:
        response = {
            "errors": errors
        }
        return response
    else:
        obj['group'] = groupName
        curator[groupName]['tally'] += 1
        group[obj]['id'] = obj
        with open(locale + '/curator.json', 'w') as outfile:
            json.dump(curator, outfile, indent=4, separators=(',', ': '), sort_keys=True)
        with open(locale + '/library/' + groupName + '.json', 'w') as outfile:
            json.dump(group, outfile, indent=4, separators=(',', ': '), sort_keys=True)
        return obj

def runValidations(model, obj):
    errors = {}
    for key in obj:
        if not model[key] and key != 'group' and key != 'id':
            errors['parameter'] = key + 'is not a valid parameter'
        for parameter in model:
            relate = False
            if model[parameter]['required']:
                if not obj[parameter]:
                    if model[parameter]['requiredError']:
                        errors[parameter + 'Required'] = model[parameter]['requiredError']
                    else:
                        errors[parameter + 'Required'] = 'Parameter ' + parameter + ' is required.'
            if obj[parameter]:
                if model[parameter]['type']:
                    if model[parameter]['type'] == 'email':
                        emailVerify = jana.verifyEmail(obj[parameter])
                        if emailVerify['error']:
                            if model[parameter]['typeError']:
                                errors['email'] = model[parameter]['typeError']
                            else:
                                errors['email'] = emailVerify['error']
                    elif model[parameter]['type'] != type(obj[parameter]):
                        if model[parameter]['type'] == 'ManyToMany' or model[parameter]['type'] == 'OneToMany' or model[parameter]['type'] == 'ManyToOne' or model[parameter]['type'] == 'OneToOne':
                            hestia.Validate(obj, parameter, model[parameter]['type'])
                            relate = True
                            if model[parameter]['group'] != obj[parameter]['group']:
                                thisErr = True
                                if type(obj[parameter]) == 'dict':
                                    for item in object[parameter]:
                                        if model[parameter]['group'] != obj[item]['group']:
                                            thisErr = False
                                if not thisErr:
                                    errors[parameter + 'Type'] = 'Invalid relationships error'
                        elif model[parameter]['typeError']:
                            errors[parameter + 'Type'] = model[parameter]['typeError']
                        else:
                            errors[parameter + 'Type'] = 'Parameter ' + parameter + ' must be of type ' + model[parameter]['type'] + '.'
                if model[parameter]['min']:
                    if model[parameter]['type'] == 'str' or model[parameter]['type'] == 'string':
                        if len(obj[parameter])  < model[parameter]['min']:
                            if model[parameter]['minError']:
                                errors[parameter + 'Min'] = model[parameter]['minError']
                            else:
                                errors[parameter + 'Min'] = 'Length of ' + parameter + ' must be at least ' + obj[parameter]['min'] + ' characters long.'
                    if model[parameter]['type'] == 'int' or model[parameter]['type'] == 'float' or model[parameter]['type'] == 'double' or model[parameter]['type'] == 'complex':
                        if obj[parameter] < model[parameter]['min']:
                            if model[parameter]['minError']:
                                errors[parameter + 'Min'] = model[parameter]['minError']
                            else:
                                errors[parameter + 'Min'] = 'Parameter ' + parameter + ' must be at least ' + model[parameter]['min'] + '.'
                
                if model[parameter]['max']:
                    if model[parameter]['type'] == 'str' or model[parameter]['type'] == 'string':
                        if len(obj[parameter])  > model[parameter]['max']:
                            if model[parameter]['maxError']:
                                errors[parameter + 'Max'] = model[parameter]['maxError']
                            else:
                                errors[parameter + 'Max'] = 'Length of ' + parameter + ' must be at least ' + obj[parameter]['max'] + ' characters long.'
                    if model[parameter]['type'] == 'int' or model[parameter]['type'] == 'float' or model[parameter]['type'] == 'double' or model[parameter]['type'] == 'complex':
                        if obj[parameter] > model[parameter]['max']:
                            if model[parameter]['maxError']:
                                errors[parameter + 'Max'] = model[parameter]['maxError']
                            else:
                                errors[parameter + 'Max'] = 'Parameter ' + parameter + ' must be at least ' + model[parameter]['max'] + '.'
                if model[parameter]['unique']:
                    group = {}
                    if os.path.isfile(locale + '/library/' + obj['group'] + '.json'):
                        group = json.load(locale + '/library/' + obj['group'] + '.json')
                    for key in group:
                        if group[key][parameter] == obj[parameter] and group[key]['id'] == obj['id']:
                            if model[parameter]['uniqueError']:
                                errors[parameter + 'Unique'] = model[parameter]['uniqueError']
                            else:
                                errors[parameter + 'Unique'] = 'Parameter ' + parameter + ' must be unique.'
                if model[parameter]['crypt']:
                    if crypt != False:
                        obj[parameter] = crypt.hide(obj[parameter])
                    else:
                        obj[parameter] = jana.crypt(obj[parameter])
            if relate:
                del object[parameter]
        if len(errors) > 0:
            return { 'errors': errors }
        else:
            return obj

def updateHelper(group, id):
    return GetById(group, id)
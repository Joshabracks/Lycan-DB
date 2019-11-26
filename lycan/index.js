const fs = require('fs');
let curator;
const auto = true;
module.exports = {
    session: (key, value) => {

    },
    crypt: false,
    locale: false,
    local: (location, models, options) => {
        if (options) {
            if (options.crypt) {
                this.crypt = options.crypt;
            }
        }
        this.locale = location;
        return new Promise(function (resolve, reject) {
            if (fs.existsSync(location + '/curator.json')) {
                curator = JSON.parse(fs.readFileSync(location + "/curator.json"));
            } else {
                curator = {
                }
            }
            if (models) {
                for (model in models) {
                    if (!curator[model]) {
                        models[model].tally = 0;
                        curator[model] = models[model];
                    } else {
                        for (key in models[model]) {
                            curator[model][key] = models[model][key];
                        }
                    }
                }

            }
            if (!fs.existsSync(location)) {
                fs.mkdirSync(location);
                fs.mkdirSync(location + '/library')
            }
            fs.writeFile(location + '/curator.json', JSON.stringify(curator, null, 4), 'utf8', function (err) {
                if (err) {
                    return reject(err);
                }
            })
            return resolve("success");
        })
    },
    Add: async (groupName, object) => {
        curator = fetchCurator(this.locale);
        let errors = {};
        let group;
        if (fs.existsSync(this.locale + '/library/' + groupName + '.json')) {
            group = JSON.parse(fs.readFileSync(this.locale + "/library/" + groupName + '.json'));
        } else {
            group = {};
        }
        if (typeof (groupName) != 'string') {
            errors.groupNameType = 'groupName must be of type "string"';
        }
        if (typeof (object) != 'object') {
            errors.objectType = 'object must be of type "object"';
        }
        if (!curator[groupName]) {
            errors.groupNameExist = 'A group of ' + groupName + ' does not exist';
        }
        const model = curator[groupName];
        if (!model.tally) {
            model.tally = 0;
        }
        object.group = groupName;
        object.id = groupName + "_" + curator[groupName].tally;
        await runValidations(model, object, this.locale)
            .then(obj => {
                object = obj;
            })
            .catch(err => {
                for (error in err) {
                    errors[error] = err[error];
                }
            });
        let dir = this.locale;
        return new Promise(function (resolve, reject) {
            if (Object.keys(errors).length > 0) {
                return reject(errors);
            } else {
                object.group = groupName;
                curator[groupName].tally++;
                group[object.id] = object;
                fs.writeFileSync(dir + '/library/' + groupName + ".json", JSON.stringify(group, null, 4), 'utf8', function (err) {
                    if (err) {
                        return reject(err);
                    }
                });
                fs.writeFile(dir + '/curator.json', JSON.stringify(curator, null, 4), 'utf8', function (err) {
                    if (err) {
                        return reject(err);
                    }
                });
            }
            return resolve(object);
        })
    },
    GetGroup: (group) => {
        const dir = this.locale;
        return new Promise(function (resolve, reject) {
            curator = fetchCurator(dir);
            if (fs.existsSync(dir + "/library/" + group + ".json")) {
                return resolve(JSON.parse(fs.readFileSync(dir + "/library/" + group + ".json")));
            } else {
                return reject({ message: "group " + group + " does not exist", fail: true });
            }
        })
    },
    Delete: (object) => {
        const dir = this.locale;
        return new Promise(function (resolve, reject) {
            let group;
            if (fs.existsSync(dir + "/library/" + object.group + '.json')) {
                group = JSON.parse(fs.readFileSync(dir + "/library/" + object.group + '.json'));
                if (group[object.id]) {
                    delete group[object.id];
                    fs.writeFileSync(dir + '/library/' + object.group + ".json", JSON.stringify(group, null, 4), 'utf8', function (err) {
                        if (err) {
                            return reject(err);
                        } else {
                            return resolve('success');
                        }
                    });
                } else {
                    return reject(['Object does not exist within specified group']);
                }
            } else {
                return reject(['Cannot Delete group does not exist']);
            }
        })
    },
    Update: async (object, skipValidations) => {
        let errors = {};
        const dir = this.locale;
        const model = curator[object.group];
        let actual = await updateHelper(object.group, object.id)
            .then(data => {
                return data;
            })
            .catch(console.log)
        for (key in actual) {
            if (!object[key]) {
                object[key] = actual[key];
            }
        }
        if (skipValidations != true) {
            await runValidations(model, object, this.locale)
                .then(obj => {
                    object = obj;
                })
                .catch(err => {
                    for (error in err) {
                        errors[error] = err[error];
                    }
                });
        } else {
            for (parameter in model) {
                if (model[parameter].type == 'ManyToMany' || model[parameter].type == 'OneToMany' || model[parameter].type == 'ManyToOne' || model[parameter].type == 'OneToOne') {
                    await hestia.Validate(object, parameter, dir, model[parameter].type)
                        .then(data => { })
                        .catch(console.log)
                    delete object[parameter];
                }
            }
        }
        return new Promise(function (resolve, reject) {
            if (Object.keys(errors).length > 0) {
                return reject(errors);
            }
            let group;
            if (fs.existsSync(dir + "/library/" + object.group + '.json')) {
                group = JSON.parse(fs.readFileSync(dir + "/library/" + object.group + '.json'));
                if (group[object.id]) {
                    tempObj = group[object.id];
                    for (key in tempObj) {
                        if (object[key] == undefined) {
                            object[key] = tempObj[key];
                        }
                    }
                    group[object.id] = object;
                    fs.writeFileSync(dir + '/library/' + object.group + ".json", JSON.stringify(group, null, 4), 'utf8', function (err) {
                        if (err) {
                            return reject(err);
                        }
                    });
                    return resolve(object);
                } else {
                    return reject(['Object does not exist within specified group']);
                }
            } else {
                return reject(['group does not exist']);
            }
        })
    },
    GetById: async (group, id, factor) => {
        const dir = this.locale;
        return new Promise(function (resolve, reject) {
            if (fs.existsSync(dir + "/library/" + group + '.json')) {
                group = JSON.parse(fs.readFileSync(dir + "/library/" + group + '.json'));
                grue = group[id];
                if (group[id]) {
                    return resolve(hestia.Joining(grue, factor, dir));
                } else {
                    return reject("Cannot find object by id requested");
                }
            } else {
                return reject(["Cannot get by id group does not exist"]);
            }
        })
    },
    Reveal: async (crypted, string) => {
        let crypto = false;
        if (this.crypt) {
            crypto = this.crypt;
        }
        return new Promise(function (resolve, reject) {
            if (crypto) {
                crypto.reveal(crypted, string)
                    .then(data => {
                        return resolve(data);
                    })
                    .catch(err => reject(err));
            }
            jana.revealB(crypted, string)
                .then(data => {
                    if (data == crypted) {
                        return resolve(true)
                    } else {
                        jana.revealF(crypted, string)
                            .then(data => {
                                if (data == crypted) {
                                    return resolve(true);
                                } else { return resolve(false) }
                            })
                            .catch(err => reject(err))
                    }
                })
                .catch(err => reject(err))
        })
    },
    GetByKey: (groupName, parameter, value, first, factor) => {
        const dir = this.locale;
        return new Promise(function (resolve, reject) {
            let array = [];
            let errors = {};
            curator = fetchCurator(dir);
            const model = curator[groupName];
            if (model[parameter]) {
                const group = JSON.parse(fs.readFileSync(dir + '/library/' + groupName + '.json'))
                for (object in group) {
                    let current = group[object];
                    if (current[parameter] == value) {
                        array.push(current);
                        if (first) {
                            return resolve(hestia.Joining(current, factor, dir));
                        }
                    }
                }
                for (let i = 0; i < array.length; i++) {
                    array[i] = hestia.Joining(array[i], factor, dir);
                }
                return resolve(array);
            }
        })
    },
    session: {
        read: (id) => {
            const dir = this.locale;
            return new Promise(function (resolve, reject) {
                let sessions;
                if (!fs.existsSync(dir + "/sessions.json")) {
                    sessions = {};
                } else {
                    sessions = JSON.parse(fs.readFileSync(dir + '/sessions.json'));
                }
                if (sessions[id]) {
                    return resolve(sessions[id])
                } else {
                    sessions[id] = {};
                }
                return resolve(sessions[id]);
            })
        },
        write: (id, body) => {
            const dir = this.locale;
            return new Promise(function (resolve, reject) {
                let sessions;
                if (!fs.existsSync(dir + "/sessions.json")) {
                    sessions = {};
                } else {
                    sessions = JSON.parse(fs.readFileSync(dir + '/sessions.json'));
                }
                if (!sessions[id]) {
                    sessions[id] = {};
                }
                for (key in body) {
                    sessions[id][key] = body[key];
                }
                fs.writeFileSync(dir + '/sessions.json', JSON.stringify(sessions, null, 4), 'utf8', function (err) {
                    if (err) {
                        return reject(err);
                    }
                });
                return resolve(sessions[id]);
            })
        }
    }
}

function fetchCurator(loc) {
    return JSON.parse(fs.readFileSync(loc + "/curator.json"));
}

function runValidations(model, object, dir) {
    let crypto = false;
    if (this.crypt) {
        crypto = this.crypt;
    }
    return new Promise(async function (resolve, reject) {
        let errors = {};
        for (key in object) {
            if (!model[key] && key != 'group' && key != 'id') {
                errors['parameter'] = key + ' is not a valid parameter.';
            }
        }
        for (parameter in model) {
            let relate = false;
            if (model[parameter].required) {
                if (!object[parameter] || object[parameter] == undefined || object[parameter] == false) {
                    if (model[parameter].requiredError) {
                        errors[parameter + 'Required'] = model[parameter].requiredError;
                    } else {
                        errors[parameter + 'Required'] = 'Parameter ' + parameter + ' is required.';
                    }
                }
            }
            if (object[parameter]) {
                if (model[parameter].type) {
                    if (model[parameter].type == 'email') {
                        jana.verifyEmail(object[parameter])
                            .then(data => { })
                            .catch(err => {
                                if (model[parameter].typeError) {
                                    errors.email = model[parameter].typeError;
                                } else { errors.email = err }
                            })
                    }
                    else if (model[parameter].type != typeof (object[parameter])) {
                        if (model[parameter].type == 'ManyToMany' || model[parameter].type == 'OneToMany' || model[parameter].type == 'ManyToOne' || model[parameter].type == 'OneToOne') {
                            await hestia.Validate(object, parameter, dir, model[parameter].type)
                                .then(data => { })
                                .catch(console.log)
                            relate = true;
                            if (model[parameter].group != object[parameter].group) {
                                let thisErr = true;
                                if (typeof (object[parameter]) == 'object') {
                                    for (item in object[parameter]) {
                                        if (model[parameter].group != object[parameter][item].group) {
                                            thisErr = false;
                                        }
                                    }
                                }
                                if (thisErr == false) {
                                    errors[parameter + 'Type'] = 'Invalid relationship error';
                                }
                            }
                        }
                        else if (model[parameter].typeError) {
                            errors[parameter + 'Type'] = model[parameter].typeError;
                        } else {
                            errors[parameter + 'Type'] = 'Parameter ' + parameter + ' must be of type ' + model[parameter].type + '.';
                        }
                    }
                }
                if (model[parameter].min) {
                    if (model[parameter].type == 'string') {
                        if (object[parameter].length < model[parameter].min) {
                            if (model[parameter].minError) {
                                errors[parameter + 'Min'] = model[parameter].minError;
                            } else {
                                errors[parameter + 'Min'] = 'Length of ' + parameter + 'must be at least ' + object[parameter].min + ' characters long.';
                            }
                        }
                    }
                    if (model[parameter].type == 'number') {
                        if (object[parameter] < model[parameter].min) {
                            if (model[parameter].minError) {
                                errors[parameter + 'Min'] = model[parameter].minError;
                            } else {
                                errors[parameter + 'Min'] = 'Parameter ' + parameter + ' must be at least ' + model[parameter].min + '.';
                            }
                        }
                    }
                }
                if (model[parameter].max) {
                    if (model[parameter].type == 'string') {
                        if (object[parameter].length > model[parameter].max) {
                            if (model[parameter].maxError) {
                                errors[parameter + 'Max'] = model[parameter].maxError;
                            } else {
                                errors[parameter + 'Max'] = 'Length of ' + parameter + 'must less than ' + object[parameter].max + ' characters long.';
                            }
                        }
                    }
                    if (model[parameter].type == 'number') {
                        if (object[parameter] > model[parameter].max) {
                            if (model[parameter].maxError) {
                                errors[parameter + 'Max'] = model[parameter].maxError;
                            } else {
                                errors[parameter + 'Max'] = 'Parameter ' + parameter + ' must be less than ' + model[parameter].max + '.';
                            }
                        }
                    }
                }
                if (model[parameter].unique) {
                    let group;
                    if (fs.existsSync(dir + "/library/" + object.group + '.json')) {
                        group = JSON.parse(fs.readFileSync(dir + "/library/" + object.group + '.json'));
                    } else {
                        group = {};
                    }
                    for (key in group) {
                        if (group[key][parameter] == object[parameter] && group[key].id != object.id) {
                            if (model[parameter].uniqueError) {
                                errors[parameter + 'Unique'] = model[parameter].uniqueError;
                            } else {
                                errors[parameter + 'Unique'] = ' Parameter ' + parameter + ' must be unique.';
                            }
                        }
                    }
                }
                if (model[parameter].crypt) {
                    if (crypto) {
                        await crypto.hide(object[parameter])
                            .then(data => {
                                object[parameter] = data;
                            })
                            .catch(err => errors[parameter + 'Crypt'] = err)
                    } else {
                        await jana.crypt(object[parameter])
                            .then(data => {
                                object[parameter] = data;
                            })
                            .catch(err => errors[parameter + 'Crypt'] = err)
                    }
                }
            }
            if (relate) {
                delete object[parameter];
            }
        }
        if (Object.keys(errors).length > 0) {
            return reject(errors)
        } else {
            return resolve(object);
        }
    })
}

function updateHelper(group, id) {
    return new Promise(function (resolve, reject) {
        module.exports.GetById(group, id)
            .then(data => { return resolve(data) })
            .catch(err => { return reject(err) })
    })
}
const jana = {
    revealF: (crypt, string) => new Promise(function (resolve, reject) {
        if (typeof (string) != 'string') {
            return reject('Input must be a string');
        }
        const bounty = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012346789`~!@#$%^&*,._+-=';
        const doorway = {};
        let key = {};
        let salt = '';
        for (let i = crypt.length - 10; i < crypt.length; i++) {
            salt += crypt[i];
        }
        string = string + salt;
        let i = 0;
        let knife;
        for (let k = 0; k < bounty.length; k++) {
            if (salt[5] == bounty[k]) {
                knife = k;
            }
        }
        let jumble = '';
        let block = ''
        for (char in string) {
            doorway[i] = string[char];
            key[string[char]] = i;
            i++;
            knife = (knife / i) * bounty.length;
            while (knife > 64) {
                knife = Math.floor(knife * 0.57);
            }
        }
        for (item in key) {
            block += key[item];
            block += doorway[key[item]];
        }
        let k = 0;
        let l = 0;
        for (let j = 0; j < 64; j++) {
            if (k > block.length) {
                k = 0;
            }
            for (let m = 0; m < knife; m++) {
                l++;
                if (l > 64) {
                    l = 0;
                }
            }
            jumble += bounty[l];
            k++;
            if (k > block.length - 1) {
                k = 0;
            }
            knife += block.charCodeAt(k);
            while (knife > 64) {
                knife = Math.floor(knife / string.length);
            }
        }
        jumble += salt;
        return resolve(jumble);
    }),
    revealB: (crypt, string) => new Promise(function (resolve, reject) {
        if (typeof (string) != 'string') {
            return reject('Input must be a string');
        }
        const bounty = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012346789`~!@#$%^&*,._+-=';
        const doorway = {};
        let key = {};
        let salt = '';
        for (let i = crypt.length - 10; i < crypt.length; i++) {
            salt += crypt[i];
        }
        string = salt + string;
        let i = 0;
        let knife;
        for (let k = 0; k < bounty.length; k++) {
            if (salt[5] == bounty[k]) {
                knife = k;
            }
        }
        let jumble = '';
        let block = ''
        for (char in string) {
            doorway[i] = string[char];
            key[string[char]] = i;
            i++;
            knife = (knife / i) * bounty.length;
            while (knife > 64) {
                knife = Math.floor(knife * 0.57);
            }
        }
        for (item in key) {
            block += key[item];
            block += doorway[key[item]];
        }
        let k = 0;
        let l = 0;
        for (let j = 0; j < 64; j++) {
            if (k > block.length) {
                k = 0;
            }
            for (let m = 0; m < knife; m++) {
                l++;
                if (l > 64) {
                    l = 0;
                }

            }
            jumble += bounty[l];

            k++;
            if (k > block.length - 1) {
                k = 0;
            }

            knife += block.charCodeAt(k);

            while (knife > 64) {
                knife = Math.floor(knife / string.length);
            }

        }
        jumble += salt;
        return resolve(jumble);
    }),
    crypt: (string) => new Promise(function (resolve, reject) {
        if (typeof (string) != 'string') {
            return reject('Input must be a string');
        }
        const bounty = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012346789`~!@#$%^&*,._+-=';
        const doorway = {};
        let key = {};
        let salt = '';
        for (let i = 0; i < 10; i++) {
            salt += bounty[Math.floor(Math.random() * bounty.length)];
        }
        let rand = Math.floor((Math.random() * 2) + 1);
        if (rand > 1) {
            string = string + salt;
        } else {
            string = salt + string;
        }
        let i = 0;
        let knife;
        for (let k = 0; k < bounty.length; k++) {
            if (salt[5] == bounty[k]) {
                knife = k;
            }
        }
        let jumble = '';
        let block = '';
        for (char in string) {
            doorway[i] = string[char];
            key[string[char]] = i;
            i++;
            knife = (knife / i) * bounty.length;
            while (knife > 64) {
                knife = Math.floor(knife * 0.57);
            }
        }
        for (item in key) {
            block += key[item];
            block += doorway[key[item]];
        }
        let k = 0;
        let l = 0;
        for (let j = 0; j < 64; j++) {
            if (k > block.length) {
                k = 0;
            }
            for (let m = 0; m < knife; m++) {
                l++;
                if (l > 64) {
                    l = 0;
                }
            }
            jumble += bounty[l];
            k++;
            if (k > block.length - 1) {
                k = 0;
            }
            knife += block.charCodeAt(k);
            while (knife > 64) {
                knife = Math.floor(knife / string.length);
            }
        }
        jumble += salt;
        return resolve(jumble);
    }),
    verifyEmail: (string) => new Promise(function (resolve, reject) {
        let pre = false;
        let at = false;
        let between = false;
        let dot = false;
        let end = false;
        let post = true;
        let i = 0;
        while (pre == false && i < string.length) {
            if (string[i] != '@' && string[i] != ".") {
                pre = true;
            }
            i++;
        }
        while (at == false && i < string.length) {
            if (string[i] == '@') {
                at = true;
            }
            i++
        }
        while (between == false && i < string.length) {
            if (string[i] != '@' && string[i] != ".") {
                between = true;
            }
            i++;
        }
        while (dot == false && i < string.length) {
            if (string[i] == '.') {
                dot = true;
            }
            i++
        }
        while (end == false && i < string.length) {
            if (string[i] != '@' && string[i] != ".") {
                end = true;
            }
            i++;
        }
        while (i < string.length) {
            if (string[i] == '@' || string[i] == ".") {
                post = false;
            }
            i++
        }
        if (pre && at && between && dot && end && post) {
            return resolve(string);
        } else {
            return reject('Invalid Email');
        }
    })
}
const hestia = {
    MakeOneToOne: async function (rel, dir, relationships) {
        return new Promise(function (resolve, reject) {
            if (!relationships[rel.name]) {
                relationships[rel.name] = {
                    type: 'OneToOne',
                    obj1: rel.obj1.group,
                    obj2: rel.obj2.group
                }
            }
            relationships[rel.name][rel.obj1.id] = rel.obj2.id;
            relationships[rel.name][rel.obj2.id] = rel.obj1.id;
            fs.writeFile(dir + '/relationships.json', JSON.stringify(relationships, null, 4), 'utf8', function (err) {
                if (err) {
                    return reject(err);
                } else {
                    return resolve('success');
                }
            })
        })
    },
    MakeManyToOne: async function (rel, dir, relationships) {
        return new Promise(function (resolve, reject) {
            if (relationships[rel.name] == undefined) {
                relationships[rel.name] = {
                    type: 'ManyToOne',
                    obj1: rel.obj1.group,
                    obj2: rel.obj2.group
                }
            }
            relationships[rel.name][rel.obj1.id] = rel.obj2.id;
            fs.writeFile(dir + '/relationships.json', JSON.stringify(relationships, null, 4), 'utf8', function (err) {
                if (err) {
                    return reject(err);
                } else {
                    return resolve('success');
                }
            })
        })
    },
    MakeOneToMany: async function (rel, dir, relationships) {
        return new Promise(function (resolve, reject) {
            if (!relationships[rel.name]) {
                relationships[rel.name] = {
                    type: 'OneToMany',
                    obj1: rel.obj1.group,
                    obj2: rel.obj2.group
                }
            }
            if (!relationships[rel.name][rel.obj1.id]) {
                relationships[rel.name][rel.obj1.id] = {};
            }
            relationships[rel.name][rel.obj1.id][rel.obj2.id] = rel.obj2.id;
            fs.writeFile(dir + '/relationships.json', JSON.stringify(relationships, null, 4), 'utf8', function (err) {
                if (err) {
                    return reject(err);
                } else {
                    return resolve('success');
                }
            })
        })
    },
    MakeManyToMany: async function (rel, dir, relationships) {
        return new Promise(function (resolve, reject) {
            if (!relationships[rel.name]) {
                relationships[rel.name] = {
                    type: 'ManyToMany',
                    obj1: rel.obj1.group,
                    obj2: rel.obj2.group
                }
            }
            if (relationships[rel.name][rel.obj1.id] == undefined) {
                relationships[rel.name][rel.obj1.id] = {};
            }
            if (relationships[rel.name][rel.obj2.id] == undefined) {
                relationships[rel.name][rel.obj2.id] = {};
            }
            relationships[rel.name][rel.obj1.id][rel.obj2.id] = rel.obj2.id;
            relationships[rel.name][rel.obj2.id][rel.obj1.id] = rel.obj1.id;
            fs.writeFile(dir + '/relationships.json', JSON.stringify(relationships, null, 4), 'utf8', function (err) {
                if (err) {
                    return reject(err);
                } else {
                    return resolve('success');
                }
            })
        })
    },
    Delete: async function (rel, dir) {
        let relationships;
        if (fs.existsSync(dir + "/relationships.json")) {
            relationships = JSON.parse(fs.readFileSync(location + "/relationships.json"));
        } else {
            relationships = false;
        }
        return new Promise(function (resolve, reject) {
            if (!relationships) {
                return reject("Cannot find relationship");
            }
            if (relationships[rel.name]) {
                if (relationships[rel.name].type == "OneToOne") {
                    if (rel.type != "OneToOne") {
                        return reject("Relationship type does not match.  Must be 'OneToOne'")
                    } else {
                        delete relationships[rel.name][obj1.id];
                        delete relationships[rel.name][obj2.id];
                    }
                }
                if (relationships[rel.name].type == "OneToMany") {
                    if (rel.type != "OneToMany") {
                        return reject("Relationship type does not match. Must be 'OneToMany'");
                    } else {
                        delete relationships[rel.name][obj1.id][obj2.id];
                    }
                }
                if (relationships[rel.name].type == "ManyToMany") {
                    if (rel.type != "ManyToMany") {
                        return reject("Relationships type does not match.  Must be 'ManyToMany'");
                    } else {
                        delete relationships[rel.name][obj1.id][obj2.id];
                        delete relationships[rel.name][obj1.id][obj2.id];
                    }
                }
            }
            fs.writeFile(location + '/relationships.json', JSON.stringify(relationships, null, 4), 'utf8', function (err) {
                if (err) {
                    return reject(err);
                } else {
                    return resolve('success');
                }
            });
        })
    },
    Get: async function (rel, dir) {
        let relationships;
        if (fs.existsSync(dir + "/relationships.json")) {
            relationships = JSON.parse(fs.readFileSync(location + "/relationships.json"));
        } else {
            relationships = false;
        }
        return new Promise(function (resolve, reject) {
            if (!relationships) {
                return reject('cannot find relationship');
            }
            return resolve(relationships[rel.name]);
        });
    },
    Joining: async function (obj, factor, dir) {
        let relationships;
        if (fs.existsSync(dir + "/relationships.json")) {
            relationships = (JSON.parse(fs.readFileSync(dir + "/relationships.json")));
        } else {
            relationships = false;
        }
        if (!relationships) {
            return obj;
        }
        for (key in relationships) {
            let current = relationships[key];
            if (current.type == "OneToMany" && current.obj1 == obj.group && (current[obj.id] != undefined)) {
                let group = JSON.parse(fs.readFileSync(dir + "/library/" + current.obj2 + ".json"));
                for (i in current[obj.id]) {
                    let tempObj = group[current[obj.id][i]]
                    if (factor > 0) {
                        tempObj = await this.Joining(tempObj, factor - 1, dir)
                    }
                    if (!obj[key]) {
                        obj[key] = {};
                    }
                    obj[key][tempObj.id] = tempObj;
                }
            }
            if ((current.type == "ManyToOne") && (current.obj1 == obj.group) && (current[obj.id] != undefined)) {
                let group = JSON.parse(fs.readFileSync(dir + "/library/" + current.obj2 + ".json"));
                let tempObj = group[current[obj.id]]
                if (factor > 0) {
                    tempObj = await this.Joining(tempObj, factor - 1, dir)
                        .then(data => { return data })
                        .catch(console.log);
                }
                if (!obj[key]) {
                    obj[key] = {};
                }
                obj[key] = tempObj;
            }
            if (current.type == "OneToOne" && current.obj1 == obj.group && current[obj.id]) {
                let group = JSON.parse(fs.readFileSync(dir + "/library/" + current.obj2 + ".json"));
                let tempObj = group[current[obj.id]]
                if (factor > 0) {
                    tempObj = await this.Joining(tempObj, factor - 1, dir)
                        .then(data => { return data })
                        .catch(console.log);
                }
                if (!obj[key]) {
                    obj[key] = {};
                }
                obj[key][tempObj.id] = tempObj;
            }
            if (current.type == "ManyToMany" && current.obj1 == obj.group && current[obj.id]) {
                let group = JSON.parse(fs.readFileSync(dir + "/library/" + current.obj2 + ".json"));
                for (i in current[obj.id]) {
                    let tempObj = group[current[obj.id][i]]
                    if (factor > 0) {
                        tempObj = await this.Joining(tempObj, factor - 1, dir)
                    }
                    if (!obj[key]) {
                        obj[key] = {};
                    }
                    obj[key][tempObj.id] = tempObj;
                }
            }
        }
        return obj;
    },
    Validate: async function (object, parameter, dir, type) {
        let relationships;
        if (fs.existsSync(dir + "/relationships.json")) {
            relationships = JSON.parse(fs.readFileSync(dir + "/relationships.json"));
        } else {
            relationships = {};
        }
        if (type == "OneToOne") {
            let rel = {
                name: parameter,
                obj1: object,
                obj2: object[parameter]
            }
            this.MakeOneToOne(rel, dir, relationships)
                .then(data => { return data })
                .catch(err => { return err });
        }
        if (type == "OneToMany") {
            let errors = [];
            let result = [];
            for (key in object[parameter]) {
                let rel = {
                    name: parameter + '_of',
                    obj1: object,
                    obj2: object[parameter][key],
                    secret: "OneToMany"
                }
                await this.MakeOneToMany(rel, dir, relationships)
                    .then(data => { result.push(data) })
                    .catch(err => { errors.push(err) });
                let rel2 = {
                    name: parameter,
                    obj1: object[parameter],
                    obj2: object
                }
                await this.MakeManyToOne(rel2, dir, relationships)
                    .then(data => { result.push(data) })
                    .catch(err => { errors.push(err) })
            }
            return { data: result, errors: errors }
        }
        if (type == "ManyToOne") {
            let result = [];
            let errors = [];
            const rel = {
                name: parameter + '_of',
                obj1: object[parameter],
                obj2: object,
            }
            const rel2 = {
                name: parameter,
                obj1: object,
                obj2: object[parameter]
            }
            await this.MakeOneToMany(rel, dir, relationships)
                .then(data => {
                    result.push(data)
                    this.MakeManyToOne(rel2, dir, relationships)
                        .then(data => { result.push(data) })
                        .catch(err => { errors.push(err) })
                })
                .catch(err => { errors.push(err) });
            return { data: result, errors: errors }
        }
        if (type == "ManyToMany") {
            for (key in object[parameter]) {
                let rel = {
                    name: parameter,
                    obj1: object,
                    obj2: object[parameter][key]
                }
                await this.MakeManyToMany(rel, dir, relationships)
                    .then(data => {
                        return data
                    })
                    .catch(err => { return err });
            }
        }
    }
}
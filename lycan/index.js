const fs = require('fs');
let curator;
const auto = true;
module.exports = {
    session: (key, value) => {

    },
    locale: false,
    local: (location, models) => {
        this.locale = location;
        // if (!fs.existsSync(this.locale + '/nodemon.json')) {
        //     let nodemon = {ignore: ["./"]};
        //     fs.writeFileSync(this.locale + '/nodemon.json', JSON.stringify(nodemon, null, 4), 'utf8', function (err) {
        //         if (err) {
        //             reject(err);
        //         }
        //     });
        // }
        return new Promise(function (resolve, reject) {
            if (fs.existsSync(location + '/curator.json')) {
                curator = JSON.parse(fs.readFileSync(location + "/curator.json"));
            } else {
                curator = {
                    version: '0',
                    relationships: {},
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
                    reject(err);
                }
            })
            resolve("success");
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
                reject(errors);
            } else {
                object.id = curator[groupName].tally;
                object.Group = groupName;
                curator[groupName].tally++;
                group[object.id] = object;
                fs.writeFileSync(dir + '/library/' + groupName + ".json", JSON.stringify(group, null, 4), 'utf8', function (err) {
                    if (err) {
                        reject(err);
                    }
                });
                fs.writeFile(dir + '/curator.json', JSON.stringify(curator, null, 4), 'utf8', function (err) {
                    if (err) {
                        reject(err);
                    }
                });
            }
            resolve(object);
        })
    },
    GetGroup: (group) => {
        const dir = this.locale;
        return new Promise(function (resolve, reject) {
            curator = fetchCurator(dir);
            if (fs.existsSync(dir + "/library/" + group + ".json")) {
                resolve(JSON.parse(fs.readFileSync(dir + "/library/" + group + ".json")));
            } else {
                reject({ message: "Group " + group + " does not exist", fail: true });
            }
        })
    },
    Relationship: (relationship, object1, object2) => {
        const dir = this.locale;
        return new Promise(function (resolve, reject) {
            let rel;
            let errors = {};
            if (curator.relationships[relationship]) {
                rel = curator.relationships[relationship];
            } else {
                throw "Invalid relationship";
            }
            if (object1.Group != rel.object1) {
                errors.object1Type = "object1 is of incorrect type for relationship of " + relationship;
            }
            if (object2.Group != rel.object2) {
                errors.object2Type = "object2 is of incorrect type for relationship of " + relationship;
            }
            if (Object.keys(errors).length > 0) {
                reject(errors);
            }
            if (rel.type == "oneToOne") {
                object1[relationship] = object2;
                object2[relationship] = object1;
                let object1Group = JSON.parse(fs.readFileSync(dir + "/library/" + object1.group + '.json'));
                object1Group[object1.id] = object1;
                fs.writeFileSync(dir + '/library/' + object1.group + ".json", JSON.stringify(object1Group, null, 4), 'utf8', function (err) {
                    if (err) {
                        reject(err);
                    }
                });
                let object2Group = JSON.parse(fs.readFileSync(dir + "/library/" + object2.group + '.json'));
                object2Group[object2.id] = object2;
                fs.writeFileSync(dir + '/library/' + object2.group + ".json", JSON.stringify(object2Group, null, 4), 'utf8', function (err) {
                    if (err) {
                        reject(err);
                    }
                });
                fs.writeFile(dir + '/curator.json', JSON.stringify(curator, null, 4), 'utf8', function (err) {
                    if (err) {
                        reject(err);
                    }
                });
                resolve([object1, object2]);
            }
        })
    },
    Delete: (object) => {
        const dir = this.locale;
        return new Promise(function (resolve, reject) {
            let group;
            if (fs.existsSync(dir + "/library/" + object.Group + '.json')) {
                group = JSON.parse(fs.readFileSync(dir + "/library/" + object.Group + '.json'));
                if (group[object.id]) {
                    delete group[object.id];
                    fs.writeFileSync(dir + '/library/' + object.Group + ".json", JSON.stringify(group, null, 4), 'utf8', function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve('success');
                        }
                    });
                } else {
                    reject(['Object does not exist within specified group']);
                }
            } else {
                reject(['Cannot Delete Group does not exist']);
            }
        })
    },
    Update: async (object) => {
        let errors = {};
        const dir = this.locale;
        const model = curator[object.group];
        await runValidations(model, object, this.locale)
            .then(obj => {
                object = obj;
            })
            .catch(err => {
                for (error in err) {
                    errors[error] = err[error];
                }
            });
        return new Promise(function (resolve, reject) {
            if (Object.keys(errors).length > 0) {
                reject(errors);
            }
            let group;
            if (fs.existsSync(dir + "/library/" + object.Group + '.json')) {
                group = JSON.parse(fs.readFileSync(dir + "/library/" + object.Group + '.json'));
                if (group[object.id]) {
                    group[object.id] = object;

                    fs.writeFileSync(dir + '/library/' + object.Group + ".json", JSON.stringify(group, null, 4), 'utf8', function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve('success');
                        }
                    });
                } else {
                    reject(['Object does not exist within specified group']);
                }
            } else {
                reject(['Group does not exist']);
            }
        })
    },
    GetById: async (group, id) => {
        const dir = this.locale;
        return new Promise(function (resolve, reject) {
            if (fs.existsSync(dir + "/library/" + group + '.json')) {
                group = JSON.parse(fs.readFileSync(dir + "/library/" + group + '.json'));
                if (group[id]) {
                    resolve(group[id]);
                } else {
                    reject("Cannot find object by id requested");
                }
            } else {
                reject(["Cannot get by id Group does not exist"]);
            }
        })
    },
    Reveal: async (crypted, string) => {
        return new Promise(function (resolve, reject) {
            jana.revealB(crypted, string)
                .then(data => {
                    if (data == crypted) {
                        resolve(true)
                    } else {
                        jana.revealF(crypted, string)
                            .then(data => {
                                if (data == crypted) {
                                    resolve(true);
                                } else { resolve(false) }
                            })
                            .catch(err => reject(err))
                    }
                })
                .catch(err => reject(err))
        })
    },
    GetByKey: (groupName, parameter, value, first) => {
        const dir = this.locale;
        return new Promise(function (resolve, reject) {
            let array = [];
            let errors = {};
            curator = fetchCurator(dir);
            const model = curator[groupName];
            if (model[parameter]) {
                console.log("GROUP: ", groupName)
                const group = JSON.parse(fs.readFileSync(dir + '/library/' + groupName + '.json'))
                for (object in group) {
                    let current = group[object];
                    if (current[parameter] == value) {
                        array.push(current);
                        if (first) {
                            resolve(current);
                        }
                    }
                }
                resolve(array);
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
                    resolve(sessions[id])
                } else {
                    sessions[id] = {};
                }
                resolve(sessions[id]);
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
                        reject(err);
                    }
                });
                resolve(sessions[id]);
            })
        }
    }
}

function Model(object) {
    const Master = {
        total: Number,
        parameter: {
            type: String,
            typeError: String,
            required: Boolean,
            requiredError: String,
            min: Number,
            minError: String,
            max: Number,
            maxError: String,
            unique: Boolean,
            uniqueError: String
        },
    }
    const relationship = {
        name: String,
        type: String,
        group: String,
    }
}

function verifyRelationship(rel, model) {
    const types = {
        oneToOne: true,
        manyToMany: true,
        manyToOne: true,
        oneToMany: true
    }
    let errors = {};
    if (!rel.name) {
        errors.relName = "Relationship name is required.";
    }
    if (!rel.group) {
        errors.relGroup = "Relationship group is required.";
    }
    if (!rel.type) {
        errors.relType = "Relationship type is required.";
    }
    if (!types[rel.type]) {
        errors.relNoType("Relationship of " + rel.type + " is not valid.  Viable types are oneToOne, oneToMany, manyToOne or manyToMany");
    }
    if (curator.relationships[rel.name]) {
        errors.alreadyExist = 'Relationship with name ' + rel.name + ' already exists.';
    }
    if (Object.keys(errors).length > 0) {
        throw errors;
    }
    if (rel.type == 'oneToOne') {
        if (!curator.relationships[rel.name]) {
            curator.relationships[rel.name] = {
                name: rel.name,
                type: "oneToOne",
                group1: model.name,
                group2: rel.group
            }
            return "SUCCESS: One to One relationship " + model.name + " to " + rel.group + " is ready for use as " + rel.name + ".";
        }
    }
    if (rel.type == 'oneToMany') {
        if (!curator.relationships[rel.name]) {
            curator.relationships[rel.name] = {
                name: rel.name,
                type: "oneToMany",
                group1: model.name,
                group2: rel.group
            }
            return "SUCCESS: Many to One relationship " + model.name + " to " + rel.group + " is ready for use as " + rel.name + ".";
        }
    }
    if (rel.type == 'manyToMany') {
        if (!curator.relationships[rel.name]) {
            curator.relationships[rel.name] = {
                name: rel.name,
                type: "oneToMany",
                group1: model.name,
                group2: rel.group
            }
            return "SUCCESS: Many to One relationship " + model.name + " to " + rel.group + " is ready for use as " + rel.name + ".";
        }
    }
    fs.writeFile(this.locale + '/curator.json', JSON.stringify(curator, null, 4), 'utf8', function (err) {
        if (err) {
            throw err;
        }
    })
}

function fetchCurator(loc) {
    return JSON.parse(fs.readFileSync(loc + "/curator.json"));
}

function runValidations(model, object, dir) {
    return new Promise(async function (resolve, reject) {
        let errors = {};
        for (key in object) {
            if (!model[key] && key != 'group') {
                errors['parameter'] = key + ' is not a valid parameter.';
            }
        }
        for (parameter in model) {
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
                        if (model[parameter].typeError) {
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
                    let group = JSON.parse(fs.readFileSync(dir + "/library/" + object.group + '.json'));
                    for (key in group) {
                        if (group[key][parameter] == object[parameter]) {
                            if (model[parameter].uniqueError) {
                                errors[parameter + 'Unique'] = model[parameter].uniqueError;
                            } else {
                                errors[parameter + 'Unique'] = 'Parameter' + parameter + 'must be unique.';
                            }
                        }
                    }
                }
                if (model[parameter].crypt) {
                    await jana.crypt(object[parameter])
                        .then(data => {
                            object[parameter] = data;
                        })
                        .catch(err => errors[parameter + 'Crypt'] = err)
                }
            }
        }
        if (Object.keys(errors).length > 0) {
            reject(errors)
        } else {
            resolve(object);
        }
    })
}
const jana = {
    revealF: (crypt, string) => new Promise(function (resolve, reject) {
        if (typeof (string) != 'string') {
            reject('Input must be a string');
        }
        const bounty = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012346789`~!@#$%^&*,._+-=';
        const doorway = {};
        let key = {};
        let salt = '';
        for (let i = crypt.length - 10; i < crypt.length; i++) {
            salt += crypt[i];
        }
        let rand = Math.floor(Math.random() * 2);
        string = string + salt;
        let i = 0;
        let knife = string.length;
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
        resolve(jumble);
    }),
    revealB: (crypt, string) => new Promise(function (resolve, reject) {
        if (typeof (string) != 'string') {
            reject('Input must be a string');
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
        let knife = string.length;
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
        resolve(jumble);
    }),
    crypt: (string) => new Promise(function (resolve, reject) {
        if (typeof (string) != 'string') {
            reject('Input must be a string');
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
            string = salt + string
        }
        let i = 0;
        let knife = string.length;
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
        resolve(jumble);
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
            resolve(string);
        } else {
            reject('Invalid Email');
        }
    })
}
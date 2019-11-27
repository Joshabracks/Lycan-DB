**lycan-db**

Lycan is an object oriented JSON database.

**Python version is in development and requires testing**

**NODE.js Version is tested and functional**
**THE FOLLOWING DOCUMENTATION IS FOR NODE.JS.  PYTHON DOCUMENTATION HAS NOT BEEN ADDED, HOWEVER ALL FUNCTIONS TAKE THE SAME ARGUMENTS.** 

```
//Inside your controller file
const lycan = require('lycan-db');
lycan.local('../db');
```

**LATEST PATCH**
Formatting fixes for relationship functions.

When you startup your server, lycan will create a database folder with the following contents:
**curator.json**
/library

**GROUPS**: Object models are created via the curator file as JSON objects and are referred to as 'group'.  Creating a group is as simple as adding the group to the curator file as the name of the group you wish to add.  NOTE: Relationships are handled within the curator file under the "relationships" key and the lycan version is handled via the "version" key.  Overwriting these keys can cause errors.  Any other key name may be used a group model;

**MODEL PARAMETERS**: Within a model is a list of parameters.  A parameter is stored within the MODEL object as another JSON object and contains validations for that specific type of parameter.  (note: an empty parameter object will run without validations and, therefore, will always be accepted no matter what the content being passed to it is.)

**PARAMETER VALIDATIONS**: Within the parameter object, the user may store variables that serve as validators for the specific parameter when it is being passed.  Accepted validation variables are as follows:

**type**: Verifies if the parameter passed matches the type set within the variable. If this variable is set and a value is passed that does not match typeof() the entire object will be rejected with an error.  SPECIAL CASE: if the type is set to "email" lycan will verify if it is a valid email string.  **Relationships:** type: "ManyToMany", "OneToMany", "ManyToOne" or "OneToOne" will create a relationship. (See "Relationships below").

**min**: REQUIRES TYPE TO BE SET TO STRING OR NUMBER - If type is set to "string" min will verify that the length of the string is not less than the min variable given or return an error.  If type is set to "number" min will verify that the value of the number is no less than the variable given or return an error.

**max**: REQUIRES TYPE TO BE SET TO STRING OR NUMBER - If type is set to "string" max will verify that the length of the string is not more than the max variable given or return an error.  If type is set to "number" max will verify that the value of the number is no more than the variable given or return an error.

**required**: If "required" is set to true the object will be rejected with an error if the parameter is not included.

**unique**: If "unique" is set to true, the object will be rejected with an error if any other objects exist within that group that have the same parameter with an identical value.

**ERRORS**: If no error message is included for a parameter, Lycan will return a generic error message.  To set a unique error message, an additional variable may be passed within with parameter with a name of "<parameter>Error" as listed below.

typeError, uniqueError, maxError, minError, requiredError

**CRYPT**: An additional variable "crypt" may be passed within the parameter variables.  When a "string" is passed with "crypt" set to true, the parameter will be saved as a hashed value.

**curator.json**

```
{
    "version": 0,
    "relationships": {},
    "user": {
        "name": {
            "required": true,
            "requiredError": "User Name is required",
            "type": "string",
            "min": 3,
            "minError": "User Name must be at least 3 characters long",
            "max": 40,
            "maxError": "User Name cannot be more than 40 characters in length",
            "unique": true,
            "uniqueError": "User Name is already in use"
        },
        "email": {
            "required": true,
            "requiredError": "Email is required",
            "type": "email",
            "typeError": "Invalid Email",
            "unique": true,
            "uniqueError": "Email is already in use"
        },
        "password": {
            "required": true,
            "requiredError": "A password is required",
            "type": "string",
            "crypt": true
        },
        "status": {
            "required": true,
            "type": "string"
        }
    }
}
```

**ID**: Ids are automatically handled by lycan.  Within each group, a numerical id will be given to each new object that can be accessed as the .id variable.  If you wish to add your own id variable, you can overwrite the lycan id after the object has been created.  However, if you attempt to pass an id variable on object creation, it will be overwritten with lycan's id.

**ADDING A NEW OBJECT**:

lycan.Add(groupName, object)
Adding a new object to a group can be done with the Add() method. This method requires the name of the group that you're adding to and the object that you're adding.  :: lycan.Add(groupName, object) :: these are taken as a string and an object, respectively.  Add will run all validations and save the new object within the group file under "/library/<group name>.json" where it can be easily accessed and even changed by the developer.  Add returns a promise.  If there are no errors, the object will be returned as is saved within the database, otherwise, it will reject with an object containing errors.

**UPDATING AN OBJECT**:

lycan.Update(object)
Updating an existing object can be done with the Update() method.  This method requires the object that you wish to update complete with all parameters (including auto-generated parameters) in tact.  Lycan will run validations on all parameters passed and update any changed parameters within the database.  Update returns a promise.  If there are no errors, the object will be returned, otherwise, it will reject with an object containing errors.

**FINDING OBJECTS**:

lycan.GetById(groupName, id, factor)
Takes in a groupName "string" and id "number" and returns a Promise.  If there are no errors, an object will be returned, otherwise an object with errors will be returned.  Additionally, a factor "number" may be passed.  If a factor greater than 0 is passed, the object will return with additional relationships joined to its relationships parameters.  WARNING: Passing a high level factor can return a very large object, especially if the object contains "OneToOne" relationships.  

lycan.GetByKey(groupName, parameter, value, first, factor)
Takes in a groupName: "string", parameter: "string", value: "any", first: boolean and returns a Promise.  If there are no errors and "first" is true, the first matching object will be returned.  If there are no errors and "first" is false or not provided, an array of all objects that match the parameter: value given will be returned. Otherwise, an object with errors will be returned.  Additionally, a factor "number" may be passed.  If a factor greater than 0 is passed, the object will return with additional relationships joined to its relationships parameters.  WARNING: Passing a high level factor can return a very large object, especially if the object contains "OneToOne" relationships.  

lycan.GetGroup(groupName)
Takes in a groupName: "string" and returns a Promise.  If there are no errors, an object containing all objects within the group will be returned, otherwise, an object with errors will be returned.  (note: GetGroup currently does not support "factor" joining)

**DELETE AN OBJECT**

lycan.Delete(object)
Takes in an object and returns a Promise.  If the object is found within the Lycan database, it is removed and a message 'success' is returned.  Otherwise, an object with errors is returned.

**COMPARE HASHED "crypt" PARAMETERS**

lycan.Reveal(crypted, string)
Compares a "crypt": parameter with a string and returns a Promise.  If the string is a match, will return true otherwise, it will return false.

**RELATIONSHIPS**
The model validation "type" accepts "ManyToMany", "OneToMany", "ManyToOne" and "OneToOne" and requires an additional "group" validation within the same parameter in order to function correctly.

Deleting relationships is not yet complete.  In order ot remove a relationships, a "false" boolean must be passed in the place of an existing relationship.

curator.json
```
"user": {
    "message": {
        type: "OneToMany",
        group: "message"
    }
}
```

**SESSION STORAGE**

WARNING: Session storage is still in construction and does not delete expired sessions.

lycan.session.write(id, body)
Takes in a session id (express: req.session.id) and an object and returns a promise.  If the session id exists, values within the existing object will be overwritten and the object will be returned.  Any existing values that existed within the object that were not overwritten will be returned as well.

lycan.session.read(id)
Takes in a session id (express: req.session.id) and returns a promise.  If an object is stored within that session id, it is returned.  If no id exists, an error is returned.

**ALTERNATE MODEL SYSTEMS**:

When setting lycan.local() a second argument may be passed through as a javascript object that contains objects formatted as lycan models.  When this is done, Lycan will update the curator file with any models provided so long as each object at very least has a "group" parameter.  This can allow for a separate models folder where each model is held in a separate file, rather than only in the curator.json file, allowing for models to be set up as .js, .json, .yaml or other file types just so long as they can be converted into javascript objects.

This type of setup using js files would look similar to the following:

user.js
```
module.exports = {
const model: {
        group: "user",
        name: {
            type: "string",
            min: 5,
            max: 20,
            required: true
        }
    }
}
```
**controller.js**
```
const lycan = require('../lycan/lycan');
let models = {};
fs.readdirSync('./server/models').forEach((file => {
  let model = require('../models/' + file).model;
  models[model.group] = model;
}))
lycan.local('../db', models);
```

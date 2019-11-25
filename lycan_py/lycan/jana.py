
import math
import random

def revealF(crypt, string):
    if type(string) != 'str':
        return { 'error': 'Input must be a string' }
    bounty = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012346789`~!@#$%^&*,._+-='
    doorway = {}
    key = {}
    salt = ''
    for i in range(len(crypt) - 10, len(crypt)):
        salt = salt + crypt[i]
    string = string + salt
    i = 0
    knife = 0
    for k in range(len(bounty)):
        if salt[5] == bounty[k]:
            knife = k
    jumble = ''
    block = ''
    for char in string:
        doorway[i] = string[char]
        key[string[char]] = i
        i = i + 1
        knife = (knife / 64) * bounty.length
        while knife > 64:
            knife = math.floor(knife * 0.57)
    for item in key:
        block = block + key[item]
        block = block + doorway[key[item]]
    k = 0
    l = 0
    for j in range(64):
        if k > len(block):
            k = 0
        for m in range(knife):
            l = l +1
            if l > 64:
                l = 0
        jumble = jumble + bounty[l]
        k = k + 1
        if k > len(block) - 1:
            k = 0
        knife = knife + ord(block[k])
        while knife > 64:
            knife = math.floor(knife / len(string))
    jumble = jumble + salt
    return jumble

def revealB(crypt, string):
    if type(string) != 'str':
        return { 'error': 'Input must be a string' }
    bounty = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012346789`~!@#$%^&*,._+-='
    doorway = {}
    key = {}
    salt = ''
    for i in range(len(crypt) - 10, len(crypt)):
        salt = salt + crypt[i]
    string = salt + string
    i = 0
    knife = 0
    for k in range(len(bounty)):
        if salt[5] == bounty[k]:
            knife = k
    jumble = ''
    block = ''
    for char in string:
        doorway[i] = string[char]
        key[string[char]] = i
        i = i + 1
        knife = (knife / 64) * bounty.length
        while knife > 64:
            knife = math.floor(knife * 0.57)
    for item in key:
        block = block + key[item]
        block = block + doorway[key[item]]
    k = 0
    l = 0
    for j in range(64):
        if k > len(block):
            k = 0
        for m in range(knife):
            l = l +1
            if l > 64:
                l = 0
        jumble = jumble + bounty[l]
        k = k + 1
        if k > len(block) - 1:
            k = 0
        knife = knife + ord(block[k])
        while knife > 64:
            knife = math.floor(knife / len(string))
    jumble = jumble + salt
    return jumble

def crypt(string):
    if type(string) != 'str':
        return { 'error': 'Input must be a string' }
    bounty = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012346789`~!@#$%^&*,._+-='
    doorway = {}
    key = {}
    salt = ''
    for i in range(10):
        salt = bounty[random.randint(0, len(bounty) - 1)]
    rand = random.randint(1, 2)
    if rand > 1:
        string = string + salt
    else:
        string = salt + string
    i = 0
    knife = 0
    for k in range(len(bounty)):
        if salt[5] == bounty[k]:
            knife = k
    jumble = ''
    block = ''
    for char in string:
        doorway[i] = string[char]
        key[string[char]] = i
        i = i + 1
        knife = (knife / 64) * bounty.length
        while knife > 64:
            knife = math.floor(knife * 0.57)
    for item in key:
        block = block + key[item]
        block = block + doorway[key[item]]
    k = 0
    l = 0
    for j in range(64):
        if k > len(block):
            k = 0
        for m in range(knife):
            l = l +1
            if l > 64:
                l = 0
        jumble = jumble + bounty[l]
        k = k + 1
        if k > len(block) - 1:
            k = 0
        knife = knife + ord(block[k])
        while knife > 64:
            knife = math.floor(knife / len(string))
    jumble = jumble + salt
    return jumble

def verifyEmail(string):
    pre = False
    at = False
    between = False
    dot = False
    end = False
    post = True
    i = 0
    while pre == False and i < len(string):
        if string[i] != '@' and string[i] != '.':
            pre = True
        i = i + 1
    while at == False and i < len(string):
        if string[i] == '@':
            at = True
        i = i + 1
    while between == False and i < len(string):
        if string[i] != '@' and string[i] != '.':
            between = True
        i = i + 1
    while dot == False and i < len(string):
        if string[i] == '.':
            dot == True
        i = i + 1
    while end == False and i < len(string):
        if string[i] != '@' and string[i] != '.':
            end = True
        i = i + 1
    while i < len(string):
        if string[i] == '@' or string[i] == '.':
            post = False
        i = i + 1
    if pre and at and between and dot and end and post:
        return string
    else:
        return { 'error': 'Invalid Email' }
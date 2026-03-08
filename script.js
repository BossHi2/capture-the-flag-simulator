const inputNeurons = ["xPos", "yPos", "SNE", "xDNE","yDNE", "xDNT", "yDNT", "Str"]
const internalNeurons = ["N1", "N2"]
const outputNeurons = ["moveX", "moveY"]

const width = document.getElementsByClassName("game-board")[0].getBoundingClientRect().width
const height = document.getElementsByClassName("game-board")[0].getBoundingClientRect().height

const players = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]



const possibleGenomes = "abcdef0123456789"

const numOfGenesForOrganism = 30

var blueScore = 0
var redScore = 0

var currGameLength = 0
var totalGameLength = 1500 //15 seconds
var mutationRate = 1 //random number btwn 1 and 10, if the number is less than or equal to mutationRate, it mutates

document.getElementById("red-flag").style.backgroundColor = "rgba(255, 0, 0, 0.5)"
document.getElementById("red-flag").style.left = ((window.innerWidth - width)/2) - 20 + "px"

document.getElementById("blue-flag").style.backgroundColor = "rgba(0, 0, 255, 0.5)"
document.getElementById("blue-flag").style.left = ((window.innerWidth - width)/2 + width) + "px"

const spawnPoints = {
    red: {
        0:[100, 0],
        1: [100, 50],
        2: [100, 100],
        3: [100, 150], //left = 100px, top = 150px]
        4: [100, 200],
        5: [100, 250],
        6: [100, 300],
        7: [100, 350],
        8: [100, 400],
        9: [100, 450],
    },
    blue: {
        0:[700, 0],
        1: [700, 50],
        2: [700, 100],
        3: [700, 150], //left = 700px, top = 150px]
        4: [700, 200],
        5: [700, 250],
        6: [700, 300],
        7: [700, 350],
        8: [700, 400],
        9: [700, 450],
    }
}



class Player{
    strength
    isAlive
    isFighting
    collidingPlayerInfo //[id, object]
    id
    left

    geneHex
    geneBinary

    flagsCaptured = 0//number of flags this object has captured


    xPosition //from top left
    yPosition //from top left


    hasFlag //true = have flag, false = doesn't have flag

    neurons = new Map()
    allNeurons = [];

    isBlue // true if on the blue team, false if on the red team

    isInvincible = false
    ticksSinceRespawned = 0


    collidingTickCounter = 0 //100 ticks = 1 second
    collidingEnemyIndex = -1 //if the player is in a fight, this will store the index of the enemy

    constructor(s, i, hex, is){
        this.isFighting = false
        this.isAlive = false
        this.strength = s
        this.id = i
        this.geneHex = hex
        this.isBlue = is
        this.geneBinary = this.hexToBinary(this.geneHex)
        this.xPosition = document.getElementById(this.id).getBoundingClientRect().left
        this.yPosition = document.getElementById(this.id).getBoundingClientRect().top

        this.hasFlag = false

        if(this.isBlue)
            document.getElementById(this.id).classList.add("blue")
        else
            document.getElementById(this.id).classList.add("red")

        this.readGene()
    }

    hexToBinary(hex) {
        return hex  
            .split('')
            .map(d => parseInt(d, 16).toString(2).padStart(4,'0'))
            .join('')
    }

    readGene(){
        for(var i = 0; i<this.geneBinary.length; i+= 32){
            var weightVal = new Int16Array([parseInt(this.geneBinary.substring(i+16, i+32))])[0]/10000
            var tempNeurons = []

            if(parseInt(this.geneBinary.substring(i, i+1)) == 0){
                var output = this.findNeuron(inputNeurons[parseInt(this.geneBinary.substring(i+1, i+8), 2)%inputNeurons.length])
                if(output[0] == false){
                    var x = new InputNeuron(inputNeurons[parseInt(this.geneBinary.substring(i+1, i+8), 2)%inputNeurons.length], this, weightVal)
                    tempNeurons[0] = x
                    this.allNeurons.push(x)
                } else{
                    tempNeurons[0] = this.allNeurons[output[1]]
                }
            }else{
               var output = this.findNeuron(inputNeurons[parseInt(this.geneBinary.substring(i+1, i+8), 2)%inputNeurons.length])
                if(output[0] == false){
                    var x = new InputNeuron(inputNeurons[parseInt(this.geneBinary.substring(i+1, i+8), 2)%inputNeurons.length], this, weightVal)
                    tempNeurons[0] = x
                    this.allNeurons.push(x)
                } else{
                    tempNeurons[0] = this.allNeurons[output[1]]
                }

            }

            if(parseInt(this.geneBinary.substring(i + 8, i+9)) == 0){
                var output3 = this.findNeuron(outputNeurons[parseInt(this.geneBinary.substring(i+9,i+16), 2)%outputNeurons.length])
                if(output3[0] == false){
                    var x3 = new OutputNeuron(outputNeurons[parseInt(this.geneBinary.substring(i+9,i+16), 2)%outputNeurons.length],this)
                    tempNeurons[1] = x3
                    this.allNeurons.push(x3)
                } else{
                    tempNeurons[1] = this.allNeurons[output3[1]]
                }
                
            }
                
            else{
                var output4 = this.findNeuron(internalNeurons[parseInt(this.geneBinary.substring(i+9,i+16), 2)%internalNeurons.length])

                if(output4[0] == false){
                    var x4 = new InternalNeuron(internalNeurons[parseInt(this.geneBinary.substring(i+9,i+16), 2)%internalNeurons.length])
                    tempNeurons[1] = x4
                    this.allNeurons.push(x4)
                } else{
                    tempNeurons[1] = this.allNeurons[output4[1]]
                }
            }
                
            
            this.neurons.set(tempNeurons[0], tempNeurons[1])
        }

    }


    findNeuron(n){
        for(var i = 0; i<this.allNeurons.length; i++){
            if(this.allNeurons[i].name == n)
                return [true, i]
        }
        return [false, -1]
    }

    doAction(){
        this.ticksSinceRespawned++
        if(this.ticksSinceRespawned <= 50)
            this.isInvincible = true
        else
            this.isInvincible = false
        this.updateHasFlag()
        for(const[key, value] of this.neurons){
                if(key instanceof InternalNeuron){
                    key.sum = 0
                } if(value instanceof InternalNeuron || value instanceof OutputNeuron){
                    value.sum = 0
                }
            }


            for(const[key, value] of this.neurons){
                if(key instanceof InputNeuron)
                    key.calculateValue()
            }
            for(const[key, value] of this.neurons){
                if(key instanceof InputNeuron)
                    value.sum += key.data * key.connectionWeight
            }
            for(const[key, value] of this.neurons){
                if(key instanceof InternalNeuron)
                    key.sum = Math.tanh(key.sum)
                else if(value instanceof InternalNeuron){
                    value.sum = Math.tanh(value.sum)
                }
            }

            for(const[key, value] of this.neurons){
                if(value instanceof OutputNeuron && key instanceof InputNeuron){
                    value.sum += key.data * key.connectionWeight
                } else if(value instanceof OutputNeuron && key instanceof InternalNeuron){
                    value.sum += key.sum
                }
            }
        if(this.hasFlag){
            if(this.findOverlap()){
                if(this.collidingEnemyIndex != -1)
                    this.fighting()
            } else{
                if(this.isBlue){
                document.getElementById(this.id).style.left = (Number.parseInt(window.getComputedStyle(document.getElementById(this.id)).left.substring(0, window.getComputedStyle(document.getElementById(this.id)).left.indexOf("px"))) + 3) + "px"
                } else{
                    document.getElementById(this.id).style.left = (Number.parseInt(window.getComputedStyle(document.getElementById(this.id)).left.substring(0, window.getComputedStyle(document.getElementById(this.id)).left.indexOf("px"))) - 3) + "px"
                }
            }
            
        } else{
            var movementEncourage = [0,0] //[x,y]
            for(const[key, value] of this.neurons){
                if(value instanceof OutputNeuron){
                    movementEncourage[0] += value.doSomething()[0]
                    movementEncourage[1] += value.doSomething()[1]
                }
            }

            if(this.findOverlap()){
                if(this.collidingEnemyIndex != -1)
                    this.fighting()
            } else{
                if(Math.abs(movementEncourage[0]) > Math.abs(movementEncourage[1])){
                    if(movementEncourage[0] > 0){ //move right
                        if((Number.parseInt(window.getComputedStyle(document.getElementById(this.id)).left.substring(0, window.getComputedStyle(document.getElementById(this.id)).left.indexOf("px"))) + 5) > 830){
                            document.getElementById(this.id).style.left = document.getElementsByClassName("game-board")[0].getBoundingClientRect().right
                            this.fighting()
                        }
                            
                        else{
                            document.getElementById(this.id).style.left = (Number.parseInt(window.getComputedStyle(document.getElementById(this.id)).left.substring(0, window.getComputedStyle(document.getElementById(this.id)).left.indexOf("px"))) + 5) + "px"
                            this.collidingTickCounter = 0
                            
                        }
                            
                    } else{ //move left
                        if((Number.parseInt(window.getComputedStyle(document.getElementById(this.id)).left.substring(0, window.getComputedStyle(document.getElementById(this.id)).left.indexOf("px"))) - 5) < 0){
                            document.getElementById(this.id).style.left = document.getElementsByClassName("game-board")[0].getBoundingClientRect().left
                            this.fighting()
                        }
                            
                        else{
                            document.getElementById(this.id).style.left = (Number.parseInt(window.getComputedStyle(document.getElementById(this.id)).left.substring(0, window.getComputedStyle(document.getElementById(this.id)).left.indexOf("px"))) - 5) + "px"
                            this.collidingTickCounter = 0
                        }
                            
                    }
                } else if(Math.abs(movementEncourage[0]) < Math.abs(movementEncourage[1])){
                    if(movementEncourage[1] > 0){ // move up
                        if((Number.parseInt(window.getComputedStyle(document.getElementById(this.id)).top.substring(0, window.getComputedStyle(document.getElementById(this.id)).top.indexOf("px"))) - 5) < 0){
                            document.getElementById(this.id).style.top = document.getElementsByClassName("game-board")[0].getBoundingClientRect().top
                            this.fighting()
                        }
                            
                        else{
                            document.getElementById(this.id).style.top = (Number.parseInt(window.getComputedStyle(document.getElementById(this.id)).top.substring(0, window.getComputedStyle(document.getElementById(this.id)).top.indexOf("px"))) - 5) + "px"
                            this.collidingTickCounter = 0
                        }
                            
                    } else{ // move down
                        if((Number.parseInt(window.getComputedStyle(document.getElementById(this.id)).top.substring(0, window.getComputedStyle(document.getElementById(this.id)).top.indexOf("px"))) + 5) >  482){
                            document.getElementById(this.id).style.top = document.getElementsByClassName("game-board")[0].getBoundingClientRect().bottom
                            this.fighting()
                        }
                            
                        else{
                            document.getElementById(this.id).style.top = (Number.parseInt(window.getComputedStyle(document.getElementById(this.id)).top.substring(0, window.getComputedStyle(document.getElementById(this.id)).top.indexOf("px"))) + 5) + "px"
                            this.collidingTickCounter = 0
                        }
                            
                    }
                }
            }

            
            
        }


        if(document.getElementById(this.id).children[0].style.width == "0px"){   //if it has collided for 3 seconds
            this.respawn()
            this.hasFlag = false
            document.getElementById(this.id).classList.remove("hasRedFlag")
            document.getElementById(this.id).classList.remove("hasBlueFlag")
        }

        if(this.collidingTickCounter == 0){
            document.getElementById(this.id).children[0].style.width = "20px"
        }

        this.xPosition = Number.parseInt(window.getComputedStyle(document.getElementById(this.id)).left.substring(0, window.getComputedStyle(document.getElementById(this.id)).left.indexOf("px")))
        this.yPosition = Number.parseInt(window.getComputedStyle(document.getElementById(this.id)).top.substring(0, window.getComputedStyle(document.getElementById(this.id)).top.indexOf("px")))
        
    }

    respawn(){
        this.ticksSinceRespawned = 0
        this.collidingTickCounter = 0
        if(this.collidingEnemyIndex != -1){
            players[this.collidingEnemyIndex].strength += 0.1
            this.strength -= 0.1
        }
        var spawnNum = this.isBlue ? Number.parseInt(this.id.substring(5)) : Number.parseInt(this.id.substring(4))

        if(this.isBlue){
            document.getElementById(this.id).style.left = spawnPoints.blue[spawnNum][0] + "px"
            document.getElementById(this.id).style.top = spawnPoints.blue[spawnNum][1] + "px"
            this.xPosition = spawnPoints.blue[spawnNum][0]
            this.yPosition = spawnPoints.blue[spawnNum][1]
        } else{
            document.getElementById(this.id).style.left = spawnPoints.red[spawnNum][0] + "px"
            document.getElementById(this.id).style.top = spawnPoints.red[spawnNum][1] + "px"
            this.xPosition = spawnPoints.red[spawnNum][0]
            this.yPosition = spawnPoints.red[spawnNum][1]
        }
        
    }

    fighting(){
        this.collidingTickCounter++
        if(this.collidingEnemyIndex != -1){
            if(players[this.collidingEnemyIndex].strength >= this.strength){
                document.getElementById(this.id).children[0].style.width = 20-(this.collidingTickCounter/15) + "px"
            }
        } else
            document.getElementById(this.id).children[0].style.width = 20-(this.collidingTickCounter/15) + "px"
    }

    detectOverlap(elem1, elem2){
        if(!(elem1.left > elem2.right || 
            elem1.right < elem2.left || 
            elem1.top > elem2.bottom || 
            elem1.bottom < elem2.top)) {
                return true
            }
        return false
    }

    findOverlap(){
        var currPlayer = document.getElementById(this.id).getBoundingClientRect()
        for(var i = 0; i<players.length; i++){
            var otherPlayer = document.getElementById(players[i].id).getBoundingClientRect()

            if(players[i].id == this.id)
                continue

            if(this.detectOverlap(otherPlayer, currPlayer) && (players[i].isBlue != this.isBlue) && this.isInvincible == false && players[i].isInvincible == false){
                this.collidingEnemyIndex = i
                return true
            }
        }
        this.collidingEnemyIndex = -1
        return false
    }

    updateHasFlag(){
        if(this.hasFlag == false){
            if(this.isBlue && this.xPosition <= 5){
                this.hasFlag = true
                document.getElementById(this.id).classList.add("hasRedFlag")
            } else if(this.isBlue == false && this.xPosition >= 825){
                this.hasFlag = true
                document.getElementById(this.id).classList.add("hasBlueFlag")
            }
        } else{
            if(this.isBlue && this.xPosition >= 825){
                this.hasFlag = false
                document.getElementById(this.id).classList.remove("hasRedFlag")
                blueScore++
            } else if(this.isBlue == false && this.xPosition <= 5){
                this.hasFlag = false
                redScore++
                document.getElementById(this.id).classList.remove("hasBlueFlag")
            }
            document.getElementsByClassName("score")[0].innerHTML = "red: " + redScore + " | blue: " + blueScore
        }
        
    }
}

class InputNeuron{
    name
    data //from -1 to 1
    connectionWeight
    player

    constructor(n, p, w){
        this.name = n
        this.player = p
        this.connectionWeight = w
    }

    calculateValue(){
        if(this.name == "xPos"){
            this.data = (this.player.xPosition)/width
        } else if(this.name == "yPos"){
            this.data = this.player.yPosition/height
        } else if(this.name == "SNE"){
            this.data = this.findNearestPlayer(true)[0].strength
        } else if(this.name == "xDNE"){
            this.data = this.findNearestPlayer(true)[1]/width
        } else if(this.name == "yDNE"){
            this.data = this.findNearestPlayer(true)[2]/height
        } else if(this.name == "xDNT"){
            this.data = this.findNearestPlayer(false)[1]/width
        } else if(this.name == "yDNT"){
            this.data = this.findNearestPlayer(false)[2]/height
        } else if(this.name == "Str"){
            this.data = this.player.strength
        }
    }

    findNearestPlayer(findEnemy){
        var nearestPlayer = this.player
        var nearestDist = 2000
        var nearestDistX
        var nearestDistY
        for(var i = 0; i<players.length; i++){
            var currPlayer = players[i]

            if(currPlayer.id != this.player.id){
                var currDist = Math.sqrt( Math.pow(this.player.xPosition - currPlayer.xPosition, 2) + Math.pow(this.player.yPosition - currPlayer.yPosition, 2))

                if(!findEnemy){ // if find teammate
                    if((currPlayer.isBlue == this.player.isBlue ) && (currDist < nearestDist)){
                        nearestPlayer = currPlayer
                        nearestDist = currDist
                        nearestDistX = nearestPlayer.xPosition
                        nearestDistY = nearestPlayer.yPosition
                    }
                } else{ //if find enemy
                    if((currPlayer.isBlue != this.player.isBlue ) && (currDist < nearestDist)){
                        nearestPlayer = currPlayer
                        nearestDist = currDist
                        nearestDistX = nearestPlayer.xPosition
                        nearestDistY = nearestPlayer.yPosition
                    }
                }
            }
            
        }

        return [nearestPlayer, nearestDistX, nearestDistY]
    }
}

class InternalNeuron{
    sum
    name

    constructor(n){
        this.name = n
        this.sum = 0
    }
}

class OutputNeuron{
    name
    sum = 0
    player
    constructor(n, p){
        this.name = n
        this.player = p
    }

    doSomething(){
        var movementEncourage = [0,0] //[x,y]
        if(this.name == "moveX"){
            movementEncourage[0] += this.sum
        } else if(this.name == "moveY"){
            movementEncourage[1] += this.sum
        }
        return movementEncourage
    }
}

function runGame(){
    if(currGameLength == 0 && document.getElementsByClassName("game-timer").length == 0){
        var div = document.createElement("div")
        div.className = "game-timer"
        document.body.appendChild(div)
        div.innerHTML = "Time left: 15 seconds"
    }
    currGameLength++
    for(let i = 0; i<20; i++){
        players[i].doAction()
    }
    document.getElementsByClassName("game-timer")[0].innerHTML = "Time left: " + (15- Math.floor(currGameLength/100)) + " seconds"
    if(currGameLength >= totalGameLength){
        document.getElementsByClassName("game-timer")[0].innerHTML = "Time left: 0 seconds"
        currGameLength = 0
        naturalSelection()
    }
}

function naturalSelection(){
    clearInterval(interval)


    var blueFitness = [0, -1, 0, -1]  //[0] = fitness, [1] = index [2] = fitness, [3] = index
    var redFitness = [0, -1, 0, -1]  //[0] = fitness, [1] = index
    for(let i = 0; i<players.length; i++){
        var currFitness = players[i].flagsCaptured * 10
        if(i < 10 && currFitness > blueFitness[0]){
            blueFitness[0] = currFitness
            blueFitness[1] = i
        }else if(i >= 10 && currFitness > redFitness[0]){
            redFitness[0] = currFitness
            redFitness[1] = i
        } else if(i < 10 && currFitness > blueFitness[2]){
            blueFitness[2] = currFitness
            blueFitness[3] = i
        }else if(i >= 10 && currFitness > redFitness[2]){
            redFitness[2] = currFitness
            redFitness[3] = i
        }
    }


    console.log(redFitness)
    for(let i = 0; i<players.length; i++){
        if(i != blueFitness[1] && i != redFitness[1] && i != blueFitness[3] && i != redFitness[3]){
            document.getElementById(players[i].id).remove()
            players[i] = null
        }
    }

    var team = ""
    var isBlue;
    var numOfReproductions = 0
    for(let i = 0; i< 20; i++){
        if(players[i] == null){
            var index = i%10 + ""
            var player = document.createElement("div")
            player.classList.add("player")
            if(i<10){
                team = "red"
                isBlue = false
                player.style.left = spawnPoints.red[index][0] + "px"
                player.style.top = spawnPoints.red[index][1] + "px"
            } else{
                team = "blue"
                isBlue = true
                player.style.left = spawnPoints.blue[index][0] + "px"
                player.style.top = spawnPoints.blue[index][1] + "px"
            }
            player.id = team + "-" + (i%10)
            var countdown = document.createElement("div")
            countdown.classList.add("countdown")
            player.appendChild(countdown)
            document.getElementsByClassName("game-board")[0].appendChild(player)
            var randomNum = Math.floor(Math.random()*10) + 1
            
            var currGeneHex = null
            if((blueFitness[1] == -1 || blueFitness[3] == -1) && isBlue){
                var randomGenome = ""
                for(let r = 0; r<numOfGenesForOrganism*8; r++){
                    randomGenome += possibleGenomes.charAt(Math.floor(Math.random() * possibleGenomes.length))
                }
                players[i] = new Player(Math.random(), team + "-" + (i%10), randomGenome, isBlue)
            } else if((redFitness[1] == -1 || redFitness[3] == -1) && isBlue == false){
                var randomGenome = ""
                for(let r = 0; r<numOfGenesForOrganism*8; r++){
                    randomGenome += possibleGenomes.charAt(Math.floor(Math.random() * possibleGenomes.length))
                }
                players[i] = new Player(Math.random(), team + "-" + (i%10), randomGenome, isBlue)
            } else{
                numOfReproductions++
                if(i == 10)
                    numOfReproductions = 0
                if(isBlue && numOfReproductions < 5)
                    currGeneHex = players[blueFitness[1]].geneHex
                else if(isBlue && numOfReproductions >= 5){
                    currGeneHex = players[blueFitness[3]].geneHex
                } else if(isBlue == false && numOfReproductions < 5)
                    currGeneHex = players[redFitness[1]].geneHex
                else if(isBlue == false && numOfReproductions >= 5){
                    currGeneHex = players[redFitness[3]].geneHex
                }
                if(randomNum <= mutationRate){
                    var randIndex = Math.floor(Math.random() * (currGeneHex.length-2)) + 1
                    currGeneHex = currGeneHex.substring(0, randIndex) + possibleGenomes[Math.floor(Math.random()*possibleGenomes.length)] + currGeneHex.substring(randIndex+1)
                }

                players[i] = new Player(Math.random(), team + "-" + (i%10), currGeneHex, isBlue)
            }
            
        }
        
    }

     for(let i = 0; i< 20; i++){
        var player = document.getElementById(players[i].id)
        var index = i%10 + ""
        if(i<10){
            player.style.left = spawnPoints.red[index][0] + "px"
            player.style.top = spawnPoints.red[index][1] + "px"
        } else{
            player.style.left = spawnPoints.blue[index][0] + "px"
            player.style.top = spawnPoints.blue[index][1] + "px"
        }
    }

    interval = setInterval(runGame, 10)
}

function repopulate(winningTeam){
    clearInterval(interval)
    blueScore = 0
    redScore = 0
    document.getElementsByClassName("score")[0].innerHTML = "red: " + redScore + " | blue: " + blueScore

    if(winningTeam == "red"){
        for(let i = 0; i<10; i++){
            var currGeneHex = players[i].geneHex
            var randIndex = Math.floor(Math.random() * (currGeneHex.length-2)) + 1
            var newGeneHex = currGeneHex.substring(0, randIndex) + possibleGenomes[Math.floor(Math.random()*possibleGenomes.length)] + currGeneHex.substring(randIndex+1)
            players[i+10] = new Player(Math.random(), "blue" + "-" + (i%10), newGeneHex, true)
        }
    } else{
        for(let i = 10; i<20; i++){
            var currGeneHex = players[i].geneHex
            var randIndex = Math.floor(Math.random() * (currGeneHex.length-2)) + 1
            var newGeneHex = currGeneHex.substring(0, randIndex) + possibleGenomes[Math.floor(Math.random()*possibleGenomes.length)] + currGeneHex.substring(randIndex+1)
            players[i-10] = new Player(Math.random(), "red" + "-" + (i%10), newGeneHex, false)
        }
    }

    for(let i = 0; i< 20; i++){
        var player = document.getElementById(players[i].id)
        var index = i%10 + ""
        if(i<10){
            player.style.left = spawnPoints.red[index][0] + "px"
            player.style.top = spawnPoints.red[index][1] + "px"
        } else{
            player.style.left = spawnPoints.blue[index][0] + "px"
            player.style.top = spawnPoints.blue[index][1] + "px"
        }
    }

    interval = setInterval(runGame, 10)
}

var interval

function start(){
    var team = ""
    var isBlue;
    for(let i = 0; i< 20; i++){
        var randomGenome = ""
        for(let r = 0; r<numOfGenesForOrganism*8; r++){
            randomGenome += possibleGenomes.charAt(Math.floor(Math.random() * possibleGenomes.length))
        }
        var index = i%10 + ""

        var player = document.createElement("div")
        player.classList.add("player")
        if(i<10){
            team = "red"
            isBlue = false
            player.style.left = spawnPoints.red[index][0] + "px"
            player.style.top = spawnPoints.red[index][1] + "px"
        } else{
            team = "blue"
            isBlue = true
            player.style.left = spawnPoints.blue[index][0] + "px"
            player.style.top = spawnPoints.blue[index][1] + "px"
        }
        player.id = team + "-" + (i%10)
        var countdown = document.createElement("div")
        countdown.classList.add("countdown")
        player.appendChild(countdown)
        document.getElementsByClassName("game-board")[0].appendChild(player)
        players[i] = new Player(Math.random(), team + "-" + (i%10), randomGenome, isBlue)
    }

    interval = setInterval(runGame, 10)
}


function bob(){
    /*for(var i = 0; i<20; i++){
        console.log(players[i].neurons)
    }

    console.log(document.getElementsByClassName("game-board")[0].getBoundingClientRect())*/
    console.log(document.getElementById(players[0].id).getBoundingClientRect())
}


start()
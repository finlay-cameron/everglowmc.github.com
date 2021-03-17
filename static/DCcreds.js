function sendDM(id, thismess){
    const whurl = ""
    var msg = {
        "content": id+"\n"+thismess
    }
    fetch(whurl,
        {"method":"POST", 
        "headers": {"content-type": "application/json"},
        "body": JSON.stringify(msg)})
}

function showFactions(){
    var listitem
    var ul = document.getElementById("FactionList")
    window.factions.forEach(element=>{
        listitem = document.createElement("li")
        listitem.appendChild(document.createTextNode("Faction: "+element["info"]["name"]+" || Tag: "+element["factionTag"]))
        ul.appendChild(listitem)
        ul.style.display=""
    })
    setTimeout(function(){ var ul = document.getElementById("FactionList"); ul.style.display="none"; ul.innerHTML=""}, 10000);
}

function getfactions(after){
    AWS.config.update({
        region: "us-east-2",
        accessKeyId: "",
        secretAccessKey: ""
    });
    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: "everglow-accounts",
    }
    docClient.scan(params, function (err, data) {
        if (err){
            console.log(err)
        }else{
            var factions = []
            data["Items"].forEach(element => {
                if (element["faction"]==true){
                    factions.push(element)
                }
            })
            window.factions=factions
            if (typeof(after)=="function"){after()}
        }
    })
}

function createaccount() {
    var newuser = document.getElementById("MCname").value;
    axios.get("https://lit-castle-98233.herokuapp.com/https://api.mojang.com/users/profiles/minecraft/"+newuser)
    .then(data => {
        if (data["status"]==200){
            var docClient = new AWS.DynamoDB.DocumentClient();
            ft=""
            if (document.getElementById("FT").value){
                ft = window.factions.find(x=>x["factionTag"]===document.getElementById("FT").value)
                if (!ft){
                    status("Faction tag not found")
                    return;
                }
            }
        var params = {
            TableName: "everglow-accounts",
            Item:{
                faction:false,
                factionTag:ft,
                id:window.id,
                info:{
                    debt:0,
                    minecraftName:newuser,
                    discordName:window.dcuser,
                    ed:0,
                }
            }
        }
        docClient.put(params, function(err, data){
            if (err) {
                console.log(err)}
            else{window.location.href="/account#"+window.dcdata;}})}else{
                status("Minecraft name not valid")
            }})
    .catch(err => {document.getElementById("status").innerText=err})}

function changeName() {
    var newuser = document.getElementById("newName").value;
    axios.get("https://lit-castle-98233.herokuapp.com/https://api.mojang.com/users/profiles/minecraft/"+newuser)
    .then(data => {
        if (data["status"]==200){
        var docClient = new AWS.DynamoDB.DocumentClient();
        var tagem = ""
        var owe = 0
        if (window.ft&&window.ft!=""){
            tagem = window.ft
            owe=window.debt
        }
        var params = {
            TableName: "everglow-accounts",
            Item:{
                id:window.id,
                faction:false,
                factionTag:tagem,
                info:{
                    debt:owe,
                    minecraftName:newuser,
                    discordName:window.dcuser,
                    ed:window.money,
                }
            }
        }
        docClient.put(params, function(err, data){
            if (err) {
                console.log(err)}
            else{status("Updated Minecraft username")
            getinfo(Updateinfo)}})}
    else{
        status("Error: Name not valid")
    }})
    .catch(err => status(err))}

function transfer(){
    if (parseInt(document.getElementById("Amount").value)){
    if (window.money>=parseInt(document.getElementById("Amount").value)){ if (parseInt(document.getElementById("Amount").value)>=1){
    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: "everglow-accounts",
    }
    docClient.scan(params, function (err, data) {
        if (err) {
            status(err)
        }else{
            params=undefined
            if (document.getElementById("TransferID").value!=window.dcuser){ if (document.getElementById("TransferID").value!=""){
            data["Items"].forEach(element => {
                if (element["info"]["discordName"]==document.getElementById("TransferID").value){
                    params={TableName:"everglow-accounts",Item:element}
                    params["Item"]["info"]["ed"]+=parseInt(document.getElementById("Amount").value)
                    var tagem = ""
                    var owe = 0
                    if (window.ft&&window.ft!=""){
                        tagem = window.ft
                        owe=window.debt
                    }
                    otheruser={
                        TableName: "everglow-accounts",
                        Item:{
                            id:window.id,
                            faction:false,
                            factionTag:tagem,
                            info:{
                                debt:owe,
                                minecraftName:window.mcuser,
                                discordName:window.dcuser,
                                ed:window.money-=parseInt(document.getElementById("Amount").value),
                            }
                        }
                    }
                }
            });
            if (params){
            var docClient = new AWS.DynamoDB.DocumentClient();
            docClient.put(params, function(err, data){
                if (err) {
                    status(err)}else{
                    docClient.put(otheruser, function(err, data){
                        if (err) {
                            status(err)}else{
                            status("Payment made")
                            if (document.getElementById("Reciept").checked){
                                var say = "e$"+document.getElementById("Amount").value+"\n<@"+window.id+">\n<@"+params["Item"]["id"]+">"
                                if (document.getElementById("Reason").value){
                                    say+="\n"+document.getElementById("Reason").value
                                }
                            sendDM(window.id, say)
                            sendDM(params["Item"]["id"], say)}
                }})}})
                }else{status("User not found")}
            }else{status("You have to send money to someone.")}
        }else{status("You cant send money to yourself.")}
    }})}else{status("You cant give people less than 1 e$.")}
}else{status("If you send that much money you'll be broke.")}
}else{status("Thats not a number")}}

function status(setto){
    document.getElementById("status").innerText=setto
    setTimeout(function(){document.getElementById("status").innerText=""}, 5000)
}

function getinfo(after) {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    var dcdata = window.location.href.split("#")[window.location.href.split("#").length-1]
    var arr = [].slice.call(document.getElementsByClassName("nav-link"));
    [].slice.call(document.getElementsByClassName("homelink")).forEach(thing=>{
        arr.push(thing)
    })
    arr.forEach(thing => {
        thing.href=thing.href+"#"+dcdata
    })
    window.dcdata=dcdata
    if (fragment.has("access_token")) {
        const accessToken = fragment.get("access_token");
        const tokenType = fragment.get("token_type");

        fetch('https://discord.com/api/users/@me', {
            headers: {
                authorization: `${tokenType} ${accessToken}`
            }
        })
            .then(res => res.json())
            .then(response => {
                window.username=response["username"]
                window.id=response["id"]
                AWS.config.update({
                    region: "us-east-2",
                    accessKeyId: "",
                    secretAccessKey: ""
                });
                var docClient = new AWS.DynamoDB.DocumentClient();
                var params = {
                    TableName: "everglow-accounts",
                    Key:{
                        id:window.id
                    }
                }
                docClient.get(params, function (err, data) {
                    if (err) {
                        console.log(err)
                    }else{
                        if (data["Item"]) {
                        window.money=data["Item"]["info"]["ed"]
                        window.mcuser=data["Item"]["info"]["minecraftName"]
                        window.dcuser=data["Item"]["info"]["discordName"]
                        window.ft=data["Item"]["factionTag"]
                        window.debt=data["Item"]["info"]["debt"]
                        if (typeof(after)=="function"){after()}
                    }else{
                        window.dcuser=response["username"]
                        window.location.href="/create-account#"+dcdata
                    }}})})}
                        else {window.location.href = "https://discord.com/api/oauth2/authorize?client_id=817046480539222028&redirect_uri=https%3A%2F%2Feverglowmc.github.io%2Findex.html&response_type=token&scope=identify"}}

function Updateinfo() {
var bal = "You have e$" + window.money + "\n"
var disc = "Your discord name is " + window.dcuser + "\n"
var mc = "Your minecraft name is " + window.mcuser + "\n"
last="You dont have a faction"
if (window.ft) {
var fact = "Your faction tag is " + window.ft + "\n"
var debt = "You have e$" + window.debt + " debt \n"
last=fact+debt}
document.getElementById("balance").innerText=bal+disc+mc+last
document.getElementById("change").style.display=""
document.getElementById("newName").style.display=""
}

function callback(after){
    setTimeout(function(){after()}, 600)
}

function pay(cash){
    if (parseInt(cash)){
    if (parseInt(cash)>=1){
        if (parseInt(cash)<=window.debt){
            if (window.money>=parseInt(cash)){
                window.debt=window.debt-parseInt(cash)
                window.money=window.money-parseInt(cash)
                var params = {
                    TableName:"everglow-accounts",
                    Item:{
                    id:window.id,
                    faction:false,
                    factionTag:window.ft,
                    info:{
                        debt:window.debt,
                        discordName:window.dcuser,
                        ed:window.money,
                        minecraftName:window.mcuser
                    }}
                }
                var docClient = new AWS.DynamoDB.DocumentClient();
                docClient.put(params, function(err, data){
                    if (err) {
                        status(err)
                    }
                })}else{status("You don't have enough money to pay of that amount of debt.")}}
                else{status("That's more debt than you need to pay!")}
            }else{status("You cant pay minus debt")}
        }else{status("That is not a number")}
}

function giveDebt(amount){
    if (parseInt(amount)){
    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: "everglow-accounts",
    }
    docClient.scan(params, function (err, data) {
        if (err) {
            status(err)
        }else{
            window.admins=data["Items"].find(x=>x["factionTag"]===window.ft&&x["faction"]==true)
            data["Items"].forEach(element=>{
                if (element["factionTag"]==window.ft&&element["faction"]==false&&window.admins.includes(window.id)&&!window.admins.includes(element["id"])){
                    element["info"]["ed"]=element["info"]["ed"]-parseInt(amount)
                    if (element["info"]["ed"]<0){
                        element["info"]["debt"]=element["info"]["debt"]+element["info"]["ed"]*-1
                        element["info"]["ed"]=0
                    }
                    params = {
                        TableName:"everglow-accounts",
                        Item:element
                    }
                    docClient.put(params, function(err, data){
                        if (err) {
                            status(err)
                        }
                    })
                }
            })
        }
    })
    }
}

function AdminPanel(){
    var div = document.createElement("div")
    var Debt = document.createElement("form")
    var label = document.createElement("label")
    label.appendChild(document.createTextNode("Charge members: "))
    var inp = document.createElement("input")
    inp.type="text"
    inp.id="dbamount"
    var but = document.createElement("button")
    but.className="fancy-button"
    but.id="issuedebt"
    but.appendChild(document.createTextNode("Charge members"))
    Debt.appendChild(label)
    Debt.appendChild(inp)
    Debt.appendChild(but)
    
    var Issue = document.createElement("form")
    var label1 = document.createElement("label")
    label1.appendChild(document.createTextNode("Issue e$: "))
    Issue.appendChild(label1)

    var User = document.createElement("form")
    var label2 = document.createElement("label")
    label2.appendChild(document.createTextNode("User: "))
    var inp1 = document.createElement("input")
    inp1.type="text"
    inp1.id="User"
    User.appendChild(label2)
    User.appendChild(inp1)

    var Amount = document.createElement("form")
    var label2 = document.createElement("label")
    label2.appendChild(document.createTextNode("Amount: "))
    var inp2 = document.createElement("input")
    inp2.type="text"
    inp2.id="AMOUNT"
    Amount.appendChild(label2)
    Amount.appendChild(inp2)
    var but = document.createElement("button")
    but.className="fancy-button"
    but.id="IssueED"
    but.appendChild(document.createTextNode("Issue e$"))
    Amount.appendChild(but)

    div.appendChild(Debt)
    div.appendChild(document.createElement("br"))
    div.appendChild(document.createElement("br"))
    div.appendChild(Issue)
    div.appendChild(document.createElement("br"))
    div.appendChild(User)
    div.appendChild(Amount)
    return div
}

function MemberPanel(){
    var div = document.createElement("div")
    var br = document.createElement("br")
    var p1 = document.createElement("p")
    p1.className="debt"
    p1.appendChild(document.createTextNode("You have e$"+window.debt+" debt."))
    var payall=document.createElement("button")
    payall.className="fancy-button"
    payall.appendChild(document.createTextNode("Pay all debt"))
    payall.onclick=function(){pay(window.debt)}
    var amount = document.createElement("form")
    var label = document.createElement("label")
    label.appendChild(document.createTextNode("Pay amount: "))
    var inp = document.createElement("input")
    inp.type="text"
    inp.id="paymount"
    var but = document.createElement("button")
    but.className="fancy-button"
    but.id="paysome"
    but.appendChild(document.createTextNode("Pay"))
    amount.appendChild(label)
    amount.appendChild(inp)
    amount.appendChild(but)

    div.appendChild(br)
    div.appendChild(p1)
    div.appendChild(br)
    div.appendChild(br)
    div.appendChild(payall)
    div.appendChild(br)
    div.appendChild(amount)
    return div
}

function IssueED(user, amount){
    if (parseInt(amount)){
    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: "everglow-accounts",
    }
    docClient.scan(params, function (err, data) {
        if (err){
            console.log(err)
        }else{
            window.good = false
            data["Items"].forEach(element=>{
                if (element["faction"]){
                    if (element["factionTag"]==window.ft){
                        if (element["info"]["ed"]>=parseInt(amount)){
                            window.good=true
                            window.transferfact = element
                        }else{status("Your faction does not have enough e$")}
                    }
                }else{
                    if (!element["faction"]){
                        if (element["info"]["discordName"]==user){
                            window.targetusr = element
                        }
                    }
                }
            })
            if (window.good) {
                if (amount<0){
                window.targetusr["info"]["ed"]=window.targetusr["info"]["ed"]+parseInt(amount)
                window.transferfact["info"]["ed"]=window.transferfact["info"]["ed"]-parseInt(amount)
                var usr = {TableName:"everglow-accounts", Item:window.targetusr}
                var fact = {TableName:"everglow-accounts", Item:window.transferfact}
                docClient.put(usr , function(err, data){
                    if (err){
                        console.log(err)
                    }
                })
                docClient.put(fact, function(err, data){
                    if (err){
                        console.log(err)
                    }
                })
            }else{status("You can't issue minus e$")}
        }
        }
    })}else{status("The e$ you issue must be a number")}
}

function joinfaction(){
    var ft = window.factions.find(x=>x["factionTag"]==document.getElementById("FT").value)["factionTag"]
    if (!ft){
        status("Faction tag not found")
        return;
    }else{
        if (window.ft==""||!window.ft){
            var params={
                TableName: "everglow-accounts",
                Item:{
                    faction:false,
                    factionTag:ft,
                    id:window.id,
                    info:{
                        debt:0,
                        minecraftName:window.mcuser,
                        discordName:window.dcuser,
                        ed:window.money,
                    }
            }
            }
            var docClient = new AWS.DynamoDB.DocumentClient();
            docClient.put(params, function(err, data){
                if (err) {
                    status(err)
                }else{
                    location.reload()
                }
            })
        }
    }
}

function leavefaction(l){
    if (l&&!l){
    var params = {
        TableName:"everglow-accounts",
        Item:{
        id:window.id,
        faction:false,
        factionTag:"",
        info:{
            debt:0,
            discordName:window.dcuser,
            ed:window.money,
            minecraftName:window.mcuser
        }}
    }
    var docClient = new AWS.DynamoDB.DocumentClient();
    docClient.put(params, function(err, data){
        if (err) {
            status(err)
        }
    })}
}

function factionCheck(){
    if (window.ft){
        window.factions.forEach(element=>{
            if (element["factionTag"]==window.ft){
                document.getElementById("Have").innerText="You are in "+element["info"]["name"]
                if (element["info"]["admins"].includes(window.id)){
                    document.getElementById("Role").innerText="You are an admin of your faction"
                    panel = AdminPanel()
                    document.getElementById("Panel").appendChild(panel)
                    document.getElementById("issuedebt").onclick=function(){giveDebt(document.getElementById("dbamount").value)}
                    document.getElementById("IssueED").onclick=function(){IssueED(document.getElementById("User").value, document.getElementById("AMOUNT").value)}
                }else{
                    panel = MemberPanel()
                    document.getElementById("Panel").appendChild(panel)
                    document.getElementById("paysome").onclick=function(){pay(parseInt(document.getElementById("paymount").value))}
                }
            }
        })
    }else{
        var have = document.getElementById("Have")
        have.innerText="You are not in a faction!"
        document.getElementById("Panel").innerHTML=`<form style="display:inline;"><label>Your faction tag: </label><input id="FT" type="text"><br><br></form>
        <button onclick="getfactions(showFactions)" class="fancy-button">Show faction tags</button><br>
        <u id="FactionList"></u>
        <button onclick="getfactions(joinfaction)" class="fancy-button">Join faction</button><br>`
    }
}

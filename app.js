const express = require("express");
const app = express();
const PORT = process.env.PORT || 80;
const fs = require("fs");
let stor = {};
let running_servers = [];

function send_data (res) {
    res.send({result:stor,basic:[{data:"LEstart"},{data:"v1.0"}],running_servers:running_servers});
}

function find_server(arg) {
    var server_finded = false;
    var server_id;
    for(var i = 0; i < running_servers.length; i++) {
        if (running_servers[i].server == arg) {
            server_finded = true;
            server_id = i;
            break;
        }
    }
    return {res:server_finded,id:server_id};
}

function isNumber(num) {
    if (typeof num === 'number') {
      return true;
    }
  
    var reg = new RegExp("\^\-\?\\\d\+\\\.\?\\\d\*\$");
  
    if (typeof num === 'string' && reg.test(num)) {
      return true;
    } else {
      return false;
    }
}

function installScript(version,ip,protocol){
    switch (version) {
        case "1.0":
            return fs.readFileSync("LiveEntryClient-1.0.html","utf-8").replace(/%0/gi,ip).replace(/https/gi,protocol);
        default:
            return;
    }
}

app.all('/*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	next();
});

app.get('/' , (req,res) => {
    send_data(res);
});

app.get('/reg/*', (req,res) => {
    var arg = req.url.replace('/reg/','');
    if(!(arg == "")) {
        if(!(find_server(arg).res)) {
            running_servers.push({server:arg,port:[]});
            stor[arg] = {};
            send_data(res);
        } else {
            res.send({Error:"Server already exist."});
        }
    } else {
        res.send({Error:"Server name undefined."});
    } 
});

app.get('/unreg/*', (req,res) => {
    var arg = req.url.replace('/unreg/','');
    if(!(arg == "")) {
        if(find_server(arg).res) {
            running_servers.splice(find_server(arg).id,1);
            delete stor[arg];
            send_data(res);
        } else {
            res.send({Error:"Cannot Found Server."});
        }
    } else {
        res.send({Error:"Server name undefined."});
    } 
});

app.get('/port/open/*/*', (req,res) => {
    var servername = req.url.replace('/port/open/','').split('/')[0];
    var port = parseInt(req.url.replace('/port/open/','').split('/')[1]);
    if(port != ""){
        if(servername != ""){
            if(find_server(servername).res) {
                if(!(running_servers[find_server(servername).id].port.indexOf(port) > -1)){
                    running_servers[find_server(servername).id].port.push(port);
                    stor[servername][port] = {};
                    send_data(res);
                } else {
                    res.send({Error:"Port already opened."});
                }
            } else {
                res.send({Error:"Cannot Found Server."});
            }
        } else {
            res.send({Error:"ServerName is Empty."});
        }
    } else {
        res.send({Error:"Port is Empty."});
    }
});

app.get('/port/close/*/*', (req,res) => {
    var servername = req.url.replace('/port/close/','').split('/')[0];
    var port = parseInt(req.url.replace('/port/close/','').split('/')[1]);
    if(port != ""){
        if(servername != ""){
            if(find_server(servername).res) {
                if(running_servers[find_server(servername).id].port.indexOf(port) > -1) {
                    running_servers[find_server(servername).id].port.splice(running_servers[find_server(servername).id].port.indexOf(port),1);
                    delete stor[servername][port];
                    send_data(res);
                } else {
                    res.send({Error:"That port is not opened."});
                }
            } else {
                res.send({Error:"Cannot Found Server."});
            }
        } else {
            res.send({Error:"ServerName is Empty."});
        }
    } else {
        res.send({Error:"Port is Empty."});
    }
});

app.get('/value/calc/*/*/', (req,res) => {
    var servername = req.url.replace('/value/calc/','').split('/')[0];
    var port = parseInt(req.url.replace('/value/calc/','').split('/')[1]);
    var objectname = req.query.objectname;
    var objecttype = req.query.objecttype;
    var opcode = req.query.opcode;
    var value = req.query.arg0;
    var value_ = req.query.arg1;
    if(port != ""){
        if(servername != ""){
            if(typeof objectname != "undefined") {
                if(objecttype == "list"){
                    switch (opcode) {
                        case "APPEND":
                            if(find_server(servername).res) {
                                if(running_servers[find_server(servername).id].port.indexOf(port) > -1) {
                                    stor[servername][port][objectname].data_.push({data:value});
                                    send_data(res);
                                } else {
                                    res.send({Error:"That port is not opened."});
                                }
                            } else {
                                res.send({Error:"Cannot Found Server."});
                            }
                            break;
                        case "DELETE":
                            if(find_server(servername).res) {
                                if(running_servers[find_server(servername).id].port.indexOf(port) > -1) {
                                    stor[servername][port][objectname].data_.splice(value,1);
                                    send_data(res);
                                } else {
                                    res.send({Error:"That port is not opened."});
                                }
                            } else {
                                res.send({Error:"Cannot Found Server."});
                            }
                            break;
                        case "MODIFY":
                            if(find_server(servername).res) {
                                if(running_servers[find_server(servername).id].port.indexOf(port) > -1) {
                                    stor[servername][port][objectname].data_[value] = {data:value_};
                                    send_data(res);
                                } else {
                                    res.send({Error:"That port is not opened."});
                                }
                            } else {
                                res.send({Error:"Cannot Found Server."});
                            }
                            break;
                        case "INSERT":
                            if(find_server(servername).res) {
                                if(running_servers[find_server(servername).id].port.indexOf(port) > -1) {
                                    stor[servername][port][objectname].data_.splice(value,0,value_);
                                    send_data(res);
                                } else {
                                    res.send({Error:"That port is not opened."});
                                }
                            } else {
                                res.send({Error:"Cannot Found Server."});
                            }
                            break;
                        default:
                            res.send({Error:"Something went wrong."});
                            break;
                    }
                } else if (objecttype == "var") {
                    switch (opcode) {
                        case "SET":
                            if(find_server(servername).res) {
                                if(running_servers[find_server(servername).id].port.indexOf(port) > -1) {
                                    stor[servername][port][objectname].data_ = value;
                                    send_data(res);
                                } else {
                                    res.send({Error:"That port is not opened."});
                                }
                            } else {
                                res.send({Error:"Cannot Found Server."});
                            }
                            break;
                        case "ADD":
                            if(find_server(servername).res) {
                                if(running_servers[find_server(servername).id].port.indexOf(port) > -1) {
                                    if (isNumber(value) && isNumber(stor[servername][port][objectname].data_)) {
                                        stor[servername][port][objectname].data_ = parseInt(stor[servername][port][objectname].data_) + parseInt(value);
                                    } else {
                                        stor[servername][port][objectname].data_ = stor[servername][port][objectname].data_.concat(value);
                                    }
                                    send_data(res);
                                } else {
                                    res.send({Error:"That port is not opened."});
                                }
                            } else {
                                res.send({Error:"Cannot Found Server."});
                            }
                            break;
                        default:
                            break;
                    }
                }
            } else {
                res.send({Error:"objectname is Empty."});
            }
        } else {
            res.send({Error:"ServerName is Empty."});
        }
    } else {
        res.send({Error:"Port is Empty."});
    }
});

app.get('/value/reg/*/*', (req,res) => {
    var servername = req.url.replace('/value/reg/','').split('/')[0];
    var port = parseInt(req.url.replace('/value/reg/','').split('/')[1]);
    var objectname = req.query.objectname;
    var objecttype = req.query.objecttype;
    if(port != ""){
        if(servername != ""){
            if(typeof objectname != "undefined") {
                switch(objecttype){
                    case "list":
                        if(typeof stor[servername] != "undefined"){
                            if(typeof stor[servername][port] != "undefined"){
                                if (typeof stor[servername][port][objectname] == "undefined") {
                                    stor[servername][port][objectname] = {data_:[],type:'list'};
                                    send_data(res);
                                } else {
                                    res.send({Error:"Already registered."});
                                }
                            } else {
                                res.send({Error:"That port is not opened."});
                            }
                        } else {
                            res.send({Error:"Server Cannot Found."});
                        }
                        break;
                    case "var":
                        if(typeof stor[servername] != "undefined"){
                            if(typeof stor[servername][port] != "undefined"){
                                if (typeof stor[servername][port][objectname] == "undefined") {
                                    stor[servername][port][objectname] = {data_:"",type:'var'};
                                    send_data(res);
                                } else {
                                    res.send({Error:"Already registered."});
                                }
                            } else {
                                res.send({Error:"That port is not opened."});
                            }
                        } else {
                            res.send({Error:"Server Cannot Found."});
                        }
                        break;
                    default:
                        res.send({Error:"Something went wrong."});
                        break;
                }
            } else {
                res.send({Error:"objectname is Empty."});
            }
        } else {
            res.send({Error:"ServerName is Empty."});
        }
    } else {
        res.send({Error:"Port is Empty."});
    }
});

app.get('/checkServer/*', (req,res) => {
    var servername = req.url.replace('/checkServer/','');
    // res.send({"status":function(){if(find_server(servername).res){return 'Opened'}else{return 'Closed'}}});
    if(find_server(servername).res){
        res.send({"status":"Opened"});
    } else {
        res.send({"status":"Closed"});
    }
});

app.get('/checkPort/*/*', (req,res) => {
    var servername = req.url.replace('/checkPort/','').split('/')[0];
    var port = parseInt(req.url.replace('/checkPort/','').split('/')[1]);
    if(port != ""){
        if(servername != ""){
            if ((running_servers[find_server(servername).id].port).indexOf(port) > -1) {
                res.send({"status":"Opened"});
            } else {
                res.send({"status":"Closed"});
            }
        } else {
            res.send({Error:"ServerName is Empty."});
        }
    } else {
        res.send({Error:"Port is Empty."});
    }
});

app.get('/install', (req,res) => {
    res.send(installScript("1.0",req.host,'https'));
});

app.listen(PORT, () => {console.log(`LiveEntry Started at ${PORT}`);});
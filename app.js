const http = require('http');
const fs = require('fs');
const ejs = require('ejs');
const qs = require('querystring');

const index_page = fs.readFileSync("index.ejs","utf8");
const login_page = fs.readFileSync("login.ejs","utf8");
const kakolog_page = fs.readFileSync("kakolog.ejs","utf8")

//メッセージ最大保管数
const max_num = 10
const filename = "mydata.txt";
const kakolog = "kakolog.txt";
let message_data;
let kakolog_data;
readFromFile(filename,kakolog);

//サーバを構築
let server = http.createServer(getFromClient);

//port3000でサーバを待ち状態にする
server.listen(3000);
console.log("Server Start!!");


//以下、利用する関数リスト

//createServerに渡す処理（サーバが呼び出された時に実行される）
function getFromClient(request, response){
    const baseURL = 'http://' + request.headers.host + '/';
    let url_parts = new URL(request.url, baseURL);

    switch(url_parts.pathname){

        case '/':
            response_index(request, response);
            break;

        case '/login':
            response_login(request, response);
            break;
        
        case '/kakolog':
            response_kakolog(request, response);
            break;
        
        default:
            response.writeHead(200,{'Content-Type': 'text/plain'});
            response.end('no page....');
            break;
    }
}

//loginアクセス処理
function response_login(request, response){
    let content = ejs.render(login_page,{});
    response.writeHead(200,{'Content-Type': 'text/html'});
    response.write(content);
    response.end();
}

//indexのアクセス処理
function response_index(request, response){
    //POSTアクセス時の処理
    if(request.method == "POST"){
        let body = "";

        //データ受信のイベント処理
        request.on("data",(data) =>{
            body += data;
        })

        //データ受信終了のイベント処理
        request.on("end",() => {
            //クエリ文字列からパースしてオブジェクトを返す
            data = qs.parse(body);
            addToData(data.id,data.msg,filename, kakolog, request);
            write_index(request, response);
        });
    }
    else{
        write_index(request, response);
    }
}

//Indexのページ作成
function write_index(request, response){
    const msg = "Enter somthing";
    const content = ejs.render(index_page,{
        title: 'index',
        content: msg,
        data: message_data,　
        filename: 'data_item',
    });

    response.writeHead(200,{'Content-Type':'text/html'});
    response.write(content);
    response.end();
}

//過去ログのアクセス処理
function response_kakolog(request, response){

    const content = ejs.render(kakolog_page,{
        data: kakolog_data,　
        filename: 'data_item',
    });

    response.writeHead(200,{'Content-Type':'text/html'});
    response.write(content);
    response.end();
}

//テキストファイルをロード
function readFromFile(fname, kakolog){
    fs.readFile(fname,'utf8',(err,data) => {
        //ファイルから読み取った文字列を改行コードで区切って配列にする
        message_data = data.split('\n');
    })
    fs.readFile(kakolog,'utf8',(err,data) => {
        kakolog_data = data.split('\n');
    })
}

//データを更新
function addToData(id, msg, fname, kakolog, request){
    let time = new Date();
    const obj = {'id':id, 'msg':msg ,'time':time.getHours() + "時" + time.getMinutes() + "分" + time.getSeconds() + "秒",};
    const obj_str = JSON.stringify(obj);
    console.log('add data: ' + obj_str);
    message_data.unshift(obj_str);
    kakolog_data.unshift(obj_str);
    if(message_data.length > max_num){
        message_data.pop();
    }
    saveToFile(fname,kakolog);
}

//データを保存
function saveToFile(fname, kakolog){
    const data_str = message_data.join('\n');
    const kakolog_str = kakolog_data.join("\n");
    fs.writeFile( fname, data_str,(err) => {
        if(err){throw err;};
    });
    fs.writeFile( kakolog, kakolog_str,(err) => {
        if(err){throw err;};
    });
}
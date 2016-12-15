var Planning = require('./index');

// var obj = new Planning("8241fc38732002141317a107b7ce989cd1bb95aa76bef7d8013f8ecf19fbd900729809d86cd297df23343573b6d8e6dca84371115c57ce3f92b82f42d84baba9ad770359a5f53f56f7c903b47fbaea3f809e79060ee999f4df6c31ef932e3e6c85f2b25bc040fa19498424fc3aa6bf4a7b701a69e4929514a885d1cf1c1a74d421cc8a1e31f0ca00be7c9db77b1b15d9a47c1e9b682d7428126e69f83c1b3920dbf65ba57e2fd7f3995819b0e211f491b4ef9aba751bdce73a0eaecf799cbced50c55e7f25926a723ae4bd107b2ce328d4a2ff76e2f7d5696ca90484c4b2ac6af9c4bc151f5a34001d9b6310a318facbf377b612dec2c5fba5147d40716acb136310d0ae215603f5");
// var obj = new Planning("8241fc387320021460d62b880601db3b64f024f9f358aca3f8c622193b252c7c70ca02662d77329d659f71eb5a546079ab0d0ef21be75acf7c140d03600301e2f68b608172d7a40a23f88ba273aab1d0acd7b24671b1194634ae47158ec67a871331a2981729d29a504cdf3c1acef8543cfd5b81b930e6b64fdfbb1046e3de9bbcfeea78fed0a8b4");


// obj.updatePlanning(()=>{
    // console.log(obj.data.courses.length);
    // console.log(obj.data.courses[0]);

    // console.log(obj.getCourses(["2C1","2C","2"]));
// });

var obj = new Planning();

obj.loadPlanning('planning.ics', ()=>{
    console.log(obj.data.courses.length);
    console.log(obj.data.courses[0]);

    console.log(obj.getCourses(["2C1","2C","2"]));
});
